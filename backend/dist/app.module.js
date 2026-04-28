"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_module_1 = require("./database/database.module");
const tms_module_1 = require("./tms/tms.module");
const health_controller_1 = require("./health/health.controller");
const mail_module_1 = require("./mail/mail.module");
const users_module_1 = require("./users/users.module");
const gps_module_1 = require("./gps/gps.module");
const alerts_module_1 = require("./alerts/alerts.module");
const activity_log_module_1 = require("./activity/activity-log.module");
const anomalies_module_1 = require("./anomalies/anomalies.module");
const clients_poi_module_1 = require("./clients-poi/clients-poi.module");
const transport_data_module_1 = require("./transport-data/transport-data.module");
const base_camion_module_1 = require("./base-camion/base-camion.module");
const base_tarif_module_1 = require("./base-tarif/base-tarif.module");
const base_chauffeur_module_1 = require("./base-chauffeur/base-chauffeur.module");
const tarif_module_1 = require("./modules/tarif/tarif.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            database_module_1.DatabaseModule,
            activity_log_module_1.ActivityLogModule,
            anomalies_module_1.AnomaliesModule,
            clients_poi_module_1.ClientsPoiModule,
            base_camion_module_1.BaseCamionModule,
            base_chauffeur_module_1.BaseChauffeurModule,
            base_tarif_module_1.BaseTarifModule,
            tarif_module_1.TarifModule,
            tms_module_1.TmsModule,
            mail_module_1.MailModule,
            users_module_1.UsersModule,
            gps_module_1.GpsModule,
            alerts_module_1.AlertsModule,
            transport_data_module_1.TransportDataModule,
        ],
        controllers: [app_controller_1.AppController, health_controller_1.HealthController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map