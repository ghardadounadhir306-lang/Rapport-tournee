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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TmsModule,
    MailModule,
    UsersModule,
    GpsModule,
    AlertsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
