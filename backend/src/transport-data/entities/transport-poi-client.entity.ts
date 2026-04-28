import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TransportData } from './transport-data.entity';
import { ClientPoint } from '../../clients-poi/entities/client-point.entity';

@Entity({ name: 'transport_poi_clients' })
export class TransportPoiClient {
  @PrimaryColumn({ type: 'integer' })
  transport_id: number;

  @PrimaryColumn({ type: 'bigint' })
  poi_client_id: string;

  @ManyToOne(() => TransportData, (transport) => transport.id, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'transport_id' })
  transport: TransportData;

  @ManyToOne(() => ClientPoint, (client) => client.id, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'poi_client_id' })
  clientPoint: ClientPoint;
}
