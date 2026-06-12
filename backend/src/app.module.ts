import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TmsModule } from './tms/tms.module';
import { HealthController } from './health/health.controller';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { GpsModule } from './gps/gps.module';
import { AlertsModule } from './alerts/alerts.module';
import { ActivityLogModule } from './activity/activity-log.module';
import { AnomaliesModule } from './anomalies/anomalies.module';
import { ClientsPoiModule } from './clients-poi/clients-poi.module';
import { TransportDataModule } from './transport-data/transport-data.module';
import { BaseCamionModule } from './base-camion/base-camion.module';
import { BaseTarifModule } from './base-tarif/base-tarif.module';
import { BaseChauffeurModule } from './base-chauffeur/base-chauffeur.module';
import { TarifModule } from './modules/tarif/tarif.module';
import { AiModule } from './ai/ai.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ActivityLogModule,
    AnomaliesModule,
    ClientsPoiModule,
    BaseCamionModule,
    BaseChauffeurModule,
    BaseTarifModule,
    TarifModule,
    TmsModule,
    MailModule,
    UsersModule,
    GpsModule,
    AlertsModule,
    TransportDataModule,
    AiModule,
    DashboardModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
