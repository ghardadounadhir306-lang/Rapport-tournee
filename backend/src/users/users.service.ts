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
import { ActivityLogService } from '../activity/activity-log.service';

export type CreateUserDto = {
  name: string;
  email: string;
  role: string;
  matricule?: string;
  allowedPages?: string[];
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly ALL_PAGES = [
    'TOURNEES',
    'DASHBOARD',
    'GPS',
    'CONFRONTATION',
    'SIMULATEUR',
    'PARAMETRAGE',
    'OPTIMISATION',
    'ADMIN',
    'SUPER_ADMIN_TRIPS',
  ] as const;

  constructor(
    @InjectRepository(AppUser)
    private readonly userRepo: Repository<AppUser>,
    private readonly mail: MailService,
    private readonly activity: ActivityLogService,
  ) {}

  private isMissingAppUsersTable(err: unknown): boolean {
    return (err as { code?: string })?.code === 'ER_NO_SUCH_TABLE';
  }

  private appUsersTableHint() {
    return 'Table app_users manquante. Executez: backend/sql/patches/004_app_users.sql';
  }

  private normalizeAllowedPages(pages: string[] | undefined, role: string): string[] {
    const input = Array.isArray(pages) ? pages : [];
    const clean = Array.from(
      new Set(
        input
          .map((p) => String(p ?? '').trim().toUpperCase())
          .filter((p) => this.ALL_PAGES.includes(p as (typeof this.ALL_PAGES)[number])),
      ),
    );
    const fallback = role === 'super_admin' ? [...this.ALL_PAGES] : ['TOURNEES', 'DASHBOARD'];
    const base = clean.length > 0 ? clean : fallback;

    if (role === 'super_admin') {
      return base;
    }

    return base.filter((p) => p !== 'ADMIN' && p !== 'SUPER_ADMIN_TRIPS');
  }

  private encodeAllowedPages(pages: string[]): string | null {
    return pages.length > 0 ? pages.join(',') : null;
  }

  private decodeAllowedPages(raw: string | null | undefined, role: string): string[] {
    const parsed = raw
      ? raw
          .split(',')
          .map((p) => p.trim().toUpperCase())
          .filter(Boolean)
      : [];
    return this.normalizeAllowedPages(parsed, role);
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
          matricule: u.matricule ?? null,
          allowedPages: this.decodeAllowedPages(u.allowedPages, u.role),
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

  async create(dto: CreateUserDto, ctx?: { ip?: string | null }) {
    const name      = dto.name?.trim();
    const email     = dto.email?.trim().toLowerCase();
    const role      = dto.role === 'admin' || dto.role === 'super_admin' ? dto.role : 'user';
    const matricule = dto.matricule?.trim() || null;
    const allowedPages = this.normalizeAllowedPages(dto.allowedPages, role);

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
      throw new ConflictException('Un utilisateur avec cet email existe deja');
    }

    if (!this.mail.isConfigured()) {
      throw new BadRequestException(
        'SMTP non configure. Definissez SMTP_HOST, SMTP_USER et SMTP_PASS dans .env.',
      );
    }

    const plainPassword = randomBytes(10).toString('base64url').slice(0, 14);
    const passwordHash  = await bcrypt.hash(plainPassword, 10);

    const user = this.userRepo.create({
      name,
      email,
      role,
      matricule,
      allowedPages: this.encodeAllowedPages(allowedPages),
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

    const emailLines = [
      `Bonjour ${name},`,
      '',
      `Votre compte R.Tournee a ete cree.`,
      `Role : ${role === 'super_admin' ? 'super admin' : role === 'admin' ? 'Administrateur' : 'Utilisateur'}`,
      ...(matricule ? [`Matricule : ${matricule}`] : []),
      `Pages autorisees        : ${allowedPages.join(', ')}`,
      '',
      `Email de connexion      : ${email}`,
      `Mot de passe temporaire : ${plainPassword}`,
      '',
      'Connectez-vous a l\'application avec ces identifiants.',
      'Changez votre mot de passe a la premiere connexion.',
    ];

    try {
      await this.mail.sendMail({
        to: email,
        subject: 'Vos acces R.Tournee',
        text: emailLines.join('\n'),
      });
    } catch (e) {
      await this.userRepo.delete({ id: user.id });
      this.logger.error('Failed to send welcome email; user rolled back', e);
      throw new BadRequestException(
        "L'email n'a pas pu etre envoye. Verifiez la configuration SMTP.",
      );
    }

    await this.activity.log({
      action: 'USER_CREATE',
      targetType: 'user',
      targetId: String(user.id),
      details: { email, role, allowedPages, matricule },
      ip: ctx?.ip ?? null,
    });

    return { message: 'Utilisateur cree et mot de passe envoye par email.' };
  }

  /**
   * Hardcoded super-admin fallback so the built-in account always works
   * even before any DB user is created.
   */
  private readonly BUILTIN: Record<string, { password: string; role: string }> = {
    'lumiere.logistique@gmail.com': { password: 'admin123', role: 'super_admin' },
  };

  async login(email: string, password: string, ctx?: { ip?: string | null }) {
    const lowerEmail = email?.trim().toLowerCase();

    if (!lowerEmail || !password) {
      await this.activity.log({
        action: 'USER_LOGIN_FAILED',
        actorEmail: lowerEmail || null,
        details: { reason: 'missing_credentials' },
        ip: ctx?.ip ?? null,
      });
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
        await this.activity.log({
          action: 'USER_LOGIN_FAILED',
          actorEmail: lowerEmail,
          details: { reason: 'bad_password' },
          ip: ctx?.ip ?? null,
        });
        throw new UnauthorizedException('Identifiant ou mot de passe incorrect.');
      }
      await this.activity.log({
        action: 'USER_LOGIN',
        actorEmail: dbUser.email,
        actorUserId: dbUser.id,
        ip: ctx?.ip ?? null,
      });
      return {
        role: dbUser.role,
        name: dbUser.name,
        email: dbUser.email,
        matricule: dbUser.matricule ?? null,
        allowedPages: this.decodeAllowedPages(dbUser.allowedPages, dbUser.role),
      };
    }

    // 2 — Fall back to built-in hardcoded account
    const builtin = this.BUILTIN[lowerEmail];
    if (builtin && builtin.password === password) {
      await this.activity.log({
        action: 'USER_LOGIN',
        actorEmail: lowerEmail,
        details: { builtin: true },
        ip: ctx?.ip ?? null,
      });
      return {
        role: builtin.role,
        name: 'super admin',
        email: lowerEmail,
        matricule: null,
        allowedPages: this.normalizeAllowedPages([...this.ALL_PAGES], 'super_admin'),
      };
    }

    await this.activity.log({
      action: 'USER_LOGIN_FAILED',
      actorEmail: lowerEmail,
      details: { reason: 'unknown_user' },
      ip: ctx?.ip ?? null,
    });
    throw new UnauthorizedException('Identifiant ou mot de passe incorrect.');
  }

  async remove(id: number, ctx?: { ip?: string | null }) {
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
    await this.activity.log({
      action: 'USER_DELETE',
      targetType: 'user',
      targetId: String(id),
      details: { email: u.email, name: u.name },
      ip: ctx?.ip ?? null,
    });
    return { message: 'Utilisateur supprime' };
  }
}
