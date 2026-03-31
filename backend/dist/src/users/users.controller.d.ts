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
            created_at: string;
        }[];
    }>;
    create(body: {
        name?: string;
        email?: string;
        role?: string;
    }): Promise<{
        message: string;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
