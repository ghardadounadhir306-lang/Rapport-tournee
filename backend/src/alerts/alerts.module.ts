import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Anomaly } from '../anomalies/entities/anomaly.entity';
import { TmsFormData } from '../tms/entities/tms-form-data.entity';
import { GpsModule } from '../gps/gps.module';
import { MailModule } from '../mail/mail.module';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';

@Module({
  imports: [TypeOrmModule.forFeature([TmsFormData, Anomaly]), GpsModule, MailModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
