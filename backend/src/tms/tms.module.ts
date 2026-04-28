import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnomaliesModule } from '../anomalies/anomalies.module';
import { ClientsPoiModule } from '../clients-poi/clients-poi.module';
import { TmsController } from './tms.controller';
import { TmsService } from './tms.service';
import { TmsImportRow } from './entities/tms-import-row.entity';
import { TmsFormData } from './entities/tms-form-data.entity';
import { TourLegKmSample } from './entities/tour-leg-km-sample.entity';
import { TourLegKmHistoryService } from './tour-leg-km-history.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TmsImportRow, TmsFormData, TourLegKmSample]),
    AnomaliesModule,
    ClientsPoiModule,
  ],
  controllers: [TmsController],
  providers: [TmsService, TourLegKmHistoryService],
})
export class TmsModule {}
