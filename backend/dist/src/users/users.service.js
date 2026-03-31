"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const bcrypt = __importStar(require("bcryptjs"));
const typeorm_2 = require("typeorm");
const app_user_entity_1 = require("./entities/app-user.entity");
const mail_service_1 = require("../mail/mail.service");
let UsersService = UsersService_1 = class UsersService {
    userRepo;
    mail;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(userRepo, mail) {
        this.userRepo = userRepo;
        this.mail = mail;
    }
    isMissingAppUsersTable(err) {
        return err?.code === 'ER_NO_SUCH_TABLE';
    }
    appUsersTableHint() {
        return ('Table app_users manquante. Exécutez: mysql -u root -p r_tournee < backend/sql/patches/004_app_users.sql');
    }
    async findAll() {
        try {
            const rows = await this.userRepo.find({ order: { id: 'ASC' } });
            return {
                users: rows.map((u) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    created_at: u.createdAt.toISOString(),
                })),
            };
        }
        catch (e) {
            if (this.isMissingAppUsersTable(e)) {
                throw new common_1.ServiceUnavailableException(this.appUsersTableHint());
            }
            throw e;
        }
    }
    async create(dto) {
        const name = dto.name?.trim();
        const email = dto.email?.trim().toLowerCase();
        const role = dto.role === 'admin' ? 'admin' : 'user';
        if (!name || !email) {
            throw new common_1.BadRequestException('Nom et email sont obligatoires');
        }
        if (!email.includes('@')) {
            throw new common_1.BadRequestException('Email invalide');
        }
        let existing;
        try {
            existing = await this.userRepo.findOne({ where: { email } });
        }
        catch (e) {
            if (this.isMissingAppUsersTable(e)) {
                throw new common_1.ServiceUnavailableException(this.appUsersTableHint());
            }
            throw e;
        }
        if (existing) {
            throw new common_1.ConflictException('Un utilisateur avec cet email existe déjà');
        }
        if (!this.mail.isConfigured()) {
            throw new common_1.BadRequestException('SMTP non configuré. Définissez SMTP_HOST, SMTP_USER et SMTP_PASS dans .env pour créer des utilisateurs et envoyer les mots de passe.');
        }
        const plainPassword = (0, crypto_1.randomBytes)(10).toString('base64url').slice(0, 14);
        const passwordHash = await bcrypt.hash(plainPassword, 10);
        const user = this.userRepo.create({
            name,
            email,
            role,
            passwordHash,
        });
        try {
            await this.userRepo.save(user);
        }
        catch (e) {
            if (this.isMissingAppUsersTable(e)) {
                throw new common_1.ServiceUnavailableException(this.appUsersTableHint());
            }
            throw e;
        }
        try {
            await this.mail.sendMail({
                to: email,
                subject: 'Vos accès R.Tournee',
                text: [
                    `Bonjour ${name},`,
                    '',
                    `Votre compte a été créé avec le rôle : ${role === 'admin' ? 'Administrateur' : 'Utilisateur'}.`,
                    `Mot de passe temporaire : ${plainPassword}`,
                    '',
                    'Connectez-vous à l’application et changez ce mot de passe si nécessaire.',
                ].join('\n'),
            });
        }
        catch (e) {
            await this.userRepo.delete({ id: user.id });
            this.logger.error('Failed to send welcome email; user rolled back', e);
            throw new common_1.BadRequestException("L'email n'a pas pu être envoyé. Vérifiez la configuration SMTP.");
        }
        return {
            message: 'Utilisateur créé et mot de passe envoyé par email.',
        };
    }
    async remove(id) {
        let u;
        try {
            u = await this.userRepo.findOne({ where: { id } });
        }
        catch (e) {
            if (this.isMissingAppUsersTable(e)) {
                throw new common_1.ServiceUnavailableException(this.appUsersTableHint());
            }
            throw e;
        }
        if (!u) {
            throw new common_1.NotFoundException('Utilisateur introuvable');
        }
        try {
            await this.userRepo.delete({ id });
        }
        catch (e) {
            if (this.isMissingAppUsersTable(e)) {
                throw new common_1.ServiceUnavailableException(this.appUsersTableHint());
            }
            throw e;
        }
        return { message: 'Utilisateur supprimé' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(app_user_entity_1.AppUser)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        mail_service_1.MailService])
], UsersService);
//# sourceMappingURL=users.service.js.map