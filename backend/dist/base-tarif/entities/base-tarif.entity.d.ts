export declare class BaseTarif {
    id: string;
    typeCode: string;
    distMin: number;
    distMax: number;
    capMin: number;
    capMax: number;
    tarifBase: number | null;
    tarifsParDate: Record<string, number>;
    creePar: string | null;
    createdAt: Date;
    updatedAt: Date;
}
