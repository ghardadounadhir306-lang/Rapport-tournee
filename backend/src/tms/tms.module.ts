import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TmsController } from './tms.controller';
import { TmsService } from './tms.service';
import { TmsImportRow } from './entities/tms-import-row.entity';
import { TmsFormData } from './entities/tms-form-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TmsImportRow, TmsFormData])],
  controllers: [TmsController],
  providers: [TmsService]
})
export class TmsModule {}
