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
exports.AppUser = void 0;
const typeorm_1 = require("typeorm");
let AppUser = class AppUser {
    id;
    name;
    email;
    role;
    matricule;
    allowedPages;
    passwordHash;
    createdAt;
};
exports.AppUser = AppUser;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'int' }),
    __metadata("design:type", Number)
], AppUser.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AppUser.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], AppUser.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: 'user' }),
    __metadata("design:type", String)
], AppUser.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, default: null }),
    __metadata("design:type", Object)
], AppUser.prototype, "matricule", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'allowed_pages', type: 'text', nullable: true, default: null }),
    __metadata("design:type", Object)
], AppUser.prototype, "allowedPages", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_hash', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AppUser.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], AppUser.prototype, "createdAt", void 0);
exports.AppUser = AppUser = __decorate([
    (0, typeorm_1.Entity)({ name: 'app_users' })
], AppUser);
//# sourceMappingURL=app-user.entity.js.map