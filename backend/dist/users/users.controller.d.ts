import type { Request } from 'express';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    list(): Promise<{
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
    login(body: {
        email?: string;
        password?: string;
    }, req: Request): Promise<{
        role: string;
        name: string;
        email: string;
        matricule: string | null;
        allowedPages: string[];
    }>;
    create(body: {
        name?: string;
        email?: string;
        role?: string;
        matricule?: string;
        allowedPages?: string[];
    }, req: Request): Promise<{
        message: string;
    }>;
    remove(id: number, req: Request): Promise<{
        message: string;
    }>;
}
