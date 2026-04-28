import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransportData } from './entities/transport-data.entity';
import { TransportDepot } from './entities/transport-depot.entity';
import { TransportPoiClient } from './entities/transport-poi-client.entity';

@Injectable()
export class TransportDataService {
  constructor(
    @InjectRepository(TransportData)
    private readonly transportRepo: Repository<TransportData>,
    @InjectRepository(TransportDepot)
    private readonly depotLinkRepo: Repository<TransportDepot>,
    @InjectRepository(TransportPoiClient)
    private readonly clientLinkRepo: Repository<TransportPoiClient>,
  ) {}

  // ---------- TransportData CRUD ----------
  async create(data: Partial<TransportData>): Promise<TransportData> {
    const transport = this.transportRepo.create({
      ...data,
      // New trips created from forms must always start as pending.
      states: 'pending',
    });
    return this.transportRepo.save(transport);
  }

  async findAll(): Promise<TransportData[]> {
    return this.transportRepo.find();
  }

  async findOne(id: number): Promise<TransportData> {
    return this.transportRepo.findOneOrFail({ where: { id } });
  }

  async update(id: number, data: Partial<TransportData>): Promise<TransportData> {
    await this.transportRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.transportRepo.delete(id);
  }

  // ---------- Junction helpers ----------
  async addDepotLink(transportId: number, depotId: string): Promise<TransportDepot> {
    const link = this.depotLinkRepo.create({ transport_id: transportId, depot_id: depotId });
    return this.depotLinkRepo.save(link);
  }

  async addClientLink(transportId: number, clientId: string): Promise<TransportPoiClient> {
    const link = this.clientLinkRepo.create({ transport_id: transportId, poi_client_id: clientId });
    return this.clientLinkRepo.save(link);
  }

  async getDepots(transportId: number): Promise<TransportDepot[]> {
    return this.depotLinkRepo.find({ where: { transport_id: transportId } });
  }

  async getClientPoints(transportId: number): Promise<TransportPoiClient[]> {
    return this.clientLinkRepo.find({ where: { transport_id: transportId } });
  }
}
