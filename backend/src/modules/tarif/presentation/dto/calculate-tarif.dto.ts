import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class StoreDto {
    @ApiPropertyOptional() name?: string;
    @ApiPropertyOptional() palettes?: number;
    @ApiPropertyOptional() time?: string;
    @ApiPropertyOptional() duration?: string;
}

class MerchandiseDto {
    @ApiPropertyOptional() codeArticle?: string;
    @ApiPropertyOptional() nbPalettes?: number | string;
    @ApiPropertyOptional() vehicule?: string;
}

export class CalculateTarifDto {
    @ApiProperty() km?: number;
    @ApiPropertyOptional() palettes?: number;
    @ApiPropertyOptional() nbMagasins?: number;
    @ApiPropertyOptional() storeDurations?: string[];
    @ApiProperty() nature: string;
    @ApiPropertyOptional() tourneeType?: string;
    @ApiPropertyOptional() deliveryTime?: string;
    @ApiPropertyOptional({ type: [StoreDto] }) stores?: StoreDto[];
    @ApiPropertyOptional() vehicleType?: string;
    @ApiPropertyOptional() zone?: string;

    // --- Divers Extra Fields ---
    @ApiPropertyOptional() diversCategory?: string;
    @ApiPropertyOptional() diversSubCategory?: string;
    @ApiPropertyOptional() vehicule?: string;
    @ApiPropertyOptional() besoin?: number | string; // e.g., capacity, vehicle, or a multiplier coefficient
    @ApiPropertyOptional() isReturnTrip?: boolean;
    @ApiPropertyOptional() hasReturnedGoods?: boolean;
    @ApiPropertyOptional() tarifAnexe?: number;
    @ApiPropertyOptional() isSousseOctBar?: boolean; // For tarif oct trp10
    @ApiPropertyOptional() isSousseOctMhamdiya?: boolean; // For tarif oct trp10
    @ApiPropertyOptional() applyFiftyPercentRemise?: boolean; // General flag for specific check
    @ApiPropertyOptional() destination?: string;
    @ApiPropertyOptional() isSameDepartureAndReturn?: boolean;
    @ApiPropertyOptional() surgelaOption?: string; // Mghiraa vs autres clients
    @ApiPropertyOptional({ type: [MerchandiseDto] }) merchandises?: MerchandiseDto[];

    // --- trp15 (Transfert Inter Dépôt Spot) ---
    @ApiPropertyOptional() nbCargo?: number; // 1 cargo, 2 cargo => appliquer tarif semi
}
