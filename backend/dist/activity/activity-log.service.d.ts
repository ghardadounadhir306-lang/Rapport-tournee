import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
export type LogActivityInput = {
    action: string;
    actorEmail?: string | null;
    actorUserId?: number | null;
    targetType?: string | null;
    targetId?: string | null;
    details?: Record<string, unknown> | null;
    ip?: string | null;
};
export declare class ActivityLogService {
    private readonly repo;
    private readonly logger;
    constructor(repo: Repository<ActivityLog>);
    log(input: LogActivityInput): Promise<void>;
    findRecent(limit?: number, offset?: number): Promise<{
        total: number;
        limit: number;
        offset: number;
        logs: {
            id: number;
            created_at: string;
            action: string;
            actor_email: string | null;
            actor_user_id: number | null;
            target_type: string | null;
            target_id: string | null;
            details: Record<string, unknown> | null;
            ip: string | null;
        }[];
    }>;
}
