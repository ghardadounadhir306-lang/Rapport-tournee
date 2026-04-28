"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.osrmDrivingKm = osrmDrivingKm;
async function osrmDrivingKm(lat1, lon1, lat2, lon2) {
    const raw = process.env.OSRM_ROUTE_BASE?.trim() || 'https://router.project-osrm.org/route/v1/driving';
    const base = raw.replace(/\/$/, '');
    const path = `${lon1},${lat1};${lon2},${lat2}`;
    const url = `${base}/${path}?overview=false&steps=false`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25_000);
    try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok)
            return null;
        const data = (await res.json());
        if (data?.code !== 'Ok' || !data.routes?.[0])
            return null;
        const m = data.routes[0].distance;
        if (typeof m !== 'number' || !Number.isFinite(m))
            return null;
        return Math.round((m / 1000) * 100) / 100;
    }
    catch {
        return null;
    }
    finally {
        clearTimeout(timer);
    }
}
//# sourceMappingURL=osrm-route.js.map