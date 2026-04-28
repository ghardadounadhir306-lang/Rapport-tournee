"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TmsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const XLSX = __importStar(require("xlsx"));
const typeorm_2 = require("typeorm");
const activity_log_service_1 = require("../activity/activity-log.service");
const anomaly_evaluation_service_1 = require("../anomalies/anomaly-evaluation.service");
const tms_import_row_entity_1 = require("./entities/tms-import-row.entity");
const tms_form_data_entity_1 = require("./entities/tms-form-data.entity");
const site_code_lookup_1 = require("./site-code-lookup");
const clients_poi_service_1 = require("../clients-poi/clients-poi.service");
const tour_leg_km_history_service_1 = require("./tour-leg-km-history.service");
let TmsService = class TmsService {
    tmsImportRowRepo;
    formDataRepo;
    dataSource;
    activity;
    anomalyEvaluation;
    clientsPoi;
    tourLegKmHistory;
    tmsDbDataSource = null;
    constructor(tmsImportRowRepo, formDataRepo, dataSource, activity, anomalyEvaluation, clientsPoi, tourLegKmHistory) {
        this.tmsImportRowRepo = tmsImportRowRepo;
        this.formDataRepo = formDataRepo;
        this.dataSource = dataSource;
        this.activity = activity;
        this.anomalyEvaluation = anomalyEvaluation;
        this.clientsPoi = clientsPoi;
        this.tourLegKmHistory = tourLegKmHistory;
    }
    async onModuleDestroy() {
        if (this.tmsDbDataSource?.isInitialized) {
            await this.tmsDbDataSource.destroy();
        }
    }
    async getTmsDbDataSource() {
        if (this.tmsDbDataSource?.isInitialized) {
            return this.tmsDbDataSource;
        }
        const host = process.env.TMS_DB_HOST ?? process.env.DB_HOST ?? '127.0.0.1';
        const port = Number(process.env.TMS_DB_PORT ?? process.env.DB_PORT ?? '5432');
        const username = process.env.TMS_DB_USER ?? process.env.DB_USER ?? 'postgres';
        const password = process.env.TMS_DB_PASSWORD ?? process.env.DB_PASSWORD ?? '';
        const database = process.env.TMS_DB_NAME ?? 'TMS_DB';
        this.tmsDbDataSource = new typeorm_2.DataSource({
            type: 'postgres',
            host,
            port: Number.isFinite(port) ? port : 5432,
            username,
            password,
            database,
            synchronize: false,
            logging: false,
        });
        await this.tmsDbDataSource.initialize();
        return this.tmsDbDataSource;
    }
    async tmsDbQuery(sql, params = []) {
        const ds = await this.getTmsDbDataSource();
        return ds.query(sql, params);
    }
    async rtourneeQuery(sql, params = []) {
        return this.dataSource.query(sql, params);
    }
    listMaxRows() {
        const n = Number(process.env.TMS_LIST_MAX_ROWS);
        return Number.isFinite(n) && n > 0 ? Math.floor(n) : 100_000;
    }
    fmtKmThUi(km) {
        return km.toFixed(2).replace('.', ',');
    }
    async resolveSitcodeForTmsFormId(formId) {
        const key = String(formId).replace(/^tms-/i, '').trim();
        if (!key)
            return null;
        const runTms = async (sql) => {
            try {
                return await this.tmsDbQuery(sql, [key]);
            }
            catch {
                return [];
            }
        };
        const runRtournee = async (sql) => {
            try {
                return await this.rtourneeQuery(sql, [key]);
            }
            catch {
                return [];
            }
        };
        let rows = await runTms(`SELECT sitcode FROM transport_data
       WHERE LOWER(TRIM(COALESCE(voycle::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(otsnum::text, ''))) = LOWER(TRIM($1))
       LIMIT 1`);
        if (!rows?.length) {
            rows = await runRtournee(`SELECT sitcode FROM tms_import_rows
         WHERE LOWER(TRIM(COALESCE(voycle::text, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(otsnum::text, ''))) = LOWER(TRIM($1))
         ORDER BY id DESC LIMIT 1`);
        }
        const s = this.asString(rows?.[0]?.sitcode);
        if (!s)
            return null;
        return (0, site_code_lookup_1.resolveSiteCodeForDisplay)(s) ?? s;
    }
    firstClientFromRows(rows) {
        for (const r of rows) {
            const c = this.asString(r?.client);
            if (c)
                return c.trim().toUpperCase();
        }
        return null;
    }
    async enrichTableRowsKmTh(formId, rows, siteIdHint) {
        if (!Array.isArray(rows) || rows.length === 0)
            return rows;
        const hint = (0, site_code_lookup_1.resolveSiteCodeForDisplay)(this.asString(siteIdHint));
        const origin = (hint != null && hint.trim() !== '' ? hint.trim() : null) ?? (await this.resolveSitcodeForTmsFormId(formId));
        if (!origin)
            return rows;
        const orderedCodes = rows.map((r) => this.asString(r?.client) ?? '');
        if (!orderedCodes.some((c) => String(c).trim() !== ''))
            return rows;
        const legKms = await this.clientsPoi.theoreticalKmLegsAlongTour(origin, orderedCodes);
        return rows.map((r, i) => {
            const row = r;
            const km = legKms[i];
            if (km == null || !Number.isFinite(km))
                return { ...row, kmTh: '' };
            return { ...row, kmTh: this.fmtKmThUi(km) };
        });
    }
    async fetchTransportDataDefaults(formId) {
        const empty = { formDefaults: {}, clientRows: [], autoFilledFields: [] };
        const key = String(formId).replace(/^tms-/i, '').trim();
        if (!key)
            return empty;
        try {
            const rows = await this.tmsDbQuery(`SELECT td.*
         FROM transport_data td
         WHERE LOWER(TRIM(COALESCE(td.voycle::text, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(td.otsnum::text, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(td.toucode::text, ''))) = LOWER(TRIM($1))
         ORDER BY td.voydtd ASC NULLS LAST, td.updated_at DESC NULLS LAST
         LIMIT 50`, [key]);
            if (!rows?.length)
                return empty;
            const first = rows[0];
            const fmtTime = (v) => {
                if (v == null)
                    return null;
                const s = String(v).trim();
                if (!s)
                    return null;
                const m = s.match(/^(\d{2}:\d{2})/);
                return m ? m[1] : s;
            };
            const fmtNum = (v) => {
                if (v == null)
                    return null;
                const n = Number(String(v).replace(',', '.'));
                return Number.isFinite(n) ? String(n) : null;
            };
            const formDefaults = {
                hDepart: fmtTime(first.voyhrd),
                kmDepart: fmtNum(first.plakm1),
                hRetour: fmtTime(first.voyhrf),
                kmRetour: fmtNum(first.plakm2),
                kmDernierClient: this.asString(first.km_dernier_client) ?? fmtNum(first.otskm2),
                marchandise: this.asString(first.chargement),
                totalPalettes: first.voypal != null ? String(first.voypal) : null,
            };
            const autoFilledFields = Object.entries(formDefaults)
                .filter(([, v]) => v != null && String(v).trim() !== '')
                .map(([k]) => k);
            const clientRows = rows.map((row, idx) => ({
                id: Number(row.source_transport_id ?? idx + 1),
                client: this.asString(row.otdcode) ?? '',
                dep: this.asString(row.tiecode) ?? '',
                um: this.asString(row.artcode) ?? '',
                pal: this.asString(row.entnbpal) ?? this.asString(row.voypal) ?? '',
                arrivee: fmtTime(row.arrivee_client) ?? fmtTime(row.voyhrd) ?? '',
                depart: fmtTime(row.depart_client) ?? fmtTime(row.voyhrf) ?? '',
                kmArv: this.asString(row.km_arv_client) ?? fmtNum(row.plakm2) ?? fmtNum(row.km_tsp) ?? '',
                taxe: this.asString(row.ottmt) ?? '',
                livree: false,
                kmTh: '',
                region: this.asString(row.sitcode) ?? '',
            }));
            return { formDefaults, clientRows, autoFilledFields };
        }
        catch {
            return empty;
        }
    }
    async getFormData(id) {
        try {
            const data = await this.formDataRepo.findOne({ where: { id } });
            const tdDefaults = await this.fetchTransportDataDefaults(id);
            if (data) {
                let tableRows = data.table_rows ?? [];
                if (!Array.isArray(tableRows) || tableRows.length === 0) {
                    tableRows = tdDefaults.clientRows;
                }
                tableRows = await this.enrichTableRowsKmTh(id, tableRows, data.siteId);
                const siteHint = data.siteId ?? (await this.resolveSitcodeForTmsFormId(id));
                const firstClient = this.firstClientFromRows(tableRows);
                const kmMoyHist = firstClient != null
                    ? await this.tourLegKmHistory.getAverage(siteHint ?? undefined, firstClient)
                    : null;
                const kmMoyUi = kmMoyHist != null ? this.fmtKmThUi(kmMoyHist) : data.km_moy != null ? data.km_moy : '';
                const or = (saved, tdKey) => {
                    const s = saved != null && String(saved).trim() !== '' ? saved : null;
                    return s ?? tdDefaults.formDefaults[tdKey] ?? null;
                };
                const autoFilled = [];
                const orTrack = (saved, tdKey) => {
                    const s = saved != null && String(saved).trim() !== '' ? saved : null;
                    if (s != null)
                        return s;
                    const fallback = tdDefaults.formDefaults[tdKey];
                    if (fallback != null && String(fallback).trim() !== '') {
                        autoFilled.push(tdKey);
                        return fallback;
                    }
                    return null;
                };
                const input_data = {
                    date: data.date,
                    wms: data.wms,
                    prestation: data.prestation,
                    truck: data.truck,
                    driver: data.driver,
                    dep: data.dep,
                    kmFacture: data.km_facture,
                    marchandise: orTrack(data.marchandise, 'marchandise'),
                    conformite: data.conformite,
                    observation: data.observation,
                    hDepart: orTrack(data.h_depart, 'hDepart'),
                    kmDepart: orTrack(data.km_depart, 'kmDepart'),
                    hRetour: orTrack(data.h_retour, 'hRetour'),
                    kmRetour: orTrack(data.km_retour, 'kmRetour'),
                    kmDernierClient: orTrack(data.km_dernier_client, 'kmDernierClient'),
                    kmMoy: kmMoyUi,
                    totalPalettes: orTrack(data.total_palettes, 'totalPalettes'),
                    totalPalettes2: data.total_palettes_2,
                    tourneeSec: data.tournee_sec,
                    apresMidi: Boolean(data.apres_midi),
                    interSite: Boolean(data.inter_site),
                    gpsStartLat: data.gps_start_lat != null ? String(data.gps_start_lat) : '',
                    gpsStartLng: data.gps_start_lng != null ? String(data.gps_start_lng) : '',
                    gpsEndLat: data.gps_end_lat != null ? String(data.gps_end_lat) : '',
                    gpsEndLng: data.gps_end_lng != null ? String(data.gps_end_lng) : '',
                    gpsStartLabel: '',
                    gpsEndLabel: '',
                    prestationId: data.prestationId,
                    siteId: siteHint,
                    autoFilledFromMobile: autoFilled,
                };
                return {
                    id: data.id,
                    tms_id: data.tms_id,
                    table_rows: tableRows,
                    tableRows,
                    input_data,
                    formData: input_data,
                };
            }
            const siteHint = await this.resolveSitcodeForTmsFormId(id);
            let tableRows = tdDefaults.clientRows;
            if (tableRows.length > 0) {
                tableRows = await this.enrichTableRowsKmTh(id, tableRows, siteHint);
            }
            const firstClient = this.firstClientFromRows(tableRows);
            const kmMoyHist = firstClient != null
                ? await this.tourLegKmHistory.getAverage(siteHint ?? undefined, firstClient)
                : null;
            const kmMoyUi = kmMoyHist != null ? this.fmtKmThUi(kmMoyHist) : '';
            const input_data = {
                date: null,
                wms: null,
                prestation: null,
                truck: null,
                driver: null,
                dep: null,
                kmFacture: null,
                marchandise: tdDefaults.formDefaults.marchandise ?? null,
                conformite: 'Conforme',
                observation: null,
                hDepart: tdDefaults.formDefaults.hDepart ?? null,
                kmDepart: tdDefaults.formDefaults.kmDepart ?? null,
                hRetour: tdDefaults.formDefaults.hRetour ?? null,
                kmRetour: tdDefaults.formDefaults.kmRetour ?? null,
                kmDernierClient: tdDefaults.formDefaults.kmDernierClient ?? null,
                kmMoy: kmMoyUi,
                totalPalettes: tdDefaults.formDefaults.totalPalettes ?? '0',
                totalPalettes2: null,
                tourneeSec: '0',
                apresMidi: false,
                interSite: false,
                gpsStartLat: '',
                gpsStartLng: '',
                gpsEndLat: '',
                gpsEndLng: '',
                gpsStartLabel: '',
                gpsEndLabel: '',
                prestationId: null,
                siteId: siteHint,
                autoFilledFromMobile: tdDefaults.autoFilledFields,
            };
            return {
                id,
                tms_id: id,
                table_rows: tableRows,
                tableRows,
                input_data,
                formData: input_data,
            };
        }
        catch (e) {
            const sqlState = e?.sqlState ?? e?.driverError?.sqlState;
            const errno = e?.errno ?? e?.driverError?.errno;
            const msg = String(e?.message ?? e?.driverError?.message ?? '');
            if (e?.code === 'ER_NO_SUCH_TABLE' || sqlState === '42S02' || errno === 1146 || errno === 1932 || msg.includes('tms_form_data') && msg.includes("doesn't exist")) {
                throw new common_1.BadRequestException("La table tms_form_data n'existe pas. Exécutez le patch SQL: backend/sql/patches/007_create_tms_form_data.sql");
            }
            throw e;
        }
    }
    async saveFormData(id, body, ctx) {
        try {
            let existing = await this.formDataRepo.findOne({ where: { id } });
            if (!existing) {
                existing = this.formDataRepo.create({ id, tms_id: id });
            }
            const inputs = body.input_data || {};
            existing.date = inputs.date || null;
            existing.wms = inputs.wms || null;
            existing.prestation = inputs.prestation || null;
            existing.truck = inputs.truck || null;
            existing.driver = inputs.driver || null;
            existing.dep = inputs.dep || null;
            existing.prestationId =
                inputs.prestationId != null && String(inputs.prestationId).trim() !== ''
                    ? String(inputs.prestationId).trim()
                    : null;
            existing.siteId =
                inputs.siteId != null && String(inputs.siteId).trim() !== ''
                    ? String(inputs.siteId).trim()
                    : null;
            existing.km_facture = inputs.kmFacture || null;
            existing.marchandise = inputs.marchandise || null;
            existing.conformite = inputs.conformite || null;
            existing.observation = inputs.observation || null;
            existing.h_depart = inputs.hDepart || null;
            existing.km_depart = inputs.kmDepart || null;
            existing.h_retour = inputs.hRetour || null;
            existing.km_retour = inputs.kmRetour || null;
            existing.km_dernier_client = inputs.kmDernierClient || null;
            existing.total_palettes = inputs.totalPalettes || null;
            existing.total_palettes_2 = inputs.totalPalettes2 || null;
            existing.tournee_sec = inputs.tourneeSec || null;
            existing.apres_midi = Boolean(inputs.apresMidi);
            existing.inter_site = Boolean(inputs.interSite);
            const toDec = (v) => {
                if (v === '' || v === null || v === undefined)
                    return null;
                const n = Number(String(v).replace(',', '.'));
                return Number.isFinite(n) ? n.toFixed(7) : null;
            };
            existing.gps_start_lat = toDec(inputs.gpsStartLat ?? inputs.gps_start_lat);
            existing.gps_start_lng = toDec(inputs.gpsStartLng ?? inputs.gps_start_lng);
            existing.gps_end_lat = toDec(inputs.gpsEndLat ?? inputs.gps_end_lat);
            existing.gps_end_lng = toDec(inputs.gpsEndLng ?? inputs.gps_end_lng);
            const tourneeKey = this.parseTourneeKey(id);
            if (tourneeKey) {
                await this.syncTransportDataDriverFromForm(tourneeKey, existing.driver);
            }
            const rawRows = body.table_rows || [];
            existing.table_rows = (await this.enrichTableRowsKmTh(id, rawRows, existing.siteId));
            const siteForHistory = existing.siteId ?? (await this.resolveSitcodeForTmsFormId(id));
            await this.tourLegKmHistory.recordSamples(id, siteForHistory, existing.table_rows);
            const firstClientAfter = this.firstClientFromRows(existing.table_rows);
            const kmMoyAvg = await this.tourLegKmHistory.getAverage(siteForHistory ?? undefined, firstClientAfter);
            existing.km_moy =
                kmMoyAvg != null
                    ? this.fmtKmThUi(kmMoyAvg)
                    : inputs.kmMoy != null && String(inputs.kmMoy).trim() !== ''
                        ? String(inputs.kmMoy).trim()
                        : null;
            try {
                const saved = await this.formDataRepo.save(existing);
                await this.activity.log({
                    action: 'FORM_SAVE',
                    targetType: 'tms_form',
                    targetId: id,
                    details: {
                        tms_id: saved.tms_id,
                        date: saved.date,
                        prestation: saved.prestation,
                    },
                    ip: ctx?.ip ?? null,
                });
                await this.anomalyEvaluation.evaluateAfterSave(id);
                return saved;
            }
            catch (e) {
                if (e?.code === 'ER_BAD_FIELD_ERROR' && String(e?.message ?? '').includes('gps_')) {
                    delete existing.gps_start_lat;
                    delete existing.gps_start_lng;
                    delete existing.gps_end_lat;
                    delete existing.gps_end_lng;
                    const saved = await this.formDataRepo.save(existing);
                    await this.activity.log({
                        action: 'FORM_SAVE',
                        targetType: 'tms_form',
                        targetId: id,
                        details: { tms_id: saved.tms_id, date: saved.date, prestation: saved.prestation, strippedGps: true },
                        ip: ctx?.ip ?? null,
                    });
                    await this.anomalyEvaluation.evaluateAfterSave(id);
                    return saved;
                }
                throw e;
            }
        }
        catch (e) {
            const sqlState = e?.sqlState ?? e?.driverError?.sqlState;
            const errno = e?.errno ?? e?.driverError?.errno;
            const msg = String(e?.message ?? e?.driverError?.message ?? '');
            if (e?.code === 'ER_NO_SUCH_TABLE' || sqlState === '42S02' || errno === 1146 || errno === 1932 || msg.includes('tms_form_data') && msg.includes("doesn't exist")) {
                throw new common_1.BadRequestException("La table tms_form_data n'existe pas. Exécutez le patch SQL: backend/sql/patches/007_create_tms_form_data.sql");
            }
            throw e;
        }
    }
    async getData(query = {}) {
        const hasFilters = Object.values(query).some((v) => v != null && String(v).trim() !== '');
        const take = this.listMaxRows();
        let importRows = [];
        let importCount = 0;
        try {
            [importCount, importRows] = await Promise.all([
                this.tmsImportRowRepo.count(),
                this.tmsImportRowRepo.find({ order: { id: 'DESC' }, take }),
            ]);
        }
        catch (e) {
            if (e?.code === 'ER_BAD_FIELD_ERROR' && String(e?.message ?? '').includes('otsnumbdx')) {
                importRows = await this.fetchRowsWithoutOtsnumbdx();
                importCount = await this.tmsImportRowRepo.count();
            }
            else if (e?.code !== '42P01' && e?.code !== 'ER_NO_SUCH_TABLE') {
                throw e;
            }
        }
        const transportRows = await this.fetchTransportDataRows(take);
        const totalCount = importCount + transportRows.length;
        const transportList = this.buildListFromRows(transportRows, 'transport_data');
        const importList = this.buildListFromRows(importRows, 'tms_import_rows');
        const merged = [...transportList, ...importList];
        const byId = new Map();
        for (const item of merged) {
            if (!byId.has(item.id))
                byId.set(item.id, item);
        }
        let list = Array.from(byId.values());
        const distinctCount = list.length;
        if (hasFilters) {
            list = this.filterListByQuery(list, query);
        }
        return {
            entriesCount: distinctCount,
            rowsCount: totalCount,
            list,
            active: null,
        };
    }
    async fetchTransportDataRows(limit) {
        try {
            const rows = await this.tmsDbQuery(`SELECT ROW_NUMBER() OVER (ORDER BY otsnum DESC NULLS LAST) AS _rn,
             td.affcode, td.artcode, td.cdate, td.entnbpal, td.otdcode, td.otscontainer, td.otsetat,
             td.otskm2, td.otsnumbdx, td.ottmt, td.placha1i, td.plakm1, td.plakm2, td.plalib, td.plamoti,
             td.plargiarr, td.rgilibl,
             td.salnom, td.saltel,
             td.sitcode, td.sitsiretedi, td.tiecode,
             td.toucode, td.voycle, td.voydtd, td.voyhrd, td.voypal, td.performance_camion,
             td.performance_chauffeur, td.taux_remplissage_pal, td.taux_remplissage_ton,
             td.mdate, td.sitechauff, td.sitecamion, td.salmemoe, td.otsnum, td.platouordre,
             td.salmobilite, td.km_tsp, td.toutrafcode, td.chargement, td.voydtf, td.otdhd, td.voymemo
        FROM transport_data td
        ORDER BY td.otsnum DESC NULLS LAST
         LIMIT ${limit}`);
            return rows.map((r) => ({
                id: `td-${r._rn}`,
                affcode: r.affcode ?? null,
                artcode: r.artcode ?? null,
                cdate: this.asDateOnly(r.cdate),
                entnbpal: r.entnbpal ?? null,
                otdcode: r.otdcode ?? null,
                otscontainer: r.otscontainer ?? null,
                otsetat: r.otsetat ?? null,
                otskm2: r.otskm2 ?? null,
                otsnumbdx: r.otsnumbdx ?? null,
                ottmt: r.ottmt ?? null,
                placha1i: r.placha1i ?? null,
                plakm1: r.plakm1 ?? null,
                plakm2: r.plakm2 ?? null,
                plalib: r.plalib ?? null,
                plamoti: r.plamoti ?? null,
                plargiarr: r.plargiarr ?? null,
                rgilibl: r.rgilibl ?? null,
                salnom: r.salnom ?? null,
                saltel: r.saltel ?? null,
                sitcode: r.sitcode ?? null,
                sitsiretedi: r.sitsiretedi ?? null,
                tiecode: r.tiecode ?? null,
                toucode: r.toucode ?? null,
                voycle: r.voycle ?? null,
                voydtd: this.asDateOnly(r.voydtd),
                voyhrd: r.voyhrd ?? null,
                voypal: r.voypal ?? null,
                performance_camion: r.performance_camion ?? null,
                performance_chauffeur: r.performance_chauffeur ?? null,
                taux_remplissage_pal: r.taux_remplissage_pal ?? null,
                taux_remplissage_ton: r.taux_remplissage_ton ?? null,
                mdate: r.mdate ? new Date(r.mdate) : null,
                sitechauff: r.sitechauff ?? null,
                sitecamion: r.sitecamion ?? null,
                salmemoe: r.salmemoe ?? null,
                otsnum: r.otsnum ?? null,
                platouordre: r.platouordre ?? null,
                salmobilite: r.salmobilite ?? null,
                km_tsp: r.km_tsp ?? null,
                toutrafcode: r.toutrafcode ?? null,
                chargement: r.chargement ?? null,
                voydtf: this.asDateOnly(r.voydtf),
                otdhd: r.otdhd ?? null,
                voymemo: r.voymemo ?? null,
                raw_json: null,
            }));
        }
        catch {
            return [];
        }
    }
    async importExcel(buffer, ctx) {
        if (!buffer?.length) {
            throw new common_1.BadRequestException('Empty file');
        }
        let workbook;
        try {
            workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
        }
        catch {
            throw new common_1.BadRequestException('Invalid Excel file');
        }
        const sheetName = workbook.SheetNames?.[0];
        if (!sheetName) {
            throw new common_1.BadRequestException('Excel file has no sheets');
        }
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, {
            defval: null,
        });
        const rowsToInsert = rawRows
            .map((r) => this.mapExcelRow(r))
            .filter((r) => !this.isRowEmpty(r));
        const chunkSize = 500;
        try {
            for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
                const chunk = rowsToInsert.slice(i, i + chunkSize);
                await this.tmsImportRowRepo.insert(chunk);
            }
        }
        catch (e) {
            if (e?.code === 'ER_NO_SUCH_TABLE') {
                throw new common_1.BadRequestException('Missing table tms_import_rows. Run sql/schema.mysql.sql to create the DB schema.');
            }
            throw e;
        }
        const result = {
            sheetName,
            rowsDetected: rawRows.length,
            inserted: rowsToInsert.length,
        };
        await this.activity.log({
            action: 'TMS_EXCEL_IMPORT',
            targetType: 'tms_import',
            details: result,
            ip: ctx?.ip ?? null,
        });
        return result;
    }
    async getTransportData(rawLimit) {
        const parsedLimit = Number(rawLimit);
        const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
            ? Math.min(Math.floor(parsedLimit), 1000)
            : 100;
        try {
            const rows = await this.tmsDbQuery(`SELECT * FROM transport_data WHERE states = 'done' ORDER BY "createdAt" DESC LIMIT ${safeLimit}`);
            return {
                count: Array.isArray(rows) ? rows.length : 0,
                rows: Array.isArray(rows) ? rows : [],
            };
        }
        catch (e) {
            const code = String(e?.code ?? e?.driverError?.code ?? '');
            const message = String(e?.message ?? e?.driverError?.message ?? '');
            if (code === '42P01' ||
                code === 'ER_NO_SUCH_TABLE' ||
                message.toLowerCase().includes('transport_data')) {
                throw new common_1.BadRequestException("La table transport_data n'existe pas dans la base active.");
            }
            throw e;
        }
    }
    async getTransportRowsByTourneeId(rawTourneeId) {
        const tourneeKey = this.parseTourneeKey(rawTourneeId);
        if (!tourneeKey) {
            throw new common_1.BadRequestException('Identifiant tournée invalide');
        }
        const rows = await this.fetchTransportRowsByTournee(tourneeKey);
        return {
            tourneeId: `tms-${tourneeKey}`,
            key: tourneeKey,
            count: rows.length,
            rows,
            tableRows: this.mapTransportRowsToClientRows(rows),
        };
    }
    normalizeHeader(header) {
        return header
            .trim()
            .toLowerCase()
            .replace(/[\s_]+/g, '')
            .replace(/[^a-z0-9]/g, '');
    }
    normalizeRowKeys(row) {
        const out = {};
        for (const [key, value] of Object.entries(row)) {
            out[this.normalizeHeader(key)] = value;
        }
        return out;
    }
    asString(value, maxLen) {
        if (value === null || value === undefined)
            return null;
        const s = String(value).trim();
        if (!s)
            return null;
        const lower = s.toLowerCase();
        if (lower === 'undefined' || lower === 'null' || lower === 'none')
            return null;
        return maxLen ? s.slice(0, maxLen) : s;
    }
    parseTourneeKey(rawTourneeId) {
        return String(rawTourneeId ?? '').replace(/^tms-/i, '').trim();
    }
    asInt(value) {
        if (value === null || value === undefined || value === '')
            return null;
        if (typeof value === 'number' && Number.isFinite(value))
            return Math.trunc(value);
        const s = String(value).trim().replace(',', '.');
        const n = Number.parseInt(s, 10);
        return Number.isFinite(n) ? n : null;
    }
    asDecimalString(value) {
        if (value === null || value === undefined || value === '')
            return null;
        if (typeof value === 'string') {
            const v = value.trim().toLowerCase();
            if (!v || v === 'undefined' || v === 'null' || v === 'none')
                return null;
        }
        if (typeof value === 'number' && Number.isFinite(value))
            return String(value);
        const s = String(value).trim().replace(',', '.');
        const n = Number.parseFloat(s);
        return Number.isFinite(n) ? String(n) : null;
    }
    asDateOnly(value) {
        if (value === null || value === undefined || value === '')
            return null;
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
            const yyyy = value.getFullYear();
            const mm = String(value.getMonth() + 1).padStart(2, '0');
            const dd = String(value.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
        const s = String(value).trim();
        const lower = s.toLowerCase();
        if (lower === 'undefined' || lower === 'null' || lower === 'none')
            return null;
        const iso = /^\d{4}-\d{2}-\d{2}$/;
        if (iso.test(s))
            return s;
        const fr = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const m = s.match(fr);
        if (m) {
            const dd = m[1];
            const mm = m[2];
            const yyyy = m[3];
            return `${yyyy}-${mm}-${dd}`;
        }
        const frDt = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/;
        const m2 = s.match(frDt);
        if (m2) {
            const dd = m2[1];
            const mm = m2[2];
            const yyyy = m2[3];
            return `${yyyy}-${mm}-${dd}`;
        }
        return null;
    }
    asDateTime(value) {
        if (value === null || value === undefined || value === '')
            return null;
        if (value instanceof Date && !Number.isNaN(value.getTime()))
            return value;
        const s = String(value).trim();
        const lower = s.toLowerCase();
        if (lower === 'undefined' || lower === 'null' || lower === 'none')
            return null;
        const frDt = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/;
        const m = s.match(frDt);
        if (m) {
            const dd = m[1];
            const mm = m[2];
            const yyyy = m[3];
            const hh = m[4];
            const min = m[5];
            const ss = m[6] ?? '00';
            return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`);
        }
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    mapExcelRow(row) {
        const r = this.normalizeRowKeys(row);
        const get = (name) => r[this.normalizeHeader(name)];
        return {
            affcode: this.asString(get('affcode'), 64),
            artcode: this.asString(get('artcode'), 64),
            cdate: this.asDateOnly(get('cdate')),
            entnbpal: this.asInt(get('entnbpal')),
            otdcode: this.asString(get('otdcode'), 64),
            otscontainer: this.asString(get('otscontainer'), 64),
            otsetat: this.asString(get('otsetat'), 64),
            otskm2: this.asDecimalString(get('otskm2')),
            otsnumbdx: this.asString(get('otsnumbdx'), 128),
            ottmt: this.asDecimalString(get('ottmt')),
            placha1i: this.asString(get('placha1i'), 64),
            plakm1: this.asDecimalString(get('plakm1')),
            plakm2: this.asDecimalString(get('plakm2')),
            plalib: this.asString(get('plalib'), 255),
            plamoti: this.asString(get('plamoti'), 255),
            plargiarr: this.asString(get('plargiarr'), 255),
            rgilibl: this.asString(get('rgilibl'), 255),
            salnom: this.asString(get('salnom'), 255),
            saltel: this.asString(get('saltel'), 64),
            sitcode: this.asString(get('sitcode'), 64),
            sitsiretedi: this.asString(get('sitsiretedi'), 32),
            tiecode: this.asString(get('tiecode'), 64),
            toucode: this.asString(get('toucode'), 64),
            voycle: this.asString(get('voycle'), 128),
            voydtd: this.asDateTime(get('voydtd')),
            voyhrd: this.asString(get('voyhrd'), 32),
            voypal: this.asInt(get('voypal')),
            performance_camion: this.asDecimalString(get('performance_camion')),
            performance_chauffeur: this.asDecimalString(get('performance_chauffeur')),
            taux_remplissage_pal: this.asDecimalString(get('taux_remplissage_pal')),
            taux_remplissage_ton: this.asDecimalString(get('taux_remplissage_ton')),
            mdate: this.asDateTime(get('mdate')),
            sitechauff: this.asString(get('sitechauff'), 64),
            sitecamion: this.asString(get('sitecamion'), 64),
            salmemoe: this.asString(get('salmemoe')),
            otsnum: this.asString(get('otsnum'), 128),
            platouordre: this.asInt(get('platouordre')),
            salmobilite: this.asString(get('salmobilite'), 64),
            km_tsp: this.asDecimalString(get('km_tsp')),
            toutrafcode: this.asString(get('toutrafcode'), 64),
            chargement: this.asString(get('chargement'), 255),
            voydtf: this.asDateTime(get('voydtf')),
            otdhd: this.asDateTime(get('otdhd')),
            voymemo: this.asString(get('voymemo')),
            raw_json: JSON.stringify(row),
        };
    }
    isRowEmpty(row) {
        const { id, created_at, raw_json, ...rest } = row;
        return Object.values(rest).every((v) => v === null || v === undefined || v === '');
    }
    formatDateOnly(d) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    pickTmsNumber(row) {
        const voycle = this.asString(row.voycle);
        const otdcode = this.asString(row.otdcode);
        const otsnum = this.asString(row.otsnum);
        const toucode = this.asString(row.toucode);
        if (voycle)
            return voycle;
        if (otdcode && /^\d+$/.test(otdcode))
            return otdcode;
        return otsnum ?? toucode ?? null;
    }
    mapRowToListItem(row, source) {
        const tmsNumber = this.pickTmsNumber(row);
        const normalizedId = `tms-${tmsNumber ?? row.id}`;
        const date = this.normalizeUiDate(row.voydtd) ?? this.normalizeUiDate(row.cdate);
        return {
            id: normalizedId,
            tms: tmsNumber,
            wms: '0',
            date,
            site: (0, site_code_lookup_1.resolveSiteCodeForDisplay)(this.asString(row.sitcode)),
            truck: this.asString(row.plamoti) ?? null,
            driver: this.asString(row.salnom) ?? '',
            otdcode: this.asString(row.otdcode) ?? null,
            dep: this.asString(row.tiecode) ?? null,
            prestation: null,
            source: source ?? null,
            active: false,
        };
    }
    buildListFromRows(rows, source) {
        const map = new Map();
        for (const row of rows) {
            const item = this.mapRowToListItem(row, source);
            if (!map.has(item.id)) {
                map.set(item.id, item);
            }
        }
        return Array.from(map.values());
    }
    filterListByQuery(list, query) {
        const q = (k) => (query[k] ?? '').trim().toLowerCase();
        return list.filter((item) => {
            if (q('tms')) {
                const needle = q('tms');
                const idPart = String(item.id).replace(/^tms-/i, '').toLowerCase();
                if (!String(item.id).toLowerCase().includes(needle) && !idPart.includes(needle)) {
                    return false;
                }
            }
            if (q('wms') && !(item.wms ?? '').toLowerCase().includes(q('wms')))
                return false;
            if (q('date')) {
                const d = q('date');
                const idate = (item.date ?? '').slice(0, 10).toLowerCase();
                if (!idate.includes(d) && (item.date ?? '').toLowerCase() !== d)
                    return false;
            }
            if (q('site')) {
                const needle = q('site');
                const s = (item.site ?? '').toLowerCase();
                if (!s.includes(needle))
                    return false;
            }
            if (q('truck') && !(item.truck ?? '').toLowerCase().includes(q('truck')))
                return false;
            if (q('driver') && !(item.driver ?? '').toLowerCase().includes(q('driver')))
                return false;
            if (q('dep') && !(item.dep ?? '').toLowerCase().includes(q('dep')))
                return false;
            if (q('prestation') && !(item.prestation ?? '').toLowerCase().includes(q('prestation'))) {
                return false;
            }
            return true;
        });
    }
    normalizeUiDate(value) {
        const s = this.asString(value);
        if (!s)
            return null;
        const onlyDate = s.match(/^\d{4}-\d{2}-\d{2}/);
        if (onlyDate)
            return onlyDate[0];
        return s;
    }
    readOtsnumbdxFromRawJson(rawJson) {
        if (!rawJson)
            return null;
        try {
            const obj = JSON.parse(rawJson);
            const value = obj?.OTSNUMBDX ?? obj?.otsnumbdx;
            return this.asString(value, 128);
        }
        catch {
            return null;
        }
    }
    async fetchRowsWithoutOtsnumbdx() {
        const rawRows = await this.tmsImportRowRepo
            .createQueryBuilder('row')
            .select([
            'row.id',
            'row.otdcode',
            'row.otsnum',
            'row.cdate',
            'row.voydtd',
            'row.sitcode',
            'row.sitecamion',
            'row.sitechauff',
            'row.voycle',
            'row.salnom',
            'row.toutrafcode',
            'row.plalib',
            'row.artcode',
            'row.chargement',
            'row.raw_json',
        ])
            .orderBy('row.id', 'DESC')
            .limit(this.listMaxRows())
            .getRawMany();
        return rawRows.map((raw) => ({
            id: raw.row_id,
            otdcode: raw.row_otdcode,
            otsnum: raw.row_otsnum,
            cdate: raw.row_cdate,
            voydtd: raw.row_voydtd,
            sitcode: raw.row_sitcode,
            sitecamion: raw.row_sitecamion,
            sitechauff: raw.row_sitechauff,
            voycle: raw.row_voycle,
            salnom: raw.row_salnom,
            toutrafcode: raw.row_toutrafcode,
            plalib: raw.row_plalib,
            artcode: raw.row_artcode,
            chargement: raw.row_chargement,
            otsnumbdx: this.readOtsnumbdxFromRawJson(raw.row_raw_json),
        }));
    }
    async fetchTransportRowsByTournee(tourneeKey) {
        try {
            const rows = await this.tmsDbQuery(`SELECT td.*
         FROM transport_data td
         WHERE LOWER(TRIM(COALESCE(td.voycle::text, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(td.otdcode::text, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(td.otsnum::text, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(td.toucode::text, ''))) = LOWER(TRIM($1))
         ORDER BY td.voydtd ASC NULLS LAST, td.otdcode ASC NULLS LAST, td.otsnum ASC NULLS LAST`, [tourneeKey]);
            return Array.isArray(rows) ? rows : [];
        }
        catch {
            return [];
        }
    }
    async findRtourneeChauffeurByName(fullNameRaw) {
        const fullName = this.asString(fullNameRaw, 255);
        if (!fullName)
            return null;
        const rows = await this.rtourneeQuery(`SELECT nom, prenom, tel
       FROM chauffeurs
       WHERE LOWER(TRIM(CONCAT(COALESCE(prenom, ''), ' ', COALESCE(nom, '')))) = LOWER(TRIM($1))
          OR LOWER(TRIM(CONCAT(COALESCE(nom, ''), ' ', COALESCE(prenom, '')))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(nom, ''))) = LOWER(TRIM($1))
       LIMIT 1`, [fullName]);
        if (!rows.length)
            return null;
        const prenom = this.asString(rows[0].prenom, 255) ?? '';
        const nom = this.asString(rows[0].nom, 255) ?? '';
        const normalized = `${prenom} ${nom}`.replace(/\s+/g, ' ').trim() || fullName;
        return {
            fullName: normalized,
            tel: this.asString(rows[0].tel, 64),
        };
    }
    async resolveDriverProfileForTms(tourneeKey, driverName) {
        const tmsRows = await this.tmsDbQuery(`SELECT salnom, saltel
       FROM transport_data
       WHERE LOWER(TRIM(COALESCE(voycle::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(otdcode::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(otsnum::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(toucode::text, ''))) = LOWER(TRIM($1))
       ORDER BY updated_at DESC NULLS LAST
       LIMIT 5`, [tourneeKey]);
        for (const row of tmsRows) {
            const existingName = this.asString(row.salnom, 255);
            if (!existingName)
                continue;
            const fromRtournee = await this.findRtourneeChauffeurByName(existingName);
            if (fromRtournee)
                return fromRtournee;
        }
        const byInputName = await this.findRtourneeChauffeurByName(driverName);
        if (byInputName)
            return byInputName;
        return {
            fullName: driverName,
            tel: this.asString(tmsRows[0]?.saltel, 64),
        };
    }
    async syncTransportDataDriverFromForm(tourneeKey, driverRaw) {
        const driverName = this.asString(driverRaw, 255);
        if (!driverName)
            return;
        const profile = await this.resolveDriverProfileForTms(tourneeKey, driverName);
        const params = [tourneeKey];
        const updates = ['salmemoe = $2', 'salnom = $2', "mdate = TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')"];
        params.push(profile.fullName);
        if (profile.tel) {
            updates.push(`saltel = $${params.length + 1}`);
            params.push(profile.tel);
        }
        await this.tmsDbQuery(`UPDATE transport_data
       SET ${updates.join(', ')}
       WHERE LOWER(TRIM(COALESCE(voycle::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(otdcode::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(otsnum::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(toucode::text, ''))) = LOWER(TRIM($1))`, params);
    }
    mapTransportRowsToClientRows(rows) {
        return rows.map((row, idx) => ({
            id: Number(row.source_transport_id ?? idx + 1),
            client: this.asString(row.otdcode) ?? '',
            dep: this.asString(row.tiecode) ?? '',
            um: this.asString(row.artcode) ?? '',
            pal: this.asString(row.entnbpal) ?? this.asString(row.voypal) ?? '',
            arrivee: this.asString(row.voyhrd) ?? '',
            depart: this.asString(row.voyhrf) ?? '',
            kmArv: this.asString(row.plakm2) ?? this.asString(row.km_tsp) ?? '',
            taxe: this.asString(row.ottmt) ?? '',
            livree: false,
            kmTh: '',
            region: this.asString(row.sitcode) ?? '',
        }));
    }
    parseNum(v) {
        if (v === null || v === undefined || v === '')
            return null;
        const n = Number(String(v).replace(',', '.'));
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    parseTimeToMin(v) {
        if (!v)
            return null;
        const s = String(v).trim();
        const parts = s.split(':');
        if (parts.length < 2)
            return null;
        const h = Number(parts[0]);
        const m = Number(parts[1]);
        if (!Number.isFinite(h) || !Number.isFinite(m))
            return null;
        return h * 60 + m;
    }
    async getOptimisationData() {
        let formDataRecords = [];
        try {
            formDataRecords = await this.formDataRepo.find({
                order: { updated_at: 'DESC' },
            });
        }
        catch (e) {
            if (e?.code === '42P01')
                return { stats: this.emptyStats(), rows: [] };
            throw e;
        }
        const tmsData = await this.getData({});
        const tmsMap = new Map(tmsData.list.map((item) => [item.id, item]));
        const analysis = formDataRecords.map((fd) => {
            const tmsItem = tmsMap.get(fd.id) ?? tmsMap.get(fd.tms_id ?? '') ?? null;
            const tableRows = Array.isArray(fd.table_rows) ? fd.table_rows : [];
            const kmFacture = this.parseNum(fd.km_facture);
            const kmDepart = this.parseNum(fd.km_depart);
            const kmDernierClient = this.parseNum(fd.km_dernier_client);
            const kmRetour = this.parseNum(fd.km_retour);
            const kmReel = kmFacture != null
                ? kmFacture
                : kmDernierClient != null && kmDepart != null && kmDernierClient > kmDepart
                    ? Math.round((kmDernierClient - kmDepart) * 100) / 100
                    : null;
            const kmTheorique = tableRows.reduce((sum, row) => {
                const v = Number(String(row?.kmTh ?? '').replace(',', '.'));
                return sum + (Number.isFinite(v) && v > 0 ? v : 0);
            }, 0);
            const decalageKm = kmReel != null && kmTheorique > 0
                ? Math.round((kmReel - kmTheorique) * 100) / 100
                : null;
            const decalageKmPct = decalageKm != null && kmTheorique > 0
                ? Math.round((decalageKm / kmTheorique) * 1000) / 10
                : null;
            const conformiteKm = decalageKmPct != null ? Math.abs(decalageKmPct) <= 10 : null;
            const hDep = this.parseTimeToMin(fd.h_depart);
            const hRet = this.parseTimeToMin(fd.h_retour);
            const dureeReelle = hDep != null && hRet != null && hRet > hDep ? hRet - hDep : null;
            const nbClients = tableRows.filter((r) => r?.client && String(r.client).trim()).length;
            const dureeEstimee = kmTheorique > 0 && nbClients > 0
                ? Math.round((kmTheorique / 50) * 60 + nbClients * 20)
                : null;
            const decalageTemps = dureeReelle != null && dureeEstimee != null ? dureeReelle - dureeEstimee : null;
            const decalageTPct = decalageTemps != null && dureeEstimee != null && dureeEstimee > 0
                ? Math.round((decalageTemps / dureeEstimee) * 1000) / 10
                : null;
            const conformiteTemps = decalageTPct != null ? Math.abs(decalageTPct) <= 15 : null;
            const clients = tableRows
                .filter((r) => r?.client && String(r.client).trim())
                .map((r) => ({
                code: r.client,
                livree: r.livree ?? false,
                kmArv: r.kmArv ?? '',
                kmTh: r.kmTh ?? '',
                arrivee: r.arrivee ?? '',
                depart: r.depart ?? '',
                region: r.region ?? '',
            }));
            return {
                id: fd.id,
                tmsId: fd.tms_id,
                date: fd.date ?? tmsItem?.date ?? '',
                wms: fd.wms ?? tmsItem?.wms ?? '',
                truck: fd.truck ?? tmsItem?.truck ?? '',
                driver: fd.driver ?? tmsItem?.driver ?? '',
                prestation: fd.prestation ?? '',
                site: tmsItem?.site ?? fd.siteId ?? '',
                kmReel,
                kmTheorique,
                decalageKm,
                decalageKmPct,
                conformiteKm,
                hDepart: fd.h_depart ?? '',
                hRetour: fd.h_retour ?? '',
                dureeReelle,
                dureeEstimee,
                decalageTemps,
                decalageTPct,
                conformiteTemps,
                clients,
                nbClients,
                updatedAt: fd.updated_at,
            };
        });
        const withKm = analysis.filter((a) => a.conformiteKm != null);
        const withTemps = analysis.filter((a) => a.conformiteTemps != null);
        const stats = {
            total: analysis.length,
            analyzed: analysis.filter((a) => a.kmReel != null || a.dureeReelle != null).length,
            pctKm: withKm.length > 0
                ? Math.round((withKm.filter((a) => a.conformiteKm).length / withKm.length) * 100)
                : 0,
            pctTemps: withTemps.length > 0
                ? Math.round((withTemps.filter((a) => a.conformiteTemps).length / withTemps.length) * 100)
                : 0,
            conformeKmCount: withKm.filter((a) => a.conformiteKm).length,
            conformeTCount: withTemps.filter((a) => a.conformiteTemps).length,
            totalWithKm: withKm.length,
            totalWithTemps: withTemps.length,
            totalKmReel: Math.round(analysis.reduce((s, a) => s + (a.kmReel ?? 0), 0) * 100) / 100,
            totalKmTh: Math.round(analysis.reduce((s, a) => s + (a.kmTheorique ?? 0), 0) * 100) / 100,
            totalDureeReelle: Math.round(analysis.reduce((s, a) => s + (a.dureeReelle ?? 0), 0)),
        };
        return { stats, rows: analysis };
    }
    emptyStats() {
        return {
            total: 0,
            analyzed: 0,
            pctKm: 0,
            pctTemps: 0,
            conformeKmCount: 0,
            conformeTCount: 0,
            totalWithKm: 0,
            totalWithTemps: 0,
            totalKmReel: 0,
            totalKmTh: 0,
            totalDureeReelle: 0,
        };
    }
};
exports.TmsService = TmsService;
exports.TmsService = TmsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tms_import_row_entity_1.TmsImportRow)),
    __param(1, (0, typeorm_1.InjectRepository)(tms_form_data_entity_1.TmsFormData)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        activity_log_service_1.ActivityLogService,
        anomaly_evaluation_service_1.AnomalyEvaluationService,
        clients_poi_service_1.ClientsPoiService,
        tour_leg_km_history_service_1.TourLegKmHistoryService])
], TmsService);
//# sourceMappingURL=tms.service.js.map