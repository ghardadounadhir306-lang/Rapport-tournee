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
export declare class UsersService {
    private readonly userRepo;
    private readonly mail;
    private readonly activity;
    private readonly logger;
    private readonly ALL_PAGES;
    constructor(userRepo: Repository<AppUser>, mail: MailService, activity: ActivityLogService);
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
            role: string;
            matricule: string | null;
            allowedPages: string[];
            created_at: string;
        }[];
    }>;
    create(dto: CreateUserDto, ctx?: {
        ip?: string | null;
    }): Promise<{
        message: string;
    }>;
    private readonly BUILTIN;
    login(email: string, password: string, ctx?: {
        ip?: string | null;
    }): Promise<{
        role: string;
        name: string;
        email: string;
        matricule: string | null;
        allowedPages: string[];
    }>;
    remove(id: number, ctx?: {
        ip?: string | null;
    }): Promise<{
        message: string;
    }>;
}
