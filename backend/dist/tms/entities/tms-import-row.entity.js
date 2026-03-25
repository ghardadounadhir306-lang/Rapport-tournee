"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TmsImportRow = void 0;
const typeorm_1 = require("typeorm");
let TmsImportRow = class TmsImportRow {
    id;
    affcode;
    artcode;
    cdate;
    entnbpal;
    otdcode;
    otscontainer;
    otsetat;
    otskm2;
    otsnumbdx;
    ottmt;
    placha1i;
    plakm1;
    plakm2;
    plalib;
    plamoti;
    plargiarr;
    rgilibl;
    salnom;
    saltel;
    sitcode;
    sitsiretedi;
    tiecode;
    toucode;
    voycle;
    voydtd;
    voyhrd;
    voypal;
    performance_camion;
    performance_chauffeur;
    taux_remplissage_pal;
    taux_remplissage_ton;
    mdate;
    sitechauff;
    sitecamion;
    salmemoe;
    otsnum;
    platouordre;
    salmobilite;
    km_tsp;
    toutrafcode;
    chargement;
    voydtf;
    otdhd;
    voymemo;
    raw_json;
    created_at;
};
exports.TmsImportRow = TmsImportRow;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], TmsImportRow.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "affcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "artcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "cdate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "entnbpal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "otdcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "otscontainer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "otsetat", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "otskm2", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "otsnumbdx", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "ottmt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "placha1i", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "plakm1", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "plakm2", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "plalib", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "plamoti", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "plargiarr", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "rgilibl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "salnom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "saltel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "sitcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "sitsiretedi", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "tiecode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "toucode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "voycle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', precision: 3, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "voydtd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "voyhrd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "voypal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "performance_camion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "performance_chauffeur", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 6, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "taux_remplissage_pal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 6, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "taux_remplissage_ton", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', precision: 3, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "mdate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "sitechauff", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "sitecamion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "salmemoe", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "otsnum", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "platouordre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "salmobilite", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "km_tsp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "toutrafcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "chargement", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', precision: 3, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "voydtf", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', precision: 3, nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "otdhd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "voymemo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'longtext', nullable: true }),
    __metadata("design:type", Object)
], TmsImportRow.prototype, "raw_json", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' }),
    __metadata("design:type", Date)
], TmsImportRow.prototype, "created_at", void 0);
exports.TmsImportRow = TmsImportRow = __decorate([
    (0, typeorm_1.Entity)({ name: 'tms_import_rows' }),
    (0, typeorm_1.Index)(['otsnum']),
    (0, typeorm_1.Index)(['toucode']),
    (0, typeorm_1.Index)(['cdate'])
], TmsImportRow);
//# sourceMappingURL=tms-import-row.entity.js.map