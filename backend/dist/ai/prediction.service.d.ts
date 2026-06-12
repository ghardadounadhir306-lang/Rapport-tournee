import { DataSource } from 'typeorm';
import { GeminiService } from './gemini.service';
export interface PredictionResult {
    tourneeId: string;
    wms: string;
    driver: string;
    truck: string;
    date: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    predictedDelayMin: number;
    factors: Array<{
        factor: string;
        impact: 'positive' | 'negative';
        detail: string;
    }>;
    recommendations: string[];
}
export declare class PredictionService {
    private readonly gemini;
    private readonly dataSource;
    private readonly logger;
    constructor(gemini: GeminiService, dataSource: DataSource);
    predictDelays(tourneeIds?: string[]): Promise<PredictionResult[]>;
    private predictAllDriversBulk;
    private predictSingleWithAI;
    private fetchPendingTournees;
    private getHistoricalStats;
    private calculateStatisticalRisk;
    private scoreToLevel;
    private timeDiffMinutes;
}
