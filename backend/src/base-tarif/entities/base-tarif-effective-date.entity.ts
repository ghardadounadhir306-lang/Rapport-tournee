import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'base_tarif_effective_date' })
export class BaseTarifEffectiveDate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'date_iso', type: 'varchar', length: 10, unique: true })
  dateIso!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt!: Date;
}
