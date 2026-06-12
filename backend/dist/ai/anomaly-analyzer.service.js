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
var AnomalyAnalyzerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomalyAnalyzerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const gemini_service_1 = require("./gemini.service");
const mail_service_1 = require("../mail/mail.service");
const config_1 = require("@nestjs/config");
let AnomalyAnalyzerService = AnomalyAnalyzerService_1 = class AnomalyAnalyzerService {
    gemini;
    mail;
    config;
    dataSource;
    logger = new common_1.Logger(AnomalyAnalyzerService_1.name);
    constructor(gemini, mail, config, dataSource) {
        this.gemini = gemini;
        this.mail = mail;
        this.config = config;
        this.dataSource = dataSource;
    }
    async analyzeNonConformites(dateFrom, dateTo) {
        const anomalies = await this.fetchAnomalyData(dateFrom, dateTo);
        const formData = await this.fetchNonConformeFormData(dateFrom, dateTo);
        if (anomalies.length === 0 && formData.length === 0) {
            return {
                summary: 'Aucune anomalie trouvée pour la période sélectionnée.',
                totalNonConforme: 0,
                period: `${dateFrom || 'début'} → ${dateTo || 'maintenant'}`,
                rootCauses: [],
                recommendations: [],
                patterns: [],
            };
        }
        const prompt = this.buildAnalysisPrompt(anomalies, formData, dateFrom, dateTo);
        const systemInstruction = `You are an expert logistics analyst for a Tunisian transport company.
Analyze the provided delivery tour (tournée) anomaly data and return a JSON object with this exact structure:
{
  "summary": "string - 2-3 sentence executive summary in French",
  "rootCauses": [
    {
      "category": "string - e.g. 'Excès de carburant', 'Retard récurrent', 'Déviation d'itinéraire', 'Données manquantes'",
      "count": number,
      "description": "string - detailed explanation in French",
      "severity": "critical|high|medium|low"
    }
  ],
  "recommendations": [
    {
      "priority": number,
      "action": "string - specific actionable recommendation in French",
      "expectedImpact": "string - expected improvement in French"
    }
  ],
  "patterns": [
    {
      "pattern": "string - identified pattern name in French",
      "affectedTournees": number,
      "details": "string - details in French"
    }
  ]
}
Return ONLY valid JSON, no markdown.`;
        try {
            const result = await this.gemini.generateJSON(prompt, systemInstruction);
            return {
                ...result,
                totalNonConforme: anomalies.length + formData.length,
                period: `${dateFrom || 'début'} → ${dateTo || 'maintenant'}`,
            };
        }
        catch (err) {
            this.logger.error('Gemini analysis failed:', err);
            return {
                summary: 'Erreur lors de l\'analyse IA. Veuillez réessayer.',
                totalNonConforme: anomalies.length + formData.length,
                period: `${dateFrom || 'début'} → ${dateTo || 'maintenant'}`,
                rootCauses: [],
                recommendations: [],
                patterns: [],
            };
        }
    }
    async sendReport(analysis, recipientEmail) {
        const to = recipientEmail || this.config.get('ANOMALY_REPORT_EMAIL') || 'ghardadounadhir306@gmail.com';
        if (!this.mail.isConfigured()) {
            this.logger.warn('SMTP not configured — cannot send anomaly report email.');
            return { sent: false, to };
        }
        const html = this.buildEmailHtml(analysis);
        try {
            await this.mail.sendMail({
                to,
                subject: `🚨 Rapport IA — ${analysis.totalNonConforme} Tournées Non Conformes (${analysis.period})`,
                html,
            });
            this.logger.log(`Anomaly report sent to ${to}`);
            return { sent: true, to };
        }
        catch (err) {
            this.logger.error(`Failed to send anomaly report: ${err}`);
            return { sent: false, to };
        }
    }
    async fetchAnomalyData(dateFrom, dateTo) {
        try {
            let sql = `
        SELECT id, salmemoe AS driver, sitecamion AS truck, otdcode AS client,
               sitcode AS site, voydtd AS date, voypal AS palettes,
               plakm1 AS km_start, plakm2 AS km_end, states, plamoti AS motif
        FROM transport_data
        WHERE (salmemoe IS NULL OR salmemoe = ''
               OR sitecamion IS NULL OR sitecamion = ''
               OR voypal IS NULL OR voypal = 0
               OR states = 'pending')
      `;
            const params = [];
            if (dateFrom) {
                params.push(dateFrom);
                sql += ` AND voydtd >= $${params.length}::date`;
            }
            if (dateTo) {
                params.push(dateTo);
                sql += ` AND voydtd <= ($${params.length}::date + interval '1 day')`;
            }
            sql += ` ORDER BY "createdAt" DESC LIMIT 500`;
            return await this.dataSource.query(sql, params);
        }
        catch (err) {
            this.logger.warn(`fetchAnomalyData error: ${err.message}`);
            return [];
        }
    }
    async fetchNonConformeFormData(dateFrom, dateTo) {
        try {
            let sql = `
        SELECT id, date, driver, truck, conformite, observation,
               h_depart, h_retour, km_depart, km_retour, marchandise,
               site_id, prestation_id
        FROM tms_form_data
        WHERE LOWER(TRIM(COALESCE(conformite, ''))) NOT IN ('conforme', '')
      `;
            const params = [];
            if (dateFrom) {
                params.push(dateFrom);
                sql += ` AND date >= $${params.length}`;
            }
            if (dateTo) {
                params.push(dateTo);
                sql += ` AND date <= $${params.length}`;
            }
            sql += ` ORDER BY created_at DESC LIMIT 500`;
            return await this.dataSource.query(sql, params);
        }
        catch {
            return [];
        }
    }
    buildAnalysisPrompt(anomalies, formData, dateFrom, dateTo) {
        const period = `${dateFrom || 'début'} → ${dateTo || 'maintenant'}`;
        const total = anomalies.length + formData.length;
        const missingDriver = anomalies.filter((a) => !a.driver || a.driver === '').length;
        const missingTruck = anomalies.filter((a) => !a.truck || a.truck === '').length;
        const zeroPalettes = anomalies.filter((a) => !a.palettes || a.palettes === 0).length;
        const pendingState = anomalies.filter((a) => a.states === 'pending').length;
        const driverIssues = {};
        for (const a of anomalies) {
            if (a.driver)
                driverIssues[a.driver] = (driverIssues[a.driver] || 0) + 1;
        }
        const siteIssues = {};
        for (const a of anomalies) {
            if (a.site)
                siteIssues[a.site] = (siteIssues[a.site] || 0) + 1;
        }
        const conformiteReasons = {};
        for (const f of formData) {
            const reason = f.conformite || 'Non spécifié';
            conformiteReasons[reason] = (conformiteReasons[reason] || 0) + 1;
        }
        return `Analyse les données de transport pour la période: ${period}

ANOMALIES TRANSPORT (${anomalies.length} total):
- Chauffeur manquant: ${missingDriver}
- Camion manquant: ${missingTruck}
- Palettes à zéro: ${zeroPalettes}
- État "pending" (non finalisé): ${pendingState}
- Chauffeurs les plus touchés: ${JSON.stringify(Object.entries(driverIssues).sort((a, b) => b[1] - a[1]).slice(0, 5))}
- Sites les plus touchés: ${JSON.stringify(Object.entries(siteIssues).sort((a, b) => b[1] - a[1]).slice(0, 5))}

FICHES NON CONFORMES (${formData.length}):
Raisons: ${JSON.stringify(conformiteReasons)}

Analyse les causes profondes, identifie les patterns récurrents, et propose des actions correctives concrètes.`;
    }
    buildEmailHtml(analysis) {
        const severityColor = (s) => {
            switch (s) {
                case 'critical': return '#dc2626';
                case 'high': return '#f97316';
                case 'medium': return '#eab308';
                case 'low': return '#22c55e';
                default: return '#64748b';
            }
        };
        const causesHtml = analysis.rootCauses.map((c) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${severityColor(c.severity)};margin-right:8px;"></span>
          <strong>${c.category}</strong>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;">${c.count}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">${c.description}</td>
      </tr>
    `).join('');
        const recsHtml = analysis.recommendations.map((r) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:800;color:#f97316;">#${r.priority}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">${r.action}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#16a34a;">${r.expectedImpact}</td>
      </tr>
    `).join('');
        return `
    <!DOCTYPE html>
    <html>
    <body style="font-family:'Segoe UI',Roboto,sans-serif;background:#f8fafc;margin:0;padding:20px;">
      <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#1e293b,#0f172a);padding:30px;color:#fff;">
          <h1 style="margin:0 0 8px;font-size:22px;">🤖 Rapport d'Analyse IA — Tournées Non Conformes</h1>
          <p style="margin:0;opacity:0.8;font-size:14px;">Période: ${analysis.period} · ${analysis.totalNonConforme} anomalies détectées</p>
        </div>

        <div style="padding:24px;">
          <div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:16px;border-radius:8px;margin-bottom:24px;">
            <strong>📊 Résumé:</strong> ${analysis.summary}
          </div>

          <h2 style="font-size:16px;color:#1e293b;margin:24px 0 12px;">🔍 Causes Principales</h2>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:10px 14px;text-align:left;">Catégorie</th>
                <th style="padding:10px 14px;text-align:center;">Count</th>
                <th style="padding:10px 14px;text-align:left;">Description</th>
              </tr>
            </thead>
            <tbody>${causesHtml}</tbody>
          </table>

          <h2 style="font-size:16px;color:#1e293b;margin:24px 0 12px;">💡 Recommandations</h2>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:10px 14px;text-align:center;">Priorité</th>
                <th style="padding:10px 14px;text-align:left;">Action</th>
                <th style="padding:10px 14px;text-align:left;">Impact Attendu</th>
              </tr>
            </thead>
            <tbody>${recsHtml}</tbody>
          </table>
        </div>

        <div style="background:#f1f5f9;padding:16px 24px;text-align:center;font-size:12px;color:#64748b;">
          Rapport généré par LUMIÈRE Logistique — Module IA · ${new Date().toLocaleString('fr-FR')}
        </div>
      </div>
    </body>
    </html>`;
    }
};
exports.AnomalyAnalyzerService = AnomalyAnalyzerService;
exports.AnomalyAnalyzerService = AnomalyAnalyzerService = AnomalyAnalyzerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService,
        mail_service_1.MailService,
        config_1.ConfigService,
        typeorm_1.DataSource])
], AnomalyAnalyzerService);
//# sourceMappingURL=anomaly-analyzer.service.js.map