import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller(['dashboard', 'api/dashboard'])
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@Query('periode') periode?: string) {
    return this.dashboardService.getStats(periode ?? '30');
  }
}
