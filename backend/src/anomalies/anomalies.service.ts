import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Anomaly } from './entities/anomaly.entity';

@Injectable()
export class AnomaliesService {
  constructor(
    @InjectRepository(Anomaly)
    private readonly anomalyRepo: Repository<Anomaly>,
  ) {}

  async list(filters: { tourneeId?: string; limit?: number; offset?: number }) {
    const take = Math.min(Math.max(Number(filters.limit) || 200, 1), 500);
    const skip = Math.max(Number(filters.offset) || 0, 0);

    const qb = this.anomalyRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.anomalyType', 't')
      .orderBy('a.created_at', 'DESC')
      .take(take)
      .skip(skip);

    if (filters.tourneeId?.trim()) {
      qb.andWhere('a.tournee_id = :tid', { tid: filters.tourneeId.trim() });
    }

    const [rows, total] = await qb.getManyAndCount();
    return {
      total,
      limit: take,
      offset: skip,
      anomalies: rows.map((a) => ({
        id: a.id,
        tournee_id: a.tourneeId,
        prestation_id: a.prestationId,
        camion_id: a.camionId,
        anomaly_type_id: a.anomalyTypeId,
        type_code: a.anomalyType?.code ?? null,
        type_label: a.anomalyType?.label ?? null,
        description: a.description,
        created_at: a.createdAt.toISOString(),
      })),
    };
  }
}
