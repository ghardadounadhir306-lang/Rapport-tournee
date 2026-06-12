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
    zone?: string | null;
};
export declare class UsersService {
    private readonly userRepo;
    private readonly mail;
    private readonly activity;
    private readonly logger;
    private readonly ALL_PAGES;
    constructor(userRepo: Repository<AppUser>, mail: MailService, activity: ActivityLogService);
    private normalizeRole;
    private isMissingAppUsersTable;
    private appUsersTableHint;
    private normalizeAllowedPages;
    private encodeAllowedPages;
    private decodeAllowedPages;
    findAll(): Promise<{
        users: {
            id: number;
            name: string;
            email: string;
            role: "admin" | "responsable" | "user";
            matricule: string | null;
            zone: string | null;
            allowedPages: string[];
            created_at: string;
        }[];
    }>;
    create(dto: CreateUserDto, ctx?: {
        ip?: string | null;
    }): Promise<{
        message: string;
        userId: number;
    } | {
        message: string;
        userId?: undefined;
    }>;
    private readonly BUILTIN;
    login(email: string, password: string, ctx?: {
        ip?: string | null;
    }): Promise<{
        role: "admin" | "responsable" | "user";
        name: string;
        email: string;
        matricule: string | null;
        zone: string | null;
        allowedPages: string[];
    } | {
        role: "admin" | "responsable" | "user";
        name: string;
        email: string;
        matricule: null;
        allowedPages: string[];
        zone?: undefined;
    }>;
    remove(id: number, ctx?: {
        ip?: string | null;
    }): Promise<{
        message: string;
    }>;
}
