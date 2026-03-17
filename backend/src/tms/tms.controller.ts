import { Controller, Get } from '@nestjs/common';
import { TmsService } from './tms.service';

@Controller('tms')
export class TmsController {
  constructor(private readonly tmsService: TmsService) {}

  @Get()
  getTmsData() {
    return this.tmsService.getData();
  }
}
