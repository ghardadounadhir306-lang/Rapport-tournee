import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TransportData } from './transport-data.entity';
import { Depot } from '../../clients-poi/entities/depot.entity';

@Entity({ name: 'transport_depots' })
export class TransportDepot {
  @PrimaryColumn({ type: 'integer' })
  transport_id: number;

  @PrimaryColumn({ type: 'bigint' })
  depot_id: string;

  @ManyToOne(() => TransportData, (transport) => transport.id, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'transport_id' })
  transport: TransportData;

  @ManyToOne(() => Depot, (depot) => depot.id, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'depot_id' })
  depot: Depot;
}
