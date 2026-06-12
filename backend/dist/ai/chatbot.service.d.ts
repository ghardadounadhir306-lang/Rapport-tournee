import { DataSource } from 'typeorm';
import { GeminiService } from './gemini.service';
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
export interface ChatResponse {
    reply: string;
    data?: any[];
    chartType?: 'table' | 'bar' | 'pie' | null;
    language: string;
}
export declare class ChatbotService {
    private readonly gemini;
    private readonly dataSource;
    private readonly logger;
    constructor(gemini: GeminiService, dataSource: DataSource);
    chat(message: string, history?: ChatMessage[]): Promise<ChatResponse>;
    private askGemini;
    private getFallbackReply;
    private detectLanguage;
    private normalizeText;
    private isDriverAnomalyQuestion;
    private isConformiteCountQuestion;
    private getConformiteFilter;
    private tryLocalAnswer;
    private answerConformiteCount;
}
export {};
