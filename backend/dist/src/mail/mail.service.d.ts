import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export type SendMailOptions = {
    to: string;
    subject: string;
    text?: string;
    html?: string;
};
export declare class MailService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private transporter;
    constructor(config: ConfigService);
    onModuleInit(): void;
    isConfigured(): boolean;
    sendMail(options: SendMailOptions): Promise<void>;
}
