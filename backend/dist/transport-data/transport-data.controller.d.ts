import { TransportDataService } from './transport-data.service';
import { TransportData } from './entities/transport-data.entity';
export declare class TransportDataController {
    private readonly service;
    constructor(service: TransportDataService);
    create(data: Partial<TransportData>): Promise<TransportData>;
    findAll(): Promise<TransportData[]>;
    findOne(id: number): Promise<TransportData>;
    update(id: number, data: Partial<TransportData>): Promise<TransportData>;
    remove(id: number): Promise<void>;
}
