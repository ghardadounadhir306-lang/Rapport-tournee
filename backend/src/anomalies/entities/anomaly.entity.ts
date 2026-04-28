import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { AnomalyType } from './anomaly-type.entity';

@Entity({ name: 'anomalies', synchronize: false })
export class Anomaly {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'tournee_id', type: 'varchar', length: 255 })
  tourneeId!: string;

  @Column({ name: 'prestation_id', type: 'varchar', length: 255, nullable: true })
  prestationId!: string | null;

  @Column({ name: 'camion_id', type: 'varchar', length: 255, nullable: true })
  camionId!: string | null;

  @ManyToOne(() => AnomalyType, (t) => t.anomalies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'anomaly_type_id' })
  anomalyType!: AnomalyType;

  @RelationId((a: Anomaly) => a.anomalyType)
  anomalyTypeId!: number;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
