import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AppUser } from './entities/app-user.entity';
import { MailService } from '../mail/mail.service';

export type CreateUserDto = {
  name: string;
  email: string;
  role: string;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(AppUser)
    private readonly userRepo: Repository<AppUser>,
    private readonly mail: MailService,
  ) {}

  private isMissingAppUsersTable(err: unknown): boolean {
    return (err as { code?: string })?.code === 'ER_NO_SUCH_TABLE';
  }

  private appUsersTableHint() {
    return (
      'Table app_users manquante. Exécutez: mysql -u root -p r_tournee < backend/sql/patches/004_app_users.sql'
    );
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
    } catch (e) {
      if (this.isMissingAppUsersTable(e)) {
        throw new ServiceUnavailableException(this.appUsersTableHint());
      }
      throw e;
    }
  }

  async create(dto: CreateUserDto) {
    const name = dto.name?.trim();
    const email = dto.email?.trim().toLowerCase();
    const role = dto.role === 'admin' ? 'admin' : 'user';

    if (!name || !email) {
      throw new BadRequestException('Nom et email sont obligatoires');
    }
    if (!email.includes('@')) {
      throw new BadRequestException('Email invalide');
    }

    let existing: AppUser | null;
    try {
      existing = await this.userRepo.findOne({ where: { email } });
    } catch (e) {
      if (this.isMissingAppUsersTable(e)) {
        throw new ServiceUnavailableException(this.appUsersTableHint());
      }
      throw e;
    }
    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    if (!this.mail.isConfigured()) {
      throw new BadRequestException(
        'SMTP non configuré. Définissez SMTP_HOST, SMTP_USER et SMTP_PASS dans .env pour créer des utilisateurs et envoyer les mots de passe.',
      );
    }

    const plainPassword = randomBytes(10).toString('base64url').slice(0, 14);
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const user = this.userRepo.create({
      name,
      email,
      role,
      passwordHash,
    });
    try {
      await this.userRepo.save(user);
    } catch (e) {
      if (this.isMissingAppUsersTable(e)) {
        throw new ServiceUnavailableException(this.appUsersTableHint());
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
    } catch (e) {
      await this.userRepo.delete({ id: user.id });
      this.logger.error('Failed to send welcome email; user rolled back', e);
      throw new BadRequestException("L'email n'a pas pu être envoyé. Vérifiez la configuration SMTP.");
    }

    return {
      message: 'Utilisateur créé et mot de passe envoyé par email.',
    };
  }

  /**
   * Hardcoded super-admin fallback so the built-in account always works
   * even before any DB user is created.
   */
  private readonly BUILTIN: Record<string, { password: string; role: string }> = {
    'lumiere.logistique@gmail.com': { password: 'admin123', role: 'admin' },
  };

  async login(email: string, password: string) {
    const lowerEmail = email?.trim().toLowerCase();

    if (!lowerEmail || !password) {
      throw new UnauthorizedException('Identifiant ou mot de passe incorrect.');
    }

    // 1 — Try the database first
    let dbUser: AppUser | null = null;
    try {
      dbUser = await this.userRepo.findOne({ where: { email: lowerEmail } });
    } catch {
      // Table may not exist yet — fall through to built-in check
    }

    if (dbUser) {
      const valid = await bcrypt.compare(password, dbUser.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Identifiant ou mot de passe incorrect.');
      }
      return { role: dbUser.role, name: dbUser.name, email: dbUser.email };
    }

    // 2 — Fall back to built-in hardcoded account
    const builtin = this.BUILTIN[lowerEmail];
    if (builtin && builtin.password === password) {
      return { role: builtin.role, name: 'Admin', email: lowerEmail };
    }

    throw new UnauthorizedException('Identifiant ou mot de passe incorrect.');
  }

  async remove(id: number) {
    let u: AppUser | null;
    try {
      u = await this.userRepo.findOne({ where: { id } });
    } catch (e) {
      if (this.isMissingAppUsersTable(e)) {
        throw new ServiceUnavailableException(this.appUsersTableHint());
      }
      throw e;
    }
    if (!u) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    try {
      await this.userRepo.delete({ id });
    } catch (e) {
      if (this.isMissingAppUsersTable(e)) {
        throw new ServiceUnavailableException(this.appUsersTableHint());
      }
      throw e;
    }
    return { message: 'Utilisateur supprimé' };
  }
}
