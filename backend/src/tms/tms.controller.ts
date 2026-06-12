import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { TmsService } from './tms.service';

function clientIp(req: Request): string | null {
  const x = req.headers['x-forwarded-for'];
  if (typeof x === 'string' && x) return x.split(',')[0].trim();
  if (Array.isArray(x) && x[0]) return String(x[0]).split(',')[0].trim();
  return req.socket?.remoteAddress ?? null;
}

@Controller(['tms', 'api/tms'])
export class TmsController {
  constructor(private readonly tmsService: TmsService) {}

  @Get()
  getTmsData(
    @Query() query: Record<string, string>,
    @Headers('x-user-zone') userZone?: string,
  ) {
    return this.tmsService.getData(query ?? {}, userZone ?? null);
  }

  @Get('form-data/:id')
  getFormData(@Param('id') id: string) {
    return this.tmsService.getFormData(id);
  }

  @Get('transport-data')
  getTransportData(@Query('limit') limit?: string) {
    return this.tmsService.getTransportData(limit);
  }

  @Get('transport-data/by-tournee/:tourneeId')
  getTransportRowsByTournee(@Param('tourneeId') tourneeId: string) {
    return this.tmsService.getTransportRowsByTourneeId(tourneeId);
  }

  @Get('optimisation')
  getOptimisationData() {
    return this.tmsService.getOptimisationData();
  }

  @Post('form-data/:id')
  saveFormData(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    return this.tmsService.saveFormData(id, body, { ip: clientIp(req) });
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importTmsExcel(@UploadedFile() file: { buffer: Buffer } | undefined, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('Missing file (field name: file)');
    }
    return this.tmsService.importExcel(file.buffer, { ip: clientIp(req) });
  }
}
