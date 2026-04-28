import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseTarifController } from './base-tarif.controller';
import { BaseTarifService } from './base-tarif.service';
import { BaseTarifAugmentation } from './entities/base-tarif-augmentation.entity';
import { BaseTarifEffectiveDate } from './entities/base-tarif-effective-date.entity';
import { BaseTarif } from './entities/base-tarif.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BaseTarif, BaseTarifEffectiveDate, BaseTarifAugmentation])],
  controllers: [BaseTarifController],
  providers: [BaseTarifService],
  exports: [BaseTarifService],
})
export class BaseTarifModule {}
