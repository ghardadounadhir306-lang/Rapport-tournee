import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
type TestMailBody = {
    to?: string;
};
export declare class MailController {
    private readonly mail;
    private readonly config;
    constructor(mail: MailService, config: ConfigService);
    test(body: TestMailBody): Promise<{
        ok: boolean;
    }>;
}
export {};
