import { BadRequestException, Body, Controller, Get, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TmsService } from './tms.service';
import { TmsImportRow } from './entities/tms-import-row.entity';

@Controller(['tms', 'api/tms'])
export class TmsController {
  constructor(private readonly tmsService: TmsService) {}

  @Get()
  getTmsData() {
    return this.tmsService.getData();
  }

  @Get('form/:id')
  async getFormData(@Param('id') id: string) {
    const data = await this.tmsService.getFormData(id);
    return data || {};
  }

  @Post()
  async createTmsData(@Body() body: any) {
    if (body && body.tmsId) {
      await this.tmsService.saveFormData(body.tmsId, body.tableRows, body.inputData);
    }
    return { success: true };
  }

  @Put(':id')
  async updateTmsData(@Param('id') id: string, @Body() body: any) {
    if (body && (body.tmsId || id)) {
      await this.tmsService.saveFormData(body.tmsId || id, body.tableRows, body.inputData);
    }
    return { success: true };
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
