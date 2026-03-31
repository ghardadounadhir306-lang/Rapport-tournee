import { Repository } from 'typeorm';
import { AppUser } from './entities/app-user.entity';
import { MailService } from '../mail/mail.service';
export type CreateUserDto = {
    name: string;
    email: string;
    role: string;
    matricule?: string;
};
export declare class UsersService {
    private readonly userRepo;
    private readonly mail;
    private readonly logger;
    constructor(userRepo: Repository<AppUser>, mail: MailService);
    private isMissingAppUsersTable;
    private appUsersTableHint;
    findAll(): Promise<{
        users: {
            id: number;
            name: string;
            email: string;
            role: string;
            matricule: string | null;
            created_at: string;
        }[];
    }>;
    create(dto: CreateUserDto): Promise<{
        message: string;
    }>;
    private readonly BUILTIN;
    login(email: string, password: string): Promise<{
        role: string;
        name: string;
        email: string;
        matricule: string | null;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
