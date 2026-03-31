import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'gps_points' })
@Index('ix_gps_tms_form_time', ['tms_form_id', 'recorded_at'])
export class GpsPoint {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'bigint', nullable: true })
  tournee_id!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tms_form_id!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: string;

  @Column({ type: 'float', nullable: true })
  altitude_m!: number | null;

  @Column({ type: 'float', nullable: true })
  speed_mps!: number | null;

  @Column({ type: 'float', nullable: true })
  accuracy_m!: number | null;

  @Column({ type: 'timestamp', precision: 3 })
  recorded_at!: Date;
}
