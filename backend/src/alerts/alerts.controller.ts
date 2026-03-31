import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';

@ApiTags('alerts')
@Controller(['alerts', 'api/alerts'])
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async list(
    @Query('tourneeId') tourneeId?: string,
    @Query('date') date?: string,
  ) {
    const alerts = await this.alertsService.getAlerts({
      tmsFormId: tourneeId,
      date,
    });
    return { count: alerts.length, alerts };
  }
}
