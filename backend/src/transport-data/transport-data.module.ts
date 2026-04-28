import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportData } from './entities/transport-data.entity';
import { TransportDepot } from './entities/transport-depot.entity';
import { TransportPoiClient } from './entities/transport-poi-client.entity';
import { TransportDataService } from './transport-data.service';
import { TransportDataController } from './transport-data.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransportData,
      TransportDepot,
      TransportPoiClient,
    ]),
  ],
  providers: [TransportDataService],
  controllers: [TransportDataController],
  exports: [TransportDataService],
})
export class TransportDataModule {}
