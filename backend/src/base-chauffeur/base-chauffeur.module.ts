import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseChauffeurController } from './base-chauffeur.controller';
import { BaseChauffeurService } from './base-chauffeur.service';
import { BaseChauffeur } from './entities/base-chauffeur.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BaseChauffeur])],
  controllers: [BaseChauffeurController],
  providers: [BaseChauffeurService],
  exports: [BaseChauffeurService],
})
export class BaseChauffeurModule {}