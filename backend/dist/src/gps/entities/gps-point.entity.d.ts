export declare class GpsPoint {
    id: string;
    tournee_id: string | null;
    tms_form_id: string | null;
    latitude: string;
    longitude: string;
    altitude_m: number | null;
    speed_mps: number | null;
    accuracy_m: number | null;
    recorded_at: Date;
}
