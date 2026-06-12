import { DataSource } from 'typeorm';
import { GeminiService } from './gemini.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
export interface AnomalyAnalysisResult {
    summary: string;
    totalNonConforme: number;
    period: string;
    rootCauses: Array<{
        category: string;
        count: number;
        description: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
    }>;
    recommendations: Array<{
        priority: number;
        action: string;
        expectedImpact: string;
    }>;
    patterns: Array<{
        pattern: string;
        affectedTournees: number;
        details: string;
    }>;
}
export declare class AnomalyAnalyzerService {
    private readonly gemini;
    private readonly mail;
    private readonly config;
    private readonly dataSource;
    private readonly logger;
    constructor(gemini: GeminiService, mail: MailService, config: ConfigService, dataSource: DataSource);
    analyzeNonConformites(dateFrom?: string, dateTo?: string): Promise<AnomalyAnalysisResult>;
    sendReport(analysis: AnomalyAnalysisResult, recipientEmail?: string): Promise<{
        sent: boolean;
        to: string;
    }>;
    private fetchAnomalyData;
    private fetchNonConformeFormData;
    private buildAnalysisPrompt;
    private buildEmailHtml;
}
