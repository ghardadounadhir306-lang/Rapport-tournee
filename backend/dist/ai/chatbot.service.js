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
var ChatbotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const gemini_service_1 = require("./gemini.service");
const TMS_SCHEMA_DESCRIPTION = `
You have access to a PostgreSQL database with the following table:

TABLE: tms_form_data
COLUMNS:
  id              VARCHAR(255) PRIMARY KEY  -- unique record id
  tms_id          VARCHAR(255)             -- TMS system id
  date            VARCHAR(255)             -- date of the tournée (format varies: YYYY-MM-DD or DD/MM/YYYY)
  wms             VARCHAR(255)             -- WMS number
  prestation      VARCHAR(255)             -- prestation description (free text)
  prestation_id   VARCHAR(255)             -- stable prestation code
  site_id         VARCHAR(255)             -- site / depot code
  truck           VARCHAR(255)             -- truck plate number (camion)
  driver          VARCHAR(255)             -- driver name (chauffeur)
  dep             VARCHAR(255)             -- department
  km_facture      VARCHAR(255)             -- invoiced KM
  marchandise     VARCHAR(255)             -- merchandise description
  conformite      VARCHAR(255)             -- conformity status: 'Conforme', 'Non Conforme', 'Absence BL', 'Absence cachet et Signature ( Décharge)', 'Kilométrage erronée', 'Nombre de palette non conforme', 'Retard communication dérogation', 'Retard envoie document', 'Livraison effectuée', 'Livraison non effectuée', 'Autres'
  observation     TEXT                     -- free text observation / comments
  h_depart        VARCHAR(255)             -- departure time
  km_depart       VARCHAR(255)             -- departure KM
  h_retour        VARCHAR(255)             -- return time
  km_retour       VARCHAR(255)             -- return KM
  km_dernier_client VARCHAR(255)           -- KM at last client
  km_moy          VARCHAR(255)             -- average KM
  total_palettes  VARCHAR(255)             -- total palettes count
  total_palettes_2 VARCHAR(255)            -- secondary palette count
  tournee_sec     VARCHAR(255)             -- secondary tour code
  apres_midi      BOOLEAN                  -- afternoon shift flag
  inter_site      BOOLEAN                  -- inter-site flag
  gps_start_lat   DECIMAL(10,7)            -- GPS start latitude
  gps_start_lng   DECIMAL(10,7)            -- GPS start longitude
  gps_end_lat     DECIMAL(10,7)            -- GPS end latitude
  gps_end_lng     DECIMAL(10,7)            -- GPS end longitude
  table_rows      JSON                     -- detail rows (JSON array of client stops)
  created_at      TIMESTAMP                -- record creation time
  updated_at      TIMESTAMP                -- last update time

IMPORTANT NOTES:
- "tournée" = delivery tour / round
- conformite values: 'Conforme' means OK; anything else is a type of anomaly/non-conformité
- KM fields and palette fields are VARCHAR, cast to numeric when doing math
- date field may contain different formats, handle with care
- driver = chauffeur name
- truck = camion plate number
`;
let ChatbotService = ChatbotService_1 = class ChatbotService {
    gemini;
    dataSource;
    logger = new common_1.Logger(ChatbotService_1.name);
    constructor(gemini, dataSource) {
        this.gemini = gemini;
        this.dataSource = dataSource;
    }
    async chat(message, history = []) {
        const detectedLang = this.detectLanguage(message);
        const localAnswer = await this.tryLocalAnswer(message, detectedLang);
        if (localAnswer) {
            return localAnswer;
        }
        if (this.gemini.isReady()) {
            try {
                return await this.askGemini(message, detectedLang, history);
            }
            catch (err) {
                this.logger.warn(`Gemini chatbot failed: ${err?.message || err}`);
            }
        }
        const replies = {
            fr: 'Le service IA est temporairement indisponible. Veuillez réessayer dans quelques instants. Je peux répondre à vos questions sur les données de transport ainsi qu\'à des questions générales.',
            en: 'The AI service is temporarily unavailable. Please try again in a moment. I can answer both transport data questions and general knowledge questions.',
            ar: 'خدمة الذكاء الاصطناعي غير متوفرة حالياً. حاول مرة أخرى بعد شوية. نجم نجاوبك على أسئلة النقل وأسئلة عامة.',
        };
        return {
            reply: replies[detectedLang] || replies.fr,
            language: detectedLang,
        };
    }
    async askGemini(message, detectedLang, history) {
        const langMap = {
            fr: 'French',
            en: 'English',
            ar: 'Arabic (Tunisian dialect when appropriate)',
        };
        const responseLang = langMap[detectedLang] || 'French';
        const systemPrompt = `You are LUMIÈRE IA, an intelligent and versatile assistant for a Tunisian transport/logistics company.
You can answer TWO types of questions:

TYPE 1 — DATA QUESTIONS: Questions about delivery tours (tournées), drivers, trucks, conformity, etc.
For these, you generate a SQL query against the PostgreSQL database.

${TMS_SCHEMA_DESCRIPTION}

TYPE 2 — GENERAL KNOWLEDGE: Any other question (culture, science, math, advice, definitions, etc.)
For these, you answer directly from your own knowledge — no SQL needed.

INSTRUCTIONS:
1. Analyze the user's question carefully.
2. If it's a DATA question → generate a read-only PostgreSQL SQL query (SELECT only).
3. If it's a GENERAL question → answer directly with your knowledge.
4. Return your response as a JSON object with this exact structure:
{
  "sql": "SELECT ... FROM tms_form_data ..." or null if general question,
  "explanation": "Brief explanation",
  "responseTemplate": "Your full natural language answer in ${responseLang}. For data questions, use {{count}} for row count. For general questions, put your complete answer here.",
  "chartType": "table" or null for general questions
}

RULES:
- ALWAYS respond in ${responseLang}.
- For data questions: SQL must be valid PostgreSQL with COALESCE, TRIM, LOWER for text. LIMIT 50 max. chartType = "table", "bar", or "pie".
- For general questions: set sql to null, chartType to null, and put your full helpful answer in responseTemplate.
- Do NOT use any DDL or DML statements. Only SELECT queries.
- Return ONLY valid JSON, no markdown, no extra text.`;
        const historyContext = history.length > 0
            ? '\n\nRecent conversation:\n' + history.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')
            : '';
        const userPrompt = `User question: "${message}"${historyContext}

Analyze the question and respond appropriately. If it's a data question, generate a SQL query. If it's a general knowledge question, answer directly.`;
        const rawResponse = await this.gemini.generate(userPrompt, systemPrompt);
        const cleaned = rawResponse
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        }
        catch {
            this.logger.warn('Failed to parse Gemini chatbot JSON: ' + cleaned.slice(0, 300));
            return {
                reply: cleaned.length > 10 && cleaned.length < 500 ? cleaned : this.getFallbackReply(detectedLang),
                language: detectedLang,
            };
        }
        if (!parsed.sql) {
            return {
                reply: parsed.responseTemplate || this.getFallbackReply(detectedLang),
                language: detectedLang,
                chartType: null,
            };
        }
        const sqlUpper = parsed.sql.toUpperCase().trim();
        if (/\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)\b/.test(sqlUpper)) {
            this.logger.warn(`Gemini tried to generate unsafe SQL: ${parsed.sql.slice(0, 200)}`);
            return {
                reply: this.getFallbackReply(detectedLang),
                language: detectedLang,
            };
        }
        try {
            const rows = await this.dataSource.query(parsed.sql);
            let reply = parsed.responseTemplate || parsed.explanation || '';
            reply = reply.replace('{{count}}', String(rows?.length || 0));
            reply = reply.replace('{{data}}', '');
            if (!rows || rows.length === 0) {
                const noDataReplies = {
                    fr: 'Aucune donnée trouvée pour votre demande.',
                    en: 'No data found for your request.',
                    ar: 'ما لقينا حتى بيانات.',
                };
                return {
                    reply: reply || noDataReplies[detectedLang] || noDataReplies.fr,
                    data: [],
                    chartType: 'table',
                    language: detectedLang,
                };
            }
            return {
                reply,
                data: rows.slice(0, 50),
                chartType: parsed.chartType || 'table',
                language: detectedLang,
            };
        }
        catch (sqlErr) {
            this.logger.warn(`Gemini SQL execution failed: ${sqlErr?.message}`);
            this.logger.debug(`Failed SQL: ${parsed.sql}`);
            const errorReplies = {
                fr: 'Désolé, je n\'ai pas pu exécuter cette requête. Essayez de reformuler votre question.',
                en: 'Sorry, I could not execute that query. Try rephrasing your question.',
                ar: 'معذرة، ما نجمتش نلقى الإجابة. جرّب اعمل السؤال بطريقة أخرى.',
            };
            return {
                reply: errorReplies[detectedLang] || errorReplies.fr,
                language: detectedLang,
            };
        }
    }
    getFallbackReply(lang) {
        const replies = {
            fr: 'Je n\'ai pas pu comprendre votre question. Vous pouvez me poser des questions sur les données de transport (ex: "Combien de tournées non conformes ?") ou des questions générales (ex: "Qu\'est-ce que la logistique ?", "Quelle est la capitale de la France ?").',
            en: 'I couldn\'t understand your question. You can ask me about transport data (e.g. "How many non-conforme tours?") or general questions (e.g. "What is logistics?", "What is the capital of France?").',
            ar: 'ما فهمت سؤالك. تنجم تسألني على بيانات النقل (مثلاً: "قداش تورنة غير مطابقة؟") ولا أسئلة عامة (مثلاً: "شنوة اللوجستيك؟").',
        };
        return replies[lang] || replies.fr;
    }
    detectLanguage(text) {
        const lower = text.toLowerCase();
        if (/[\u0600-\u06FF]/.test(text))
            return 'ar';
        const darijaPatterns = /\b(a3tini|chniya|mta3|bech|bich|kifech|3lech|w[ae]l[aie]|ya[3kh]i|tourneyat|n7eb|t9oul|7all)\b/i;
        if (darijaPatterns.test(lower))
            return 'ar';
        const englishPatterns = /\b(show|me|the|give|what|how|where|when|please|find|get|list|report)\b/i;
        const frenchPatterns = /\b(montre|donne|les|des|pour|dans|quel|comment|avec|tournées|tournee|chauffeur|camion)\b/i;
        const enScore = (lower.match(englishPatterns) || []).length;
        const frScore = (lower.match(frenchPatterns) || []).length;
        if (enScore > frScore)
            return 'en';
        return 'fr';
    }
    normalizeText(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }
    isDriverAnomalyQuestion(message) {
        const normalized = this.normalizeText(message);
        const anomalyWords = ['anomal', 'non conforme', 'erreur', 'probleme', 'issue'];
        const driverWords = ['chauffeur', 'driver', 'conducteur', 'shofe', 'sourfeur'];
        const rankingWords = ['plus', 'most', 'top', 'max', 'maximum', 'qui a', 'quel', 'which'];
        return (anomalyWords.some((word) => normalized.includes(word)) &&
            driverWords.some((word) => normalized.includes(word)) &&
            rankingWords.some((word) => normalized.includes(word)));
    }
    isConformiteCountQuestion(message) {
        const normalized = this.normalizeText(message);
        const countWords = ['combien', 'nombre', 'total', 'count', 'how many', 'قداش', 'كم'];
        const conformiteWords = ['conforme', 'non conforme', 'conformite', 'conformité', 'مطابقة', 'غير مطابقة'];
        return (countWords.some((w) => normalized.includes(w)) &&
            conformiteWords.some((w) => normalized.includes(w)));
    }
    getConformiteFilter(message) {
        const normalized = this.normalizeText(message);
        if (normalized.includes('non conforme') || normalized.includes('غير مطابقة') || normalized.includes('non-conforme')) {
            return 'non_conforme';
        }
        if (normalized.includes('conforme') || normalized.includes('مطابقة')) {
            return 'conforme';
        }
        return 'all';
    }
    async tryLocalAnswer(message, detectedLang) {
        if (this.isConformiteCountQuestion(message)) {
            return this.answerConformiteCount(message, detectedLang);
        }
        if (!this.isDriverAnomalyQuestion(message)) {
            return null;
        }
        try {
            const rows = await this.dataSource.query(`SELECT COALESCE(NULLIF(TRIM(driver), ''), 'Non renseigné') AS driver,
                COUNT(*)::int AS anomaly_count
         FROM tms_form_data
         WHERE LOWER(TRIM(COALESCE(conformite, ''))) LIKE '%non conforme%'
         GROUP BY COALESCE(NULLIF(TRIM(driver), ''), 'Non renseigné')
         ORDER BY anomaly_count DESC, driver ASC
         LIMIT 50`);
            if (!rows?.length) {
                return {
                    reply: detectedLang === 'ar'
                        ? 'لا توجد مخالفات مسجلة حالياً.'
                        : detectedLang === 'en'
                            ? 'No anomalies are currently recorded.'
                            : 'Aucune anomalie n\'est actuellement enregistrée.',
                    data: [],
                    chartType: 'table',
                    language: detectedLang,
                };
            }
            const top = rows[0];
            const topCount = Number(top.anomaly_count) || 0;
            const topDriver = String(top.driver || 'Non renseigné');
            return {
                reply: detectedLang === 'ar'
                    ? `أكثر شوفير عندو مخالفات هو ${topDriver} بعدد ${topCount} مخالفة. أرفقت لك الترتيب الكامل بالجدول.`
                    : detectedLang === 'en'
                        ? `The driver with the most anomalies is ${topDriver} with ${topCount} anomalies. I attached the full ranking below.`
                        : `Le chauffeur qui a le plus d'anomalies est ${topDriver} avec ${topCount} anomalie(s). J'ai joint le classement complet ci-dessous.`,
                data: rows,
                chartType: 'table',
                language: detectedLang,
            };
        }
        catch (err) {
            this.logger.warn(`Local chatbot fallback failed: ${err?.message || err}`);
            return null;
        }
    }
    async answerConformiteCount(message, detectedLang) {
        const filter = this.getConformiteFilter(message);
        try {
            const rows = await this.dataSource.query(`SELECT COALESCE(NULLIF(TRIM(conformite), ''), 'Non renseigné') AS conformite,
                COUNT(*)::int AS total
         FROM tms_form_data
         GROUP BY COALESCE(NULLIF(TRIM(conformite), ''), 'Non renseigné')
         ORDER BY total DESC`);
            if (!rows?.length) {
                const noDataReplies = {
                    fr: 'Aucune donnée de tournée n\'est enregistrée pour le moment.',
                    en: 'No tour data is currently recorded.',
                    ar: 'لا توجد بيانات تورنات مسجلة حالياً.',
                };
                return {
                    reply: noDataReplies[detectedLang] || noDataReplies.fr,
                    data: [],
                    chartType: 'table',
                    language: detectedLang,
                };
            }
            const grandTotal = rows.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
            if (filter === 'non_conforme') {
                const nonConformeRows = rows.filter((r) => (r.conformite || '').toLowerCase().trim() !== 'conforme' && r.conformite !== 'Non renseigné');
                const nonConformeTotal = nonConformeRows.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
                const replies = {
                    fr: `Il y a ${nonConformeTotal} tournée(s) non conforme(s) sur un total de ${grandTotal}. Voici le détail par type ci-dessous.`,
                    en: `There are ${nonConformeTotal} non-conforme tour(s) out of ${grandTotal} total. See the breakdown by type below.`,
                    ar: `عندك ${nonConformeTotal} تورنة غير مطابقة من مجموع ${grandTotal}. التفاصيل حسب النوع في الجدول.`,
                };
                return {
                    reply: replies[detectedLang] || replies.fr,
                    data: rows,
                    chartType: 'table',
                    language: detectedLang,
                };
            }
            if (filter === 'conforme') {
                const conformeRow = rows.find((r) => (r.conformite || '').toLowerCase().trim() === 'conforme');
                const conformeTotal = conformeRow ? Number(conformeRow.total) || 0 : 0;
                const replies = {
                    fr: `Il y a ${conformeTotal} tournée(s) conforme(s) sur un total de ${grandTotal}. Voici le détail complet ci-dessous.`,
                    en: `There are ${conformeTotal} conforme tour(s) out of ${grandTotal} total. See the full breakdown below.`,
                    ar: `عندك ${conformeTotal} تورنة مطابقة من مجموع ${grandTotal}. التفاصيل الكاملة في الجدول.`,
                };
                return {
                    reply: replies[detectedLang] || replies.fr,
                    data: rows,
                    chartType: 'table',
                    language: detectedLang,
                };
            }
            const replies = {
                fr: `Total de ${grandTotal} tournée(s). Voici la répartition par conformité ci-dessous.`,
                en: `Total of ${grandTotal} tour(s). See the conformity breakdown below.`,
                ar: `المجموع ${grandTotal} تورنة. التوزيع حسب المطابقة في الجدول.`,
            };
            return {
                reply: replies[detectedLang] || replies.fr,
                data: rows,
                chartType: 'table',
                language: detectedLang,
            };
        }
        catch (err) {
            this.logger.warn(`Conformité count query failed: ${err?.message || err}`);
            return null;
        }
    }
};
exports.ChatbotService = ChatbotService;
exports.ChatbotService = ChatbotService = ChatbotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService,
        typeorm_1.DataSource])
], ChatbotService);
//# sourceMappingURL=chatbot.service.js.map