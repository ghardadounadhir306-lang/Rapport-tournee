import { TransportData } from './transport-data.entity';
import { ClientPoint } from '../../clients-poi/entities/client-point.entity';
export declare class TransportPoiClient {
    transport_id: number;
    poi_client_id: string;
    transport: TransportData;
    clientPoint: ClientPoint;
}
