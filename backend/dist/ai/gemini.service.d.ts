import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class GeminiService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private model;
    private lastCallTime;
    constructor(config: ConfigService);
    onModuleInit(): void;
    isReady(): boolean;
    generate(prompt: string, systemInstruction?: string): Promise<string>;
    generateJSON<T = any>(prompt: string, systemInstruction?: string): Promise<T>;
}
