"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const gemini_service_1 = require("./gemini.service");
const route_optimizer_service_1 = require("./route-optimizer.service");
const anomaly_analyzer_service_1 = require("./anomaly-analyzer.service");
const chatbot_service_1 = require("./chatbot.service");
const prediction_service_1 = require("./prediction.service");
const ai_controller_1 = require("./ai.controller");
const depot_entity_1 = require("../clients-poi/entities/depot.entity");
const client_point_entity_1 = require("../clients-poi/entities/client-point.entity");
const mail_module_1 = require("../mail/mail.module");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([depot_entity_1.Depot, client_point_entity_1.ClientPoint]),
            mail_module_1.MailModule,
        ],
        controllers: [ai_controller_1.AiController],
        providers: [
            gemini_service_1.GeminiService,
            route_optimizer_service_1.RouteOptimizerService,
            anomaly_analyzer_service_1.AnomalyAnalyzerService,
            chatbot_service_1.ChatbotService,
            prediction_service_1.PredictionService,
        ],
        exports: [gemini_service_1.GeminiService],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map