import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'tms_form_data' })
export class TmsFormData {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tms_id!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  date!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  wms!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  prestation!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  truck!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  driver!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dep!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  km_facture!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  marchandise!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  conformite!: string | null;

  @Column({ type: 'text', nullable: true })
  observation!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  h_depart!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  km_depart!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  h_retour!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  km_retour!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  km_dernier_client!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  km_moy!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  total_palettes!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  total_palettes_2!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tournee_sec!: string | null;

  @Column({ type: 'boolean', default: false })
  apres_midi!: boolean;

  @Column({ type: 'boolean', default: false })
  inter_site!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gps_start_lat!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gps_start_lng!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gps_end_lat!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gps_end_lng!: string | null;

  @Column({ type: 'json', nullable: true })
  table_rows!: any | null;

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3 })
  updated_at!: Date;
}
