import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'base_tarif_augmentation' })
export class BaseTarifAugmentation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'double precision' })
  percent!: number;

  @Column({ name: 'date_effet', type: 'date' })
  dateEffet!: string;

  @Column({ name: 'applied_by', type: 'varchar', length: 255, nullable: true })
  appliedBy!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt!: Date;
}
