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
            created_at: string;
        }[];
    }>;
    login(body: {
        email?: string;
        password?: string;
    }): Promise<{
        role: string;
        name: string;
        email: string;
        matricule: string | null;
    }>;
    create(body: {
        name?: string;
        email?: string;
        role?: string;
        matricule?: string;
    }): Promise<{
        message: string;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
