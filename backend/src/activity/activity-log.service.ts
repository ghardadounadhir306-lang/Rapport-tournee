import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private readonly repo: Repository<ActivityLog>,
  ) {}

  async log(input: LogActivityInput): Promise<void> {
    try {
      const row = this.repo.create({
        action: input.action.slice(0, 64),
        actorEmail: input.actorEmail ? String(input.actorEmail).slice(0, 255) : null,
        actorUserId: input.actorUserId ?? null,
        targetType: input.targetType ? String(input.targetType).slice(0, 64) : null,
        targetId: input.targetId != null ? String(input.targetId).slice(0, 255) : null,
        details: input.details ?? null,
        ip: input.ip ? String(input.ip).slice(0, 64) : null,
      });
      await this.repo.save(row);
    } catch (e) {
      this.logger.warn(`activity_logs insert failed: ${String((e as Error)?.message ?? e)}`);
    }
  }

  async findRecent(limit = 200, offset = 0) {
    const take = Math.min(Math.max(Number(limit) || 200, 1), 500);
    const skip = Math.max(Number(offset) || 0, 0);
    const [rows, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    return {
      total,
      limit: take,
      offset: skip,
      logs: rows.map((r) => ({
        id: r.id,
        created_at: r.createdAt.toISOString(),
        action: r.action,
        actor_email: r.actorEmail,
        actor_user_id: r.actorUserId,
        target_type: r.targetType,
        target_id: r.targetId,
        details: r.details,
        ip: r.ip,
      })),
    };
  }
}
