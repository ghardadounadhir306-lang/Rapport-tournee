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
            role: "admin" | "responsable" | "user";
            matricule: string | null;
            zone: string | null;
            allowedPages: string[];
            created_at: string;
        }[];
    }>;
    login(body: {
        email?: string;
        password?: string;
    }, req: Request): Promise<{
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
    create(body: {
        name?: string;
        email?: string;
        role?: string;
        matricule?: string;
        allowedPages?: string[];
        zone?: string | null;
    }, req: Request): Promise<{
        message: string;
        userId: number;
    } | {
        message: string;
        userId?: undefined;
    }>;
}
