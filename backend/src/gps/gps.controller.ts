import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GpsService } from './gps.service';
import type { CreateGpsPointDto } from './dto/create-gps-point.dto';

@ApiTags('gps')
@Controller(['gps', 'api/gps'])
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Post('points')
  async postPoint(@Body() body: CreateGpsPointDto & { tmsFormId?: string }) {
    const tmsFormId = body.tmsFormId ?? (body as any).tms_form_id;
    return this.gpsService.savePoint({ ...body, tmsFormId: String(tmsFormId ?? '') });
  }

  @Post('points/batch')
  async postBatch(@Body() body: { tmsFormId?: string; points?: CreateGpsPointDto[] }) {
    const tmsFormId = body.tmsFormId ?? (body as any).tms_form_id;
    return this.gpsService.saveBatch(String(tmsFormId ?? ''), body.points ?? []);
  }

  @Get('tournee/:id')
  async getByTms(@Param('id') id: string) {
    const points = await this.gpsService.getPointsByTmsFormId(id);
    return {
      tmsFormId: decodeURIComponent(id),
      points: points.map((p) => ({
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        altitude_m: p.altitude_m,
        speed_mps: p.speed_mps,
        accuracy_m: p.accuracy_m,
        recorded_at: p.recorded_at,
      })),
    };
  }

  @Get('tournee/:id/has-route')
  async hasRoute(@Param('id') id: string) {
    const ok = await this.gpsService.hasRealRoute(decodeURIComponent(id));
    return { tmsFormId: decodeURIComponent(id), hasRealRoute: ok };
  }
}
