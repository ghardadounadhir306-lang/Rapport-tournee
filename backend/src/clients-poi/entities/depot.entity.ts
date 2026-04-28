import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Dépôts / entrepôts de départ (anciennement client_pois WHERE is_depot = true).
 * Un enregistrement = un site de distribution identifié par son code (ex. MGH, TUN…).
 */
@Entity({ name: 'depots' })
@Index('ix_depots_code', ['code'])
export class Depot {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  /** Code dépôt normalisé (majuscules), unique. */
  @Column({ name: 'code', type: 'varchar', length: 64, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  name!: string | null;

  @Column({ type: 'float' })
  latitude!: number;

  @Column({ type: 'float' })
  longitude!: number;

  @Column({ name: 'source', type: 'varchar', length: 255, nullable: true })
  source!: string | null;

  @Column({ name: 'groupe', type: 'varchar', length: 255, nullable: true })
  groupe!: string | null;

  @Column({ name: 'cree_par', type: 'varchar', length: 255, nullable: true })
  creePar!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt!: Date;
}
