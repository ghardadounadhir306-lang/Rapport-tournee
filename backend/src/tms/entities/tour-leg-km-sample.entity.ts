import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

/**
 * Historique des km (aller-retour calculés) par couple (site / client) et par fiche tournée.
 * Une ligne par (sitcode, client_code, tms_form_id) : nouvelle tournée → nouvelle ligne, moyenne = AVG(distance_km).
 */
@Entity({ name: 'tour_leg_km_samples' })
@Unique('uq_tour_leg_km_sample_trip', ['sitcode', 'clientCode', 'tmsFormId'])
@Index('ix_tour_leg_km_pair', ['sitcode', 'clientCode'])
export class TourLegKmSample {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  sitcode!: string;

  @Column({ name: 'client_code', type: 'varchar', length: 64 })
  clientCode!: string;

  @Column({ name: 'tms_form_id', type: 'varchar', length: 255 })
  tmsFormId!: string;

  @Column({ name: 'distance_km', type: 'double precision' })
  distanceKm!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt!: Date;
}
