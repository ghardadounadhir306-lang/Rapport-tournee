import { TransportData } from '../../transport-data/entities/transport-data.entity';
export declare class BaseCamion {
    id: string;
    camion: string;
    marque: string | null;
    site: string | null;
    typeCamion: string | null;
    affectation: string | null;
    capacite: string | null;
    utile: string | null;
    createdAt: Date;
    updatedAt: Date;
    transportData?: TransportData[];
}
