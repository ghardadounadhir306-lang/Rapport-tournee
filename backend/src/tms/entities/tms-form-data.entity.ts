import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'tms_form_data' })
export class TmsFormData {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tms_id!: string | null;

  @Column({ type: 'json', nullable: true })
  table_rows!: any | null;

  @Column({ type: 'json', nullable: true })
  input_data!: any | null;

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updated_at!: Date;
}
