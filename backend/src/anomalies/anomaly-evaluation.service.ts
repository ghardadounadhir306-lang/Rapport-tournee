import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { TmsFormData } from '../tms/entities/tms-form-data.entity';
import { ANOMALY_TYPE_CODES } from './anomaly-type-codes';
import { Anomaly } from './entities/anomaly.entity';
import { AnomalyType } from './entities/anomaly-type.entity';

export { ANOMALY_TYPE_CODES };

function requiredFieldChecks(): Array<{ key: keyof TmsFormData; label: string }> {
  const base: Array<{ key: keyof TmsFormData; label: string }> = [
    { key: 'date', label: 'date' },
    { key: 'driver', label: 'conducteur' },
    { key: 'truck', label: 'camion' },
  ];
  if (process.env.ANOMALY_STRICT_REQUIRED === 'true') {
    base.push(
      { key: 'prestationId', label: 'prestation_id' },
      { key: 'siteId', label: 'site_id' },
    );
  }
  return base;
}

@Injectable()
export class AnomalyEvaluationService {
  private readonly logger = new Logger(AnomalyEvaluationService.name);
  private typeIdsCache: Map<string, number> | null = null;

  constructor(
    @InjectRepository(TmsFormData)
    private readonly formRepo: Repository<TmsFormData>,
    @InjectRepository(Anomaly)
    private readonly anomalyRepo: Repository<Anomaly>,
    @InjectRepository(AnomalyType)
    private readonly typeRepo: Repository<AnomalyType>,
  ) {}

  private async typeIdsByCode(): Promise<Map<string, number>> {
    if (this.typeIdsCache?.size) return this.typeIdsCache;
    const rows = await this.typeRepo.find();
    this.typeIdsCache = new Map(rows.map((r) => [r.code, r.id]));
    return this.typeIdsCache;
  }

  /** Run after a tour form is saved: refresh persisted anomalies for this tour and duplication cluster. */
  async evaluateAfterSave(tourneeId: string): Promise<void> {
    try {
      const types = await this.typeIdsByCode();
      if (types.size === 0) {
        this.logger.warn('anomaly_types vide — exécutez sql/patches/011_anomalies_and_form_ids.sql');
        return;
      }

      const form = await this.formRepo.findOne({ where: { id: tourneeId } });
      if (!form) return;

      await this.refreshSingleTourAnomalies(form, types);
      await this.refreshDuplicationCluster(form, types);
    } catch (e) {
      this.logger.warn(`anomaly evaluation failed: ${String((e as Error)?.message ?? e)}`);
    }
  }

  private async deleteForTourAndCodes(tourneeId: string, codes: string[], types: Map<string, number>) {
    const ids = codes.map((c) => types.get(c)).filter((id): id is number => id != null);
    if (!ids.length) return;
    await this.anomalyRepo
      .createQueryBuilder()
      .delete()
      .from(Anomaly)
      .where('tournee_id = :tid', { tid: tourneeId })
      .andWhere('anomaly_type_id IN (:...typeIds)', { typeIds: ids })
      .execute();
  }

  private async refreshSingleTourAnomalies(form: TmsFormData, types: Map<string, number>) {
    const tid = form.id;
    await this.deleteForTourAndCodes(
      tid,
      [
        ANOMALY_TYPE_CODES.ABSENCE_LISTE_COLISAGE,
        ANOMALY_TYPE_CODES.ORDRE_MAGASIN_NON_CONFORME,
        ANOMALY_TYPE_CODES.DONNEE_MANQUANTE,
      ],
      types,
    );

    const toInsert: DeepPartial<Anomaly>[] = [];

    // Absence liste colisage
    if (!(form.marchandise ?? '').trim()) {
      const typeId = types.get(ANOMALY_TYPE_CODES.ABSENCE_LISTE_COLISAGE);
      if (typeId != null) {
        toInsert.push({
          tourneeId: tid,
          prestationId: form.prestationId,
          camionId: form.truck,
          anomalyType: { id: typeId },
          description: 'Liste de colisage / marchandise non renseignée',
        });
      }
    }

    // Ordre magasin (phase 1: livrée sans km TH)
    const tableRows = Array.isArray(form.table_rows) ? form.table_rows : [];
    const badLines: number[] = [];
    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i] as Record<string, unknown>;
      if (isLivree(row) && !String(row.kmTh ?? '').trim()) {
        badLines.push(i + 1);
      }
    }
    if (badLines.length > 0) {
      const typeId = types.get(ANOMALY_TYPE_CODES.ORDRE_MAGASIN_NON_CONFORME);
      if (typeId != null) {
        toInsert.push({
          tourneeId: tid,
          prestationId: form.prestationId,
          camionId: form.truck,
          anomalyType: { id: typeId },
          description: `Lignes livrées sans Km TH / ordre magasin: ${badLines.join(', ')}`,
        });
      }
    }

    // Données manquantes (champs requis)
    const missing = requiredFieldChecks().filter(({ key }) => {
      const v = form[key];
      if (v === null || v === undefined) return true;
      if (typeof v === 'string') return !v.trim();
      return false;
    }).map((x) => x.label);
    if (missing.length > 0) {
      const typeId = types.get(ANOMALY_TYPE_CODES.DONNEE_MANQUANTE);
      if (typeId != null) {
        toInsert.push({
          tourneeId: tid,
          prestationId: form.prestationId,
          camionId: form.truck,
          anomalyType: { id: typeId },
          description: `Champs manquants: ${missing.join(', ')}`,
        });
      }
    }

    if (toInsert.length) {
      await this.anomalyRepo.save(toInsert.map((r) => this.anomalyRepo.create(r)));
    }
  }

  private async refreshDuplicationCluster(form: TmsFormData, types: Map<string, number>) {
    const dupCode = ANOMALY_TYPE_CODES.DUPLICATION_PRESTATION;
    const typeId = types.get(dupCode);
    if (typeId == null) return;

    const pid = (form.prestationId ?? '').trim();
    const sid = (form.siteId ?? '').trim();

    if (!pid || !sid) {
      await this.deleteForTourAndCodes(form.id, [dupCode], types);
      return;
    }

    const siblings = await this.formRepo.find({
      where: { prestationId: pid, siteId: sid },
    });
    const tourIds = [...new Set(siblings.map((s) => s.id))];

    await this.anomalyRepo
      .createQueryBuilder()
      .delete()
      .from(Anomaly)
      .where('anomaly_type_id = :aid', { aid: typeId })
      .andWhere('tournee_id IN (:...ids)', { ids: tourIds.length ? tourIds : ['__none__'] })
      .execute();

    if (tourIds.length < 2) return;

    const desc = `Duplication prestation: prestation_id=${pid}, site_id=${sid} — tournées: ${tourIds.join(', ')}`;
    for (const id of tourIds) {
      const sib = siblings.find((s) => s.id === id)!;
      await this.anomalyRepo.save(
        this.anomalyRepo.create({
          tourneeId: id,
          prestationId: pid,
          camionId: sib.truck,
          anomalyType: { id: typeId },
          description: desc,
        }),
      );
    }
  }
}

function isLivree(row: Record<string, unknown>): boolean {
  const v = row.livree;
  if (v === true || v === 1) return true;
  if (typeof v === 'string') return ['1', 'true', 'oui', 'yes'].includes(v.toLowerCase());
  return false;
}
