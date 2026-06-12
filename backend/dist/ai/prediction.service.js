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
var PredictionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const gemini_service_1 = require("./gemini.service");
let PredictionService = PredictionService_1 = class PredictionService {
    gemini;
    dataSource;
    logger = new common_1.Logger(PredictionService_1.name);
    constructor(gemini, dataSource) {
        this.gemini = gemini;
        this.dataSource = dataSource;
    }
    async predictDelays(tourneeIds) {
        if (tourneeIds && tourneeIds.length > 0) {
            const tournees = await this.fetchPendingTournees(tourneeIds);
            const predictions = [];
            for (const t of tournees) {
                const result = await this.predictSingleWithAI(t);
                if (result)
                    predictions.push(result);
            }
            predictions.sort((a, b) => b.riskScore - a.riskScore);
            return predictions;
        }
        return this.predictAllDriversBulk();
    }
    async predictAllDriversBulk() {
        try {
            const rows = await this.dataSource.query(`
        SELECT
          c.id AS chauffeur_id,
          CONCAT(TRIM(c.nom), ' ', TRIM(c.prenom)) AS driver,
          COALESCE(stats.total_tours, 0) AS total_tours,
          COALESCE(stats.conforme_count, 0) AS conforme_count,
          COALESCE(stats.non_conforme_count, 0) AS non_conforme_count,
          CASE WHEN COALESCE(stats.total_tours, 0) > 0
            THEN ROUND(stats.conforme_count * 100.0 / stats.total_tours)::int
            ELSE 0
          END AS conformity_pct,
          stats.last_voycle AS wms,
          stats.last_plamoti AS truck,
          stats.last_voydtd AS date,
          stats.last_sitcode AS site_id
        FROM chauffeurs c
        LEFT JOIN (
          SELECT
            td.sal_id,
            COUNT(*) AS total_tours,
            COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(td.otsetat, ''))) IN ('conforme', 'livraison effectuée', 'done')) AS conforme_count,
            COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(td.otsetat, ''))) NOT IN ('conforme', 'livraison effectuée', 'done', '', 'pending')
                             AND TRIM(COALESCE(td.otsetat, '')) <> '') AS non_conforme_count,
            (ARRAY_AGG(td.voycle ORDER BY td.cdate DESC NULLS LAST))[1] AS last_voycle,
            (ARRAY_AGG(td.plamoti ORDER BY td.cdate DESC NULLS LAST))[1] AS last_plamoti,
            (ARRAY_AGG(td.voydtd::text ORDER BY td.cdate DESC NULLS LAST))[1] AS last_voydtd,
            (ARRAY_AGG(td.sitcode ORDER BY td.cdate DESC NULLS LAST))[1] AS last_sitcode
          FROM transport_data td
          WHERE td.sal_id IS NOT NULL
          GROUP BY td.sal_id
        ) stats ON stats.sal_id::bigint = c.id
        ORDER BY COALESCE(stats.non_conforme_count, 0) DESC, c.nom ASC, c.prenom ASC
      `);
            if (!rows || rows.length === 0) {
                return [];
            }
            const predictions = rows.map((row) => {
                const conformityPct = Number(row.conformity_pct) || 0;
                const nonConformeCount = Number(row.non_conforme_count) || 0;
                const totalTours = Number(row.total_tours) || 1;
                let riskScore = 0;
                if (conformityPct < 40)
                    riskScore += 40;
                else if (conformityPct < 60)
                    riskScore += 30;
                else if (conformityPct < 75)
                    riskScore += 20;
                else if (conformityPct < 90)
                    riskScore += 10;
                if (nonConformeCount > 20)
                    riskScore += 30;
                else if (nonConformeCount > 10)
                    riskScore += 20;
                else if (nonConformeCount > 5)
                    riskScore += 15;
                else if (nonConformeCount > 2)
                    riskScore += 8;
                const ncRatio = nonConformeCount / totalTours;
                if (ncRatio > 0.5)
                    riskScore += 20;
                else if (ncRatio > 0.3)
                    riskScore += 12;
                else if (ncRatio > 0.15)
                    riskScore += 6;
                riskScore = Math.min(100, riskScore);
                const riskLevel = this.scoreToLevel(riskScore);
                const factors = [];
                if (conformityPct < 75) {
                    factors.push({
                        factor: 'Taux de conformité faible',
                        impact: 'negative',
                        detail: `Taux de conformité historique de ${conformityPct}%, ce qui indique un risque de non conformité (${nonConformeCount}/${totalTours} tournées).`,
                    });
                }
                else {
                    factors.push({
                        factor: 'Bon taux de conformité',
                        impact: 'positive',
                        detail: `Taux de conformité de ${conformityPct}% sur ${totalTours} tournée(s).`,
                    });
                }
                if (nonConformeCount > 5) {
                    factors.push({
                        factor: 'Nombreuses anomalies',
                        impact: 'negative',
                        detail: `${nonConformeCount} tournée(s) non conforme(s) enregistrée(s).`,
                    });
                }
                const recommendations = [];
                const ncRatioDisplay = totalTours > 0 ? Math.round((nonConformeCount / totalTours) * 100) : 0;
                if (totalTours === 0) {
                    recommendations.push('Aucun historique disponible — intégrer ce chauffeur dans le programme de suivi dès sa première tournée.');
                    recommendations.push('Organiser un entretien de prise en charge avant la première affectation.');
                }
                else if (riskLevel === 'critical') {
                    recommendations.push('⚠️ Risque critique détecté — suspension temporaire des tournées recommandée en attendant une évaluation complète.');
                    recommendations.push('Formation urgente et obligatoire sur les procédures de conformité.');
                    recommendations.push('Mise sous surveillance renforcée : chaque tournée doit être validée par un responsable avant départ.');
                    recommendations.push(`Taux de non-conformité de ${ncRatioDisplay}% — analyse des causes racines à effectuer immédiatement.`);
                    if (nonConformeCount > 10) {
                        recommendations.push('Entretien disciplinaire avec le responsable RH et le chef d\'exploitation pour identifier les causes récurrentes.');
                    }
                }
                else if (riskLevel === 'high') {
                    recommendations.push('Suivi rapproché obligatoire sur les 10 prochaines tournées.');
                    recommendations.push('Rappel formel des procédures de conformité et de la charte du chauffeur.');
                    if (conformityPct < 60) {
                        recommendations.push('Taux de conformité insuffisant — envisager un accompagnement terrain avec un chauffeur expérimenté.');
                    }
                    if (nonConformeCount > 10) {
                        recommendations.push('Entretien avec le responsable pour identifier les causes récurrentes des non-conformités.');
                    }
                    recommendations.push('Vérification systématique du véhicule et des documents avant chaque départ.');
                }
                else if (riskLevel === 'medium') {
                    recommendations.push('Rappel des bonnes pratiques de conformité recommandé lors du prochain briefing d\'équipe.');
                    if (conformityPct < 75) {
                        recommendations.push(`Amélioration du taux de conformité requise (actuellement ${conformityPct}%) — objectif cible : 85%.`);
                    }
                    if (nonConformeCount > 5) {
                        recommendations.push('Réunion de suivi individuel avec le chef d\'équipe pour faire le point sur les anomalies constatées.');
                    }
                    if (ncRatioDisplay > 20) {
                        recommendations.push(`${ncRatioDisplay}% des tournées sont non conformes — identifier si les causes sont récurrentes ou ponctuelles.`);
                    }
                    recommendations.push('Continuer à surveiller l\'évolution des indicateurs sur les prochains mois.');
                }
                else {
                    if (conformityPct >= 95) {
                        recommendations.push('🏆 Excellent niveau de conformité — chauffeur pouvant servir de référence pour les nouveaux arrivants.');
                    }
                    else {
                        recommendations.push('Bonne performance globale — maintenir les efforts de conformité.');
                    }
                    if (nonConformeCount === 0) {
                        recommendations.push('Aucune non-conformité enregistrée — félicitations pour la qualité du travail effectué.');
                    }
                    else if (nonConformeCount <= 2) {
                        recommendations.push('Très peu d\'écarts constatés — continuer sur cette lancée et remonter tout incident au responsable.');
                    }
                    recommendations.push('Éligible pour des missions de tutorat auprès des chauffeurs en difficulté.');
                }
                if (ncRatioDisplay > 30 && riskLevel !== 'critical') {
                    recommendations.push(`Ratio de non-conformité élevé (${ncRatioDisplay}%) — planifier une session de recyclage prochainement.`);
                }
                if (totalTours > 0 && totalTours < 5) {
                    recommendations.push('Chauffeur avec peu de tournées enregistrées — données insuffisantes pour une évaluation complète, renforcer le suivi.');
                }
                const predictedDelayMin = riskScore >= 75 ? 90 : riskScore >= 50 ? 45 : riskScore >= 25 ? 15 : 0;
                return {
                    tourneeId: row.id || '',
                    wms: row.wms || '',
                    driver: row.driver || '',
                    truck: row.truck || '',
                    date: row.date || '',
                    riskLevel,
                    riskScore,
                    predictedDelayMin,
                    factors,
                    recommendations,
                };
            });
            predictions.sort((a, b) => b.riskScore - a.riskScore);
            return predictions;
        }
        catch (err) {
            this.logger.error(`Bulk prediction failed: ${err?.message || err}`);
            return [];
        }
    }
    async predictSingleWithAI(tournee) {
        try {
            const stats = await this.getHistoricalStats(tournee.driver, tournee.truck, tournee.site_id || tournee.sitcode);
            const baseScore = this.calculateStatisticalRisk(stats);
            const prompt = `Analyse this delivery tour prediction data and return risk assessment as JSON:

TOURNÉE:
- Driver: ${tournee.driver || 'N/A'}
- Truck: ${tournee.truck || 'N/A'}  
- Date: ${tournee.date || 'N/A'}
- Site: ${tournee.site_id || tournee.sitcode || 'N/A'}

HISTORICAL STATS:
- Driver's past conformity rate: ${stats.driverConformityPct}%
- Driver's average delay: ${stats.driverAvgDelayMin} min
- Driver's anomaly count (30 days): ${stats.driverAnomalyCount}
- Truck's past conformity rate: ${stats.truckConformityPct}%
- Truck's anomaly count (30 days): ${stats.truckAnomalyCount}
- Route average duration: ${stats.routeAvgDurationMin} min
- Route km variance: ${stats.routeKmVariancePct}%
- Statistical base risk score: ${baseScore}/100

Return ONLY this JSON:
{
  "riskScore": number 0-100,
  "riskLevel": "low|medium|high|critical",
  "predictedDelayMin": number,
  "factors": [
    { "factor": "string", "impact": "positive|negative", "detail": "string in French" }
  ],
  "recommendations": ["string in French"]
}`;
            const systemInstruction = 'You are a logistics risk prediction AI. Return ONLY valid JSON, no markdown. Keep recommendations practical and specific.';
            const aiResult = await this.gemini.generateJSON(prompt, systemInstruction);
            return {
                tourneeId: tournee.id,
                wms: tournee.wms || tournee.voycle || '',
                driver: tournee.driver || tournee.salnom || '',
                truck: tournee.truck || tournee.plamoti || '',
                date: tournee.date || '',
                riskLevel: aiResult.riskLevel || this.scoreToLevel(baseScore),
                riskScore: Math.min(100, Math.max(0, aiResult.riskScore ?? baseScore)),
                predictedDelayMin: aiResult.predictedDelayMin ?? 0,
                factors: (aiResult.factors || []).map((f) => ({
                    factor: f.factor,
                    impact: f.impact,
                    detail: f.detail,
                })),
                recommendations: aiResult.recommendations || [],
            };
        }
        catch (err) {
            this.logger.warn(`Prediction failed for ${tournee.id}: ${err}`);
            return null;
        }
    }
    async fetchPendingTournees(ids) {
        try {
            if (ids && ids.length > 0) {
                const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
                return await this.dataSource.query(`SELECT id, date, wms, truck, driver, conformite, site_id, prestation_id,
                  h_depart, h_retour, km_depart, km_retour, observation
           FROM tms_form_data
           WHERE id IN (${placeholders})
           ORDER BY created_at DESC`, ids);
            }
            return await this.dataSource.query(`
        SELECT DISTINCT ON (LOWER(TRIM(driver)))
               id, date, wms, truck, driver, conformite, site_id, prestation_id,
               h_depart, h_retour, km_depart, km_retour, observation
        FROM tms_form_data
        WHERE driver IS NOT NULL AND TRIM(driver) <> ''
        ORDER BY LOWER(TRIM(driver)), created_at DESC
      `);
        }
        catch {
            return [];
        }
    }
    async getHistoricalStats(driver, truck, siteId) {
        const defaults = {
            driverConformityPct: 80,
            driverAvgDelayMin: 0,
            driverAnomalyCount: 0,
            truckConformityPct: 80,
            truckAnomalyCount: 0,
            routeAvgDurationMin: 0,
            routeKmVariancePct: 0,
        };
        try {
            if (driver) {
                const driverRows = await this.dataSource.query(`
          SELECT conformite, h_depart, h_retour, km_depart, km_retour
          FROM tms_form_data
          WHERE LOWER(TRIM(driver)) = LOWER(TRIM($1))
            AND created_at >= NOW() - INTERVAL '90 days'
          LIMIT 100
        `, [driver]);
                if (driverRows.length > 0) {
                    const conforme = driverRows.filter((r) => (r.conformite || '').toLowerCase().trim() === 'conforme').length;
                    defaults.driverConformityPct = Math.round((conforme / driverRows.length) * 100);
                    const durations = driverRows
                        .map((r) => this.timeDiffMinutes(r.h_depart, r.h_retour))
                        .filter((d) => d > 0);
                    if (durations.length > 0) {
                        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
                        defaults.driverAvgDelayMin = Math.round(avg);
                    }
                }
                const anomalies = await this.dataSource.query(`
          SELECT COUNT(*) as cnt
          FROM anomalies
          WHERE tournee_id IN (
            SELECT id FROM tms_form_data
            WHERE LOWER(TRIM(driver)) = LOWER(TRIM($1))
          )
          AND created_at >= NOW() - INTERVAL '30 days'
        `, [driver]);
                defaults.driverAnomalyCount = Number(anomalies?.[0]?.cnt || 0);
            }
            if (truck) {
                const truckRows = await this.dataSource.query(`
          SELECT conformite FROM tms_form_data
          WHERE LOWER(TRIM(truck)) = LOWER(TRIM($1))
            AND created_at >= NOW() - INTERVAL '90 days'
          LIMIT 100
        `, [truck]);
                if (truckRows.length > 0) {
                    const conforme = truckRows.filter((r) => (r.conformite || '').toLowerCase().trim() === 'conforme').length;
                    defaults.truckConformityPct = Math.round((conforme / truckRows.length) * 100);
                }
                const truckAnomalies = await this.dataSource.query(`
          SELECT COUNT(*) as cnt FROM anomalies
          WHERE camion_id = $1
            AND created_at >= NOW() - INTERVAL '30 days'
        `, [truck]);
                defaults.truckAnomalyCount = Number(truckAnomalies?.[0]?.cnt || 0);
            }
            if (siteId) {
                const routeRows = await this.dataSource.query(`
          SELECT km_depart, km_retour, h_depart, h_retour
          FROM tms_form_data
          WHERE LOWER(TRIM(site_id)) = LOWER(TRIM($1))
            AND created_at >= NOW() - INTERVAL '90 days'
          LIMIT 100
        `, [siteId]);
                if (routeRows.length > 0) {
                    const kms = routeRows
                        .map((r) => {
                        const d = Number(String(r.km_depart || '0').replace(',', '.'));
                        const ret = Number(String(r.km_retour || '0').replace(',', '.'));
                        return ret - d;
                    })
                        .filter((k) => k > 0);
                    if (kms.length > 0) {
                        const avg = kms.reduce((a, b) => a + b, 0) / kms.length;
                        const variance = kms.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / kms.length;
                        defaults.routeKmVariancePct = avg > 0 ? Math.round((Math.sqrt(variance) / avg) * 100) : 0;
                    }
                    const durations = routeRows
                        .map((r) => this.timeDiffMinutes(r.h_depart, r.h_retour))
                        .filter((d) => d > 0);
                    if (durations.length > 0) {
                        defaults.routeAvgDurationMin = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
                    }
                }
            }
        }
        catch (err) {
            this.logger.warn(`Historical stats error: ${err}`);
        }
        return defaults;
    }
    calculateStatisticalRisk(stats) {
        let score = 0;
        if (stats.driverConformityPct < 60)
            score += 30;
        else if (stats.driverConformityPct < 75)
            score += 20;
        else if (stats.driverConformityPct < 90)
            score += 10;
        if (stats.driverAnomalyCount > 10)
            score += 25;
        else if (stats.driverAnomalyCount > 5)
            score += 15;
        else if (stats.driverAnomalyCount > 2)
            score += 8;
        if (stats.truckConformityPct < 60)
            score += 20;
        else if (stats.truckConformityPct < 75)
            score += 12;
        else if (stats.truckConformityPct < 90)
            score += 5;
        if (stats.routeKmVariancePct > 30)
            score += 15;
        else if (stats.routeKmVariancePct > 15)
            score += 8;
        if (stats.truckAnomalyCount > 5)
            score += 10;
        return Math.min(100, score);
    }
    scoreToLevel(score) {
        if (score >= 75)
            return 'critical';
        if (score >= 50)
            return 'high';
        if (score >= 25)
            return 'medium';
        return 'low';
    }
    timeDiffMinutes(start, end) {
        if (!start || !end)
            return 0;
        const parseTime = (s) => {
            const m = String(s).match(/^(\d{1,2}):(\d{2})/);
            return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
        };
        const diff = parseTime(end) - parseTime(start);
        return diff > 0 ? diff : 0;
    }
};
exports.PredictionService = PredictionService;
exports.PredictionService = PredictionService = PredictionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService,
        typeorm_1.DataSource])
], PredictionService);
//# sourceMappingURL=prediction.service.js.map