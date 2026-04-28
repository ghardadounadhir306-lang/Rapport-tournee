import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BaseCamionService, type UpsertBaseCamionBody } from './base-camion.service';

@Controller('api/base-camion')
export class BaseCamionController {
  constructor(private readonly baseCamionService: BaseCamionService) {}

  @Get()
  list() {
    return this.baseCamionService.findAll();
  }

  @Post()
  create(@Body() body: UpsertBaseCamionBody) {
    return this.baseCamionService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpsertBaseCamionBody) {
    return this.baseCamionService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.baseCamionService.remove(id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importExcel(@UploadedFile() file: { buffer: Buffer } | undefined) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier manquant (champ multipart : file)');
    }
    return this.baseCamionService.importExcel(file.buffer);
  }
}
