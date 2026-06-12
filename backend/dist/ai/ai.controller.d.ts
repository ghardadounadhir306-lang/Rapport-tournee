import { RouteOptimizerService } from './route-optimizer.service';
import { AnomalyAnalyzerService } from './anomaly-analyzer.service';
import { ChatbotService } from './chatbot.service';
import { PredictionService } from './prediction.service';
import { GeminiService } from './gemini.service';
export declare class AiController {
    private readonly gemini;
    private readonly routeOptimizer;
    private readonly anomalyAnalyzer;
    private readonly chatbot;
    private readonly prediction;
    constructor(gemini: GeminiService, routeOptimizer: RouteOptimizerService, anomalyAnalyzer: AnomalyAnalyzerService, chatbot: ChatbotService, prediction: PredictionService);
    getStatus(): {
        geminiReady: boolean;
        features: string[];
    };
    optimizeRoute(body: {
        depotCode: string;
        clientCodes: string[];
    }): Promise<import("./route-optimizer.service").OptimizedRoute | {
        error: boolean;
        message: any;
    }>;
    analyzeAnomalies(body: {
        dateFrom?: string;
        dateTo?: string;
    }): Promise<import("./anomaly-analyzer.service").AnomalyAnalysisResult>;
    sendAnomalyReport(body: {
        dateFrom?: string;
        dateTo?: string;
        email?: string;
    }): Promise<{
        analysis: import("./anomaly-analyzer.service").AnomalyAnalysisResult;
        email: {
            sent: boolean;
            to: string;
        };
    }>;
    chat(body: {
        message: string;
        history?: Array<{
            role: 'user' | 'assistant';
            content: string;
        }>;
    }): Promise<import("./chatbot.service").ChatResponse>;
    getPredictions(tourneeIds?: string): Promise<import("./prediction.service").PredictionResult[]>;
    postPredictions(body: {
        tourneeIds?: string[];
    }): Promise<import("./prediction.service").PredictionResult[]>;
}
