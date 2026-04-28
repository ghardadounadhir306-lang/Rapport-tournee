import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BaseTarifService, type UpsertBaseTarifBody } from './base-tarif.service';

@Controller('api/base-tarif')
export class BaseTarifController {
  constructor(private readonly baseTarifService: BaseTarifService) {}

  @Get()
  list() {
    return this.baseTarifService.findAll();
  }

  /** Colonnes date (fusion : dates enregistrées + clés présentes sur les lignes). */
  @Get('effective-dates')
  effectiveDates() {
    return this.baseTarifService.getEffectiveDatesList().then((dates) => ({ dates }));
  }

  /** Enregistre une date d’effet (AAAA-MM-JJ) pour afficher une nouvelle colonne de taux. */
  @Post('effective-dates')
  addEffectiveDate(@Body() body: { date?: string }) {
    const d = body?.date;
    if (d === undefined || d === null || String(d).trim() === '') {
      throw new BadRequestException('Body : { "date": "AAAA-MM-JJ" }');
    }
    return this.baseTarifService.addEffectiveDate(String(d));
  }

  /** GET /api/base-tarif/lookup?typeCode=Sec&distance=30&capacity=5 */
  @Get('lookup')
  async lookup(
    @Query('typeCode') typeCode?: string,
    @Query('distance') distRaw?: string,
    @Query('capacity') capRaw?: string,
  ) {
    if (!typeCode || !distRaw || !capRaw) {
      throw new BadRequestException('Paramètres requis : typeCode, distance, capacity');
    }
    const dist = Number(distRaw);
    const cap = Number(capRaw);
    if (!Number.isFinite(dist) || !Number.isFinite(cap)) {
      throw new BadRequestException('distance et capacity doivent être des nombres');
    }
    const match = await this.baseTarifService.findMatchingTarif(typeCode, dist, cap);
    return { match };
  }

  @Post()
  create(@Body() body: UpsertBaseTarifBody) {
    return this.baseTarifService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpsertBaseTarifBody) {
    return this.baseTarifService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.baseTarifService.remove(id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importExcel(@UploadedFile() file: { buffer: Buffer } | undefined) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier manquant (champ multipart : file)');
    }
    return this.baseTarifService.importExcel(file.buffer);
  }

  // ─── Augmentations / Reductions ─────────────────────────────────────

  @Get('augmentations')
  listAugmentations() {
    return this.baseTarifService.listAugmentations();
  }

  @Post('augmentations')
  createAugmentation(
    @Body() body: { percent?: number; dateEffet?: string; appliedBy?: string; description?: string },
  ) {
    if (body?.percent === undefined || !body?.dateEffet) {
      throw new BadRequestException('Body : { "percent": number, "dateEffet": "AAAA-MM-JJ" }');
    }
    return this.baseTarifService.createAugmentation({
      percent: body.percent,
      dateEffet: body.dateEffet,
      appliedBy: body.appliedBy,
      description: body.description,
    });
  }

  @Delete('augmentations/:id')
  deleteAugmentation(@Param('id') id: string) {
    return this.baseTarifService.deleteAugmentation(Number(id));
  }

  @Get('augmentation-factor')
  async augmentationFactor(@Query('date') dateIso?: string) {
    const factor = await this.baseTarifService.getAugmentationFactor(dateIso || undefined);
    return { factor, percent: Math.round((factor - 1) * 10000) / 100 };
  }
}
