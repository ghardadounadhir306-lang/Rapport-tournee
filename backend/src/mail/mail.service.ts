import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type SendMailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const passRaw = this.config.get<string>('SMTP_PASS');
    const pass = passRaw?.replace(/\s+/g, '') ?? '';

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Mail sending disabled.');
      return;
    }

    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    const secureEnv = this.config.get<string>('SMTP_SECURE', 'false');
    const secure = secureEnv === 'true' || port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      ...(port === 587 && !secure ? { requireTLS: true } : {}),
    });

    this.logger.log(`SMTP transporter ready (${host}:${port})`);
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP is not configured');
    }
    const from = this.config.get<string>('MAIL_FROM') || this.config.get<string>('SMTP_USER');
    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (err) {
      this.logger.error('Failed to send mail', err);
      throw err;
    }
  }
}
