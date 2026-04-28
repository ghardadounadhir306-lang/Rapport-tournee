import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Référentiel points clients / dépôts pour optimisation de tournée (ex. import Excel clients_poi).
 * Un enregistrement = un code client avec coordonnées ; is_depot distingue entrepôt vs livraison.
 */
@Entity({ name: 'client_pois' })
@Index('ix_client_pois_depot', ['isDepot'])
export class ClientPoi {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  /** Code client normalisé (majuscules), unique. */
  @Column({ name: 'client_code', type: 'varchar', length: 64, unique: true })
  clientCode!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  name!: string | null;

  @Column({ type: 'float' })
  latitude!: number;

  @Column({ type: 'float' })
  longitude!: number;

  @Column({ type: 'boolean', default: false })
  isDepot!: boolean;

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
