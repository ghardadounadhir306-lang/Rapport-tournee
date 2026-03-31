import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

type TestMailBody = {
  to?: string;
};

@Controller(['mail', 'api/mail'])
export class MailController {
  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  @Post('test')
  async test(@Body() body: TestMailBody) {
    if (this.config.get<string>('MAIL_TEST_ENABLED') !== 'true') {
      throw new NotFoundException();
    }
    if (!this.mail.isConfigured()) {
      throw new ForbiddenException('SMTP not configured');
    }
    const to = body?.to?.trim();
    if (!to || !to.includes('@')) {
      throw new BadRequestException('Body must include a valid `to` email address');
    }
    await this.mail.sendMail({
      to,
      subject: 'R.Tournee SMTP test',
      text: 'If you receive this, Gmail SMTP is working.',
    });
    return { ok: true };
  }
}
