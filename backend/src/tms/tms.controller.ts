import { BadRequestException, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TmsService } from './tms.service';

@Controller(['tms', 'api/tms'])
export class TmsController {
  constructor(private readonly tmsService: TmsService) {}

  @Get()
  getTmsData() {
    return this.tmsService.getData();
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
