"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AnomalyEvaluationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomalyEvaluationService = exports.ANOMALY_TYPE_CODES = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tms_form_data_entity_1 = require("../tms/entities/tms-form-data.entity");
const anomaly_type_codes_1 = require("./anomaly-type-codes");
Object.defineProperty(exports, "ANOMALY_TYPE_CODES", { enumerable: true, get: function () { return anomaly_type_codes_1.ANOMALY_TYPE_CODES; } });
const anomaly_entity_1 = require("./entities/anomaly.entity");
const anomaly_type_entity_1 = require("./entities/anomaly-type.entity");
function requiredFieldChecks() {
    const base = [
        { key: 'date', label: 'date' },
        { key: 'driver', label: 'conducteur' },
        { key: 'truck', label: 'camion' },
    ];
    if (process.env.ANOMALY_STRICT_REQUIRED === 'true') {
        base.push({ key: 'prestationId', label: 'prestation_id' }, { key: 'siteId', label: 'site_id' });
    }
    return base;
}
let AnomalyEvaluationService = AnomalyEvaluationService_1 = class AnomalyEvaluationService {
    formRepo;
    anomalyRepo;
    typeRepo;
    logger = new common_1.Logger(AnomalyEvaluationService_1.name);
    typeIdsCache = null;
    constructor(formRepo, anomalyRepo, typeRepo) {
        this.formRepo = formRepo;
        this.anomalyRepo = anomalyRepo;
        this.typeRepo = typeRepo;
    }
    async typeIdsByCode() {
        if (this.typeIdsCache?.size)
            return this.typeIdsCache;
        const rows = await this.typeRepo.find();
        this.typeIdsCache = new Map(rows.map((r) => [r.code, r.id]));
        return this.typeIdsCache;
    }
    async evaluateAfterSave(tourneeId) {
        try {
            const types = await this.typeIdsByCode();
            if (types.size === 0) {
                this.logger.warn('anomaly_types vide — exécutez sql/patches/011_anomalies_and_form_ids.sql');
                return;
            }
            const form = await this.formRepo.findOne({ where: { id: tourneeId } });
            if (!form)
                return;
            await this.refreshSingleTourAnomalies(form, types);
            await this.refreshDuplicationCluster(form, types);
        }
        catch (e) {
            this.logger.warn(`anomaly evaluation failed: ${String(e?.message ?? e)}`);
        }
    }
    async deleteForTourAndCodes(tourneeId, codes, types) {
        const ids = codes.map((c) => types.get(c)).filter((id) => id != null);
        if (!ids.length)
            return;
        await this.anomalyRepo
            .createQueryBuilder()
            .delete()
            .from(anomaly_entity_1.Anomaly)
            .where('tournee_id = :tid', { tid: tourneeId })
            .andWhere('anomaly_type_id IN (:...typeIds)', { typeIds: ids })
            .execute();
    }
    async refreshSingleTourAnomalies(form, types) {
        const tid = form.id;
        await this.deleteForTourAndCodes(tid, [
            anomaly_type_codes_1.ANOMALY_TYPE_CODES.ABSENCE_LISTE_COLISAGE,
            anomaly_type_codes_1.ANOMALY_TYPE_CODES.ORDRE_MAGASIN_NON_CONFORME,
            anomaly_type_codes_1.ANOMALY_TYPE_CODES.DONNEE_MANQUANTE,
        ], types);
        const toInsert = [];
        if (!(form.marchandise ?? '').trim()) {
            const typeId = types.get(anomaly_type_codes_1.ANOMALY_TYPE_CODES.ABSENCE_LISTE_COLISAGE);
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
        const tableRows = Array.isArray(form.table_rows) ? form.table_rows : [];
        const badLines = [];
        for (let i = 0; i < tableRows.length; i++) {
            const row = tableRows[i];
            if (isLivree(row) && !String(row.kmTh ?? '').trim()) {
                badLines.push(i + 1);
            }
        }
        if (badLines.length > 0) {
            const typeId = types.get(anomaly_type_codes_1.ANOMALY_TYPE_CODES.ORDRE_MAGASIN_NON_CONFORME);
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
        const missing = requiredFieldChecks().filter(({ key }) => {
            const v = form[key];
            if (v === null || v === undefined)
                return true;
            if (typeof v === 'string')
                return !v.trim();
            return false;
        }).map((x) => x.label);
        if (missing.length > 0) {
            const typeId = types.get(anomaly_type_codes_1.ANOMALY_TYPE_CODES.DONNEE_MANQUANTE);
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
    async refreshDuplicationCluster(form, types) {
        const dupCode = anomaly_type_codes_1.ANOMALY_TYPE_CODES.DUPLICATION_PRESTATION;
        const typeId = types.get(dupCode);
        if (typeId == null)
            return;
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
            .from(anomaly_entity_1.Anomaly)
            .where('anomaly_type_id = :aid', { aid: typeId })
            .andWhere('tournee_id IN (:...ids)', { ids: tourIds.length ? tourIds : ['__none__'] })
            .execute();
        if (tourIds.length < 2)
            return;
        const desc = `Duplication prestation: prestation_id=${pid}, site_id=${sid} — tournées: ${tourIds.join(', ')}`;
        for (const id of tourIds) {
            const sib = siblings.find((s) => s.id === id);
            await this.anomalyRepo.save(this.anomalyRepo.create({
                tourneeId: id,
                prestationId: pid,
                camionId: sib.truck,
                anomalyType: { id: typeId },
                description: desc,
            }));
        }
    }
};
exports.AnomalyEvaluationService = AnomalyEvaluationService;
exports.AnomalyEvaluationService = AnomalyEvaluationService = AnomalyEvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tms_form_data_entity_1.TmsFormData)),
    __param(1, (0, typeorm_1.InjectRepository)(anomaly_entity_1.Anomaly)),
    __param(2, (0, typeorm_1.InjectRepository)(anomaly_type_entity_1.AnomalyType)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AnomalyEvaluationService);
function isLivree(row) {
    const v = row.livree;
    if (v === true || v === 1)
        return true;
    if (typeof v === 'string')
        return ['1', 'true', 'oui', 'yes'].includes(v.toLowerCase());
    return false;
}
//# sourceMappingURL=anomaly-evaluation.service.js.map