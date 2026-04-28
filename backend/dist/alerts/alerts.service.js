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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const anomaly_type_codes_1 = require("../anomalies/anomaly-type-codes");
const anomaly_entity_1 = require("../anomalies/entities/anomaly.entity");
const tms_form_data_entity_1 = require("../tms/entities/tms-form-data.entity");
const gps_service_1 = require("../gps/gps.service");
const SENSITIVE_RE = /prima\s*aqua|box\s*dhl|dhl|prima/i;
function parseKm(v) {
    if (v === null || v === undefined || v === '')
        return null;
    const n = Number.parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
}
function severityForAnomalyTypeCode(code) {
    if (code === anomaly_type_codes_1.ANOMALY_TYPE_CODES.ABSENCE_LISTE_COLISAGE)
        return 'INFO';
    return 'ALERTE';
}
let AlertsService = class AlertsService {
    formRepo;
    anomalyRepo;
    gpsService;
    constructor(formRepo, anomalyRepo, gpsService) {
        this.formRepo = formRepo;
        this.anomalyRepo = anomalyRepo;
        this.gpsService = gpsService;
    }
    async loadPersistedAnomaliesAsAlerts(filters) {
        try {
            const aq = this.anomalyRepo
                .createQueryBuilder('a')
                .innerJoinAndSelect('a.anomalyType', 't')
                .leftJoin(tms_form_data_entity_1.TmsFormData, 'f', 'f.id = a.tournee_id');
            if (filters.tmsFormId?.trim()) {
                aq.andWhere('a.tournee_id = :tid', { tid: filters.tmsFormId.trim() });
            }
            if (filters.date?.trim()) {
                aq.andWhere('f.date = :d', { d: filters.date.trim() });
            }
            const anoms = await aq.getMany();
            return anoms.map((x) => ({
                code: x.anomalyType.code,
                severity: severityForAnomalyTypeCode(x.anomalyType.code),
                message: (x.description ?? '').trim() || x.anomalyType.label,
                tmsFormId: x.tourneeId,
                meta: {
                    source: 'persisted',
                    anomalyId: x.id,
                    prestationId: x.prestationId,
                    camionId: x.camionId,
                },
            }));
        }
        catch {
            return [];
        }
    }
    persistedCodesByTour(persisted) {
        const m = new Map();
        for (const p of persisted) {
            const tid = p.tmsFormId ?? '';
            if (!tid)
                continue;
            if (!m.has(tid))
                m.set(tid, new Set());
            m.get(tid).add(p.code);
        }
        return m;
    }
    async getAlerts(filters) {
        const persisted = await this.loadPersistedAnomaliesAsAlerts(filters);
        const pc = this.persistedCodesByTour(persisted);
        const qb = this.formRepo.createQueryBuilder('f');
        if (filters.tmsFormId?.trim()) {
            qb.andWhere('f.id = :id', { id: filters.tmsFormId.trim() });
        }
        if (filters.date?.trim()) {
            qb.andWhere('f.date = :d', { d: filters.date.trim() });
        }
        const rows = await qb.getMany();
        const allForDup = await this.formRepo.find();
        const alerts = [...persisted];
        const dupMap = new Map();
        for (const r of allForDup) {
            if ((r.prestationId ?? '').trim() && (r.siteId ?? '').trim())
                continue;
            const key = `${r.date ?? ''}|${r.prestation ?? ''}|${r.dep ?? ''}`;
            if (!dupMap.has(key))
                dupMap.set(key, []);
            dupMap.get(key).push(r.id);
        }
        for (const [, ids] of dupMap) {
            if (ids.length > 1) {
                for (const id of ids) {
                    if (filters.tmsFormId?.trim() && id !== filters.tmsFormId.trim())
                        continue;
                    if (pc.get(id)?.has(anomaly_type_codes_1.ANOMALY_TYPE_CODES.DUPLICATION_PRESTATION))
                        continue;
                    alerts.push({
                        code: 'DUPLICATE_PRESTATION_SITE',
                        severity: 'ALERTE',
                        message: `Prestation / site / date en doublon sur plusieurs tournées (${ids.join(', ')})`,
                        tmsFormId: id,
                        meta: { relatedIds: ids },
                    });
                }
            }
        }
        for (const data of rows) {
            const id = data.id;
            const tableRows = Array.isArray(data.table_rows) ? data.table_rows : [];
            const codes = pc.get(id) ?? new Set();
            const kms = tableRows.map((row) => parseKm(row.kmArv)).filter((k) => k !== null);
            for (let i = 1; i < kms.length; i++) {
                if (kms[i] <= kms[i - 1]) {
                    alerts.push({
                        code: 'KM_NON_CROISSANT',
                        severity: 'BLOQUANT',
                        message: `Le kilométrage client (ligne ${i + 1}) doit être supérieur au précédent (${kms[i - 1]} → ${kms[i]})`,
                        tmsFormId: id,
                        meta: { index: i, prev: kms[i - 1], cur: kms[i] },
                    });
                    break;
                }
            }
            const obs = (data.observation ?? '').trim();
            for (let i = 0; i < tableRows.length; i++) {
                const row = tableRows[i];
                const um = parseKm(row.um);
                const pal = parseKm(row.pal);
                if (um === null || pal === null)
                    continue;
                if (Math.abs(um - pal) > 1e-6 && !obs) {
                    alerts.push({
                        code: 'UNITE_PALETTE_SANS_COMMENTAIRE',
                        severity: 'ALERTE',
                        message: `Écart unités / palettes (ligne ${i + 1}) sans commentaire explicatif`,
                        tmsFormId: id,
                        meta: { rowIndex: i, um, pal },
                    });
                    break;
                }
            }
            const truck = (data.truck ?? '').trim();
            if (truck) {
                const hasRoute = await this.gpsService.hasRealRoute(id);
                if (!hasRoute) {
                    alerts.push({
                        code: 'TOURNEE_SANS_GPS',
                        severity: 'ALERTE',
                        message: `Camion renseigné mais pas de trace GPS suffisante (minimum ${process.env.GPS_MIN_POINTS_REAL_ROUTE ?? '3'} points)`,
                        tmsFormId: id,
                    });
                }
            }
            if (!(data.marchandise ?? '').trim() && !codes.has(anomaly_type_codes_1.ANOMALY_TYPE_CODES.ABSENCE_LISTE_COLISAGE)) {
                alerts.push({
                    code: 'LISTE_COLISAGE_MANQUANTE',
                    severity: 'INFO',
                    message: 'Liste de colisage / marchandise non renseignée',
                    tmsFormId: id,
                });
            }
            for (let i = 0; i < tableRows.length; i++) {
                const row = tableRows[i];
                if (row.livree && !String(row.kmTh ?? '').trim()) {
                    if (codes.has(anomaly_type_codes_1.ANOMALY_TYPE_CODES.ORDRE_MAGASIN_NON_CONFORME))
                        continue;
                    alerts.push({
                        code: 'ORDRE_MAGASIN_KM_TH_MANQUANT',
                        severity: 'ALERTE',
                        message: `Ligne ${i + 1} livrée : Km TH / ordre magasin manquant`,
                        tmsFormId: id,
                        meta: { rowIndex: i },
                    });
                }
            }
            const march = `${data.marchandise ?? ''} ${tableRows.map((r) => r.client).join(' ')}`;
            if (SENSITIVE_RE.test(march)) {
                for (let i = 0; i < tableRows.length; i++) {
                    const row = tableRows[i];
                    const um = parseKm(row.um);
                    const pal = parseKm(row.pal);
                    if (um !== null && pal !== null && Math.abs(um - pal) < 1e-6) {
                        alerts.push({
                            code: 'ARTICLE_SENSIBLE_UM_EQ_PAL',
                            severity: 'ALERTE',
                            message: `Article sensible : UM = palettes (ligne ${i + 1}) — vérifier conditionnement`,
                            tmsFormId: id,
                            meta: { rowIndex: i, um, pal },
                        });
                    }
                }
            }
        }
        const seen = new Set();
        return alerts.filter((a) => {
            const k = `${a.code}|${a.tmsFormId ?? ''}|${a.message}`;
            if (seen.has(k))
                return false;
            seen.add(k);
            return true;
        });
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tms_form_data_entity_1.TmsFormData)),
    __param(1, (0, typeorm_1.InjectRepository)(anomaly_entity_1.Anomaly)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        gps_service_1.GpsService])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map