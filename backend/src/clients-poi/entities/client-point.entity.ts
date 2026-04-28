import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Points de livraison clients / magasins GPS (anciennement client_pois WHERE is_depot = false).
 * Table DB : poi_clients — ≠ la table métier "clients" (liée à commandes / factures).
 * Stocke uniquement les coordonnées GPS pour l'optimisation de tournée.
 */
@Entity({ name: 'poi_clients' })
@Index('ix_poi_clients_code', ['code'])
export class ClientPoint {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  /** Code client normalisé (majuscules), unique. */
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
