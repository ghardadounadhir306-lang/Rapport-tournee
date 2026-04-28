import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Anomaly } from './anomaly.entity';

@Entity({ name: 'anomaly_types', synchronize: false })
export class AnomalyType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  label!: string;

  @OneToMany(() => Anomaly, (a) => a.anomalyType)
  anomalies!: Anomaly[];
}
