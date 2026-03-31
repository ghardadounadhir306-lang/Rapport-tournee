import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TmsService } from './tms.service';

@Controller(['tms', 'api/tms'])
export class TmsController {
  constructor(private readonly tmsService: TmsService) {}

  @Get()
  getTmsData(@Query() query: Record<string, string>) {
    return this.tmsService.getData(query ?? {});
  }

  @Get('form-data/:id')
  getFormData(@Param('id') id: string) {
    return this.tmsService.getFormData(id);
  }

  @Get('transport-data')
  getTransportData(@Query('limit') limit?: string) {
    return this.tmsService.getTransportData(limit);
  }

  @Post('form-data/:id')
  saveFormData(@Param('id') id: string, @Body() body: any) {
    return this.tmsService.saveFormData(id, body);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importTmsExcel(@UploadedFile() file?: { buffer: Buffer }) {
    if (!file) {
      throw new BadRequestException('Missing file (field name: file)');
    }
    return this.tmsService.importExcel(file.buffer);
  }
}
