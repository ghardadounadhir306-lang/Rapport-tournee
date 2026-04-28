import { Repository } from 'typeorm';
import { TransportData } from './entities/transport-data.entity';
import { TransportDepot } from './entities/transport-depot.entity';
import { TransportPoiClient } from './entities/transport-poi-client.entity';
export declare class TransportDataService {
    private readonly transportRepo;
    private readonly depotLinkRepo;
    private readonly clientLinkRepo;
    constructor(transportRepo: Repository<TransportData>, depotLinkRepo: Repository<TransportDepot>, clientLinkRepo: Repository<TransportPoiClient>);
    create(data: Partial<TransportData>): Promise<TransportData>;
    findAll(): Promise<TransportData[]>;
    findOne(id: number): Promise<TransportData>;
    update(id: number, data: Partial<TransportData>): Promise<TransportData>;
    remove(id: number): Promise<void>;
    addDepotLink(transportId: number, depotId: string): Promise<TransportDepot>;
    addClientLink(transportId: number, clientId: string): Promise<TransportPoiClient>;
    getDepots(transportId: number): Promise<TransportDepot[]>;
    getClientPoints(transportId: number): Promise<TransportPoiClient[]>;
}
