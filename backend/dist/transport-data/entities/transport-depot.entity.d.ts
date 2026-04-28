import { TransportData } from './transport-data.entity';
import { Depot } from '../../clients-poi/entities/depot.entity';
export declare class TransportDepot {
    transport_id: number;
    depot_id: string;
    transport: TransportData;
    depot: Depot;
}
