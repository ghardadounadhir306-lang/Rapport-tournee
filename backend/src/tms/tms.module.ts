import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TmsController } from './tms.controller';
import { TmsService } from './tms.service';
import { TmsImportRow } from './entities/tms-import-row.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TmsImportRow])],
  controllers: [TmsController],
  providers: [TmsService]
})
export class TmsModule {}
