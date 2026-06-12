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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const route_optimizer_service_1 = require("./route-optimizer.service");
const anomaly_analyzer_service_1 = require("./anomaly-analyzer.service");
const chatbot_service_1 = require("./chatbot.service");
const prediction_service_1 = require("./prediction.service");
const gemini_service_1 = require("./gemini.service");
let AiController = class AiController {
    gemini;
    routeOptimizer;
    anomalyAnalyzer;
    chatbot;
    prediction;
    constructor(gemini, routeOptimizer, anomalyAnalyzer, chatbot, prediction) {
        this.gemini = gemini;
        this.routeOptimizer = routeOptimizer;
        this.anomalyAnalyzer = anomalyAnalyzer;
        this.chatbot = chatbot;
        this.prediction = prediction;
    }
    getStatus() {
        return {
            geminiReady: this.gemini.isReady(),
            features: ['route-optimizer', 'anomaly-analyzer', 'chatbot', 'predictions'],
        };
    }
    async optimizeRoute(body) {
        try {
            return await this.routeOptimizer.optimize(body.depotCode, body.clientCodes);
        }
        catch (err) {
            return { error: true, message: err.message || 'Erreur d\'optimisation' };
        }
    }
    async analyzeAnomalies(body) {
        return this.anomalyAnalyzer.analyzeNonConformites(body.dateFrom, body.dateTo);
    }
    async sendAnomalyReport(body) {
        const analysis = await this.anomalyAnalyzer.analyzeNonConformites(body.dateFrom, body.dateTo);
        const emailResult = await this.anomalyAnalyzer.sendReport(analysis, body.email);
        return { analysis, email: emailResult };
    }
    async chat(body) {
        return this.chatbot.chat(body.message, body.history || []);
    }
    async getPredictions(tourneeIds) {
        const ids = tourneeIds ? tourneeIds.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
        return this.prediction.predictDelays(ids);
    }
    async postPredictions(body) {
        return this.prediction.predictDelays(body.tourneeIds);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('optimize-route'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "optimizeRoute", null);
__decorate([
    (0, common_1.Post)('analyze-anomalies'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "analyzeAnomalies", null);
__decorate([
    (0, common_1.Post)('send-anomaly-report'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "sendAnomalyReport", null);
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "chat", null);
__decorate([
    (0, common_1.Get)('predictions'),
    __param(0, (0, common_1.Query)('tourneeIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getPredictions", null);
__decorate([
    (0, common_1.Post)('predictions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "postPredictions", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('ai'),
    (0, common_1.Controller)(['ai', 'api/ai']),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService,
        route_optimizer_service_1.RouteOptimizerService,
        anomaly_analyzer_service_1.AnomalyAnalyzerService,
        chatbot_service_1.ChatbotService,
        prediction_service_1.PredictionService])
], AiController);
//# sourceMappingURL=ai.controller.js.map