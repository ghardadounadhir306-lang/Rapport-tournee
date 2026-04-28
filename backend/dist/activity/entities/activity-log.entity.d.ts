export declare class ActivityLog {
    id: number;
    createdAt: Date;
    action: string;
    actorEmail: string | null;
    actorUserId: number | null;
    targetType: string | null;
    targetId: string | null;
    details: Record<string, unknown> | null;
    ip: string | null;
}
