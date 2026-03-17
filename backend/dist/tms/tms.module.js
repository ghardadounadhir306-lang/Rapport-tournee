"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TmsModule = void 0;
const common_1 = require("@nestjs/common");
const tms_controller_1 = require("./tms.controller");
const tms_service_1 = require("./tms.service");
let TmsModule = class TmsModule {
};
exports.TmsModule = TmsModule;
exports.TmsModule = TmsModule = __decorate([
    (0, common_1.Module)({
        controllers: [tms_controller_1.TmsController],
        providers: [tms_service_1.TmsService]
    })
], TmsModule);
//# sourceMappingURL=tms.module.js.map