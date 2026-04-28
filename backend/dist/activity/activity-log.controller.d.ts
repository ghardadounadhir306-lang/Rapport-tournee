import { ActivityLogService } from './activity-log.service';
export declare class ActivityLogController {
    private readonly activityLog;
    constructor(activityLog: ActivityLogService);
    list(limit?: string, offset?: string): Promise<{
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
