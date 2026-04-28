import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TransportData } from '../../transport-data/entities/transport-data.entity';

/**
 * Référentiel camions (table PostgreSQL `base_camion`).
 */
@Entity({ name: 'base_camion' })
@Index('ix_base_camion_site', ['site'])
@Index('ix_base_camion_type', ['typeCamion'])
export class BaseCamion {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  /** Immatriculation / identifiant camion, unique. */
  @Column({ type: 'varchar', length: 128, unique: true })
  camion!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  marque!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  site!: string | null;

  @Column({ name: 'type', type: 'varchar', length: 128, nullable: true })
  typeCamion!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  affectation!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  capacite!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  utile!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt!: Date;

  @OneToMany(() => TransportData, (transport) => transport.camion)
  transportData?: TransportData[];
}
