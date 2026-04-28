"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mail_service_1 = require("./mail.service");
let MailController = class MailController {
    mail;
    config;
    constructor(mail, config) {
        this.mail = mail;
        this.config = config;
    }
    async test(body) {
        if (this.config.get('MAIL_TEST_ENABLED') !== 'true') {
            throw new common_1.NotFoundException();
        }
        if (!this.mail.isConfigured()) {
            throw new common_1.ForbiddenException('SMTP not configured');
        }
        const to = body?.to?.trim();
        if (!to || !to.includes('@')) {
            throw new common_1.BadRequestException('Body must include a valid `to` email address');
        }
        await this.mail.sendMail({
            to,
            subject: 'R.Tournee SMTP test',
            text: 'If you receive this, Gmail SMTP is working.',
        });
        return { ok: true };
    }
};
exports.MailController = MailController;
__decorate([
    (0, common_1.Post)('test'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "test", null);
exports.MailController = MailController = __decorate([
    (0, common_1.Controller)(['mail', 'api/mail']),
    __metadata("design:paramtypes", [mail_service_1.MailService,
        config_1.ConfigService])
], MailController);
//# sourceMappingURL=mail.controller.js.map