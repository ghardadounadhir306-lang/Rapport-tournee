import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'base_tarif' })
@Index('ix_base_tarif_type_code', ['typeCode'])
export class BaseTarif {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'type_code', type: 'varchar', length: 64 })
  typeCode!: string;

  @Column({ name: 'dist_min', type: 'double precision' })
  distMin!: number;

  @Column({ name: 'dist_max', type: 'double precision' })
  distMax!: number;

  @Column({ name: 'cap_min', type: 'double precision' })
  capMin!: number;

  @Column({ name: 'cap_max', type: 'double precision' })
  capMax!: number;

  @Column({ name: 'tarif_base', type: 'double precision', nullable: true })
  tarifBase!: number | null;

  @Column({ name: 'tarifs_par_date', type: 'jsonb', default: () => "'{}'" })
  tarifsParDate!: Record<string, number>;

  @Column({ name: 'cree_par', type: 'varchar', length: 255, nullable: true })
  creePar!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt!: Date;
}
