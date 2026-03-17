import { Module } from '@nestjs/common';
import { TmsController } from './tms.controller';
import { TmsService } from './tms.service';

@Module({
  controllers: [TmsController],
  providers: [TmsService]
})
export class TmsModule {}
