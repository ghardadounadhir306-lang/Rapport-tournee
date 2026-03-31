import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GpsPoint } from './entities/gps-point.entity';
import type { CreateGpsPointDto } from './dto/create-gps-point.dto';

const MIN_POINTS_REAL_ROUTE = Number(process.env.GPS_MIN_POINTS_REAL_ROUTE ?? '3');

@Injectable()
export class GpsService {
  constructor(
    @InjectRepository(GpsPoint)
    private readonly gpsRepo: Repository<GpsPoint>,
  ) {}

  async savePoint(dto: CreateGpsPointDto & { tmsFormId: string }) {
    const lat = Number(dto.latitude);
    const lng = Number(dto.longitude);
    if (!dto.tmsFormId?.trim()) throw new BadRequestException('tmsFormId requis');
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new BadRequestException('latitude/longitude invalides');

    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();
    if (Number.isNaN(recordedAt.getTime())) throw new BadRequestException('recordedAt invalide');

    const row = this.gpsRepo.create({
      tournee_id: null,
      tms_form_id: dto.tmsFormId.trim(),
      latitude: lat.toFixed(7),
      longitude: lng.toFixed(7),
      altitude_m: dto.altitudeM ?? null,
      speed_mps: dto.speedMps ?? null,
      accuracy_m: dto.accuracyM ?? null,
      recorded_at: recordedAt,
    });
    return this.gpsRepo.save(row);
  }

  async saveBatch(tmsFormId: string, points: CreateGpsPointDto[]) {
    if (!tmsFormId?.trim()) throw new BadRequestException('tmsFormId requis');
    if (!Array.isArray(points) || points.length === 0) throw new BadRequestException('points requis');
    const out: GpsPoint[] = [];
    for (const p of points) {
      const saved = await this.savePoint({ ...p, tmsFormId });
      out.push(saved);
    }
    return { inserted: out.length };
  }

  async getPointsByTmsFormId(tmsFormId: string) {
    const id = decodeURIComponent(tmsFormId);
    return this.gpsRepo.find({
      where: { tms_form_id: id },
      order: { recorded_at: 'ASC' },
    });
  }

  async hasRealRoute(tmsFormId: string): Promise<boolean> {
    const id = tmsFormId.trim();
    if (!id) return false;
    const n = await this.gpsRepo.count({ where: { tms_form_id: id } });
    return n >= MIN_POINTS_REAL_ROUTE;
  }
}
