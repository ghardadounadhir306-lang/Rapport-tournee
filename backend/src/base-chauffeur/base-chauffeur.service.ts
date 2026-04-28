import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseChauffeur } from './entities/base-chauffeur.entity';

export type BaseChauffeurDto = {
  id: string;
  nom: string;
  prenom: string;
  cin: string;
  email: string;
  tel: string;
};

@Injectable()
export class BaseChauffeurService {
  constructor(
    @InjectRepository(BaseChauffeur)
    private readonly repo: Repository<BaseChauffeur>,
  ) {}

  private toDto(row: BaseChauffeur): BaseChauffeurDto {
    return {
      id: String(row.id),
      nom: row.nom,
      prenom: row.prenom,
      cin: row.cin,
      email: row.email,
      tel: row.tel ?? '',
    };
  }

  async findAll(): Promise<{ count: number; items: BaseChauffeurDto[] }> {
    const rows = await this.repo.find({ order: { nom: 'ASC', prenom: 'ASC' } });
    return { count: rows.length, items: rows.map((r) => this.toDto(r)) };
  }
}