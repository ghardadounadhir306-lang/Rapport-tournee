export type CreateGpsPointDto = {
    tmsFormId: string;
    latitude: number;
    longitude: number;
    altitudeM?: number | null;
    speedMps?: number | null;
    accuracyM?: number | null;
    recordedAt?: string | null;
};
export type BatchGpsPointsDto = {
    tmsFormId: string;
    points: CreateGpsPointDto[];
};
