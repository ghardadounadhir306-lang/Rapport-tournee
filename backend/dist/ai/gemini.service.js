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
var GeminiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
let GeminiService = GeminiService_1 = class GeminiService {
    config;
    logger = new common_1.Logger(GeminiService_1.name);
    model = null;
    lastCallTime = 0;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        const key = this.config.get('GEMINI_API_KEY');
        if (!key) {
            this.logger.warn('GEMINI_API_KEY not configured — AI features disabled.');
            return;
        }
        const genAI = new generative_ai_1.GoogleGenerativeAI(key);
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        this.logger.log('Gemini AI model initialized (gemini-2.5-flash)');
    }
    isReady() {
        return this.model !== null;
    }
    async generate(prompt, systemInstruction) {
        if (!this.model) {
            throw new Error('Gemini AI is not configured. Set GEMINI_API_KEY in .env');
        }
        const now = Date.now();
        const elapsed = now - this.lastCallTime;
        if (elapsed < 4000) {
            await new Promise((r) => setTimeout(r, 4000 - elapsed));
        }
        const maxRetries = 3;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                this.lastCallTime = Date.now();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10_000);
                try {
                    const result = await this.model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        systemInstruction: systemInstruction
                            ? { role: 'user', parts: [{ text: systemInstruction }] }
                            : undefined,
                    });
                    clearTimeout(timeoutId);
                    return result.response.text();
                }
                catch (innerErr) {
                    clearTimeout(timeoutId);
                    throw innerErr;
                }
            }
            catch (err) {
                const status = err?.status ?? err?.httpStatusCode ?? 0;
                const msg = err?.message ?? String(err);
                if ((status === 429 || msg.includes('429') || msg.includes('quota')) && attempt < maxRetries) {
                    const waitMs = Math.min(60_000, 10_000 * (attempt + 1));
                    this.logger.warn(`Gemini rate limited (attempt ${attempt + 1}/${maxRetries}), waiting ${waitMs / 1000}s...`);
                    await new Promise((r) => setTimeout(r, waitMs));
                    continue;
                }
                const isTimeout = msg.includes('AbortError') || msg.includes('timeout');
                const logMsg = isTimeout
                    ? `Gemini request timeout (10s) on attempt ${attempt + 1}/${maxRetries}`
                    : `Gemini generation failed: ${msg}`;
                this.logger.error(logMsg);
                if (isTimeout && attempt < maxRetries) {
                    this.logger.warn(`Retrying after timeout...`);
                    continue;
                }
                throw new Error(status === 429 || msg.includes('429')
                    ? 'Quota Gemini épuisé. Veuillez patienter quelques minutes avant de réessayer.'
                    : isTimeout
                        ? 'Gemini API timeout. Veuillez réessayer.'
                        : `Erreur Gemini: ${msg}`);
            }
        }
        throw new Error('Gemini generation failed after retries');
    }
    async generateJSON(prompt, systemInstruction) {
        const raw = await this.generate(prompt, systemInstruction);
        const cleaned = raw
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
        try {
            return JSON.parse(cleaned);
        }
        catch {
            this.logger.warn('Failed to parse Gemini JSON, raw output: ' + raw.slice(0, 200));
            throw new Error('Réponse IA invalide. Veuillez réessayer.');
        }
    }
};
exports.GeminiService = GeminiService;
exports.GeminiService = GeminiService = GeminiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeminiService);
//# sourceMappingURL=gemini.service.js.map