import * as satellite from "satellite.js";

export interface SatPos {
  name: string;
  lat: number;
  lng: number;
  alt: number;
}

const TLE_CACHE = new Map<string, satellite.SatRec>();

export function getSatRec(name: string, line1: string, line2: string) {
  const key = `${line1}\n${line2}`;
  if (!TLE_CACHE.has(key)) {
    TLE_CACHE.set(key, satellite.twoline2satrec(line1, line2));
  }
  return TLE_CACHE.get(key)!;
}

export function propagateToGeo(satrec: satellite.SatRec, date: Date): SatPos | null {
  try {
    const pv = satellite.propagate(satrec, date);
    if (!pv.position) return null;
    const gmst = satellite.gstime(date);
    const geo = satellite.eciToGeodetic(pv.position, gmst);
    if (!geo) return null;
    const lat = satellite.degreesLat(geo.latitude);
    const lng = satellite.degreesLong(geo.longitude);
    const alt = geo.height;
    return { name: "", lat, lng, alt };
  } catch {
    return null;
  }
}

export function propagateOrbitPath(
  satrec: satellite.SatRec,
  startDate: Date,
  steps: number = 120,
  stepMinutes: number = 1
): { lat: number; lng: number }[] {
  const path: { lat: number; lng: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const d = new Date(startDate.getTime() + i * stepMinutes * 60000);
    const pos = propagateToGeo(satrec, d);
    if (pos) path.push({ lat: pos.lat, lng: pos.lng });
  }
  return path;
}

export const ISS_TLE = {
  name: "ISS (ZARYA)",
  line1: "1 25544U 98067A   24170.50000000  .00016717  00000+0  10270-3 0  9001",
  line2: "2 25544  51.6426 222.5503 0004526 182.5936 177.4898 15.50145791442032",
};

export const SATELLITE_TLES = [
  {
    name: "NOAA 19",
    line1: "1 33591U 09005A   24171.15710574  .00000119  00000+0  82540-4 0  9999",
    line2: "2 33591  99.1908 245.9426 0013654 157.2675 202.9071 14.12633938920921",
  },
  {
    name: "NOAA 18",
    line1: "1 28654U 05018A   24171.15125800  .00000148  00000+0  93368-4 0  9995",
    line2: "2 28654  99.0506 253.8567 0014495 119.5699 240.6434 14.12745654144916",
  },
  {
    name: "STARLINK-1007",
    line1: "1 44713U 19074A   24171.15416749  .00000607  00000+0  26574-4 0  9994",
    line2: "2 44713  53.0544 199.0654 0001336  84.7864 275.3753 15.06405154295412",
  },
  {
    name: "STARLINK-1130",
    line1: "1 44914U 20001AK  24171.15625000  .00000582  00000+0  30753-4 0  9992",
    line2: "2 44914  53.0547  43.6250 0001277  67.8220 292.3389 15.06450172308982",
  },
  {
    name: "Hubble",
    line1: "1 20580U 90037B   24171.12696042  .00001863  00000+0  15098-3 0  9991",
    line2: "2 20580  28.4697  14.5401 0002840 292.0538  68.0027 15.09007064852269",
  },
  {
    name: "Terra",
    line1: "1 25994U 99068A   24171.14543089  .00000561  00000+0  32594-3 0  9990",
    line2: "2 25994  98.2105 233.4878 0001130  90.4791 269.6547 14.57129064293650",
  },
  {
    name: "Aqua",
    line1: "1 27424U 02022A   24171.13756944  .00000564  00000+0  31682-3 0  9990",
    line2: "2 27424  98.2089 234.1049 0001155  85.5929 274.5396 14.57131714275331",
  },
  {
    name: "Landsat 8",
    line1: "1 39084U 13008A   24171.12791667  .00000237  00000+0  17772-3 0  9997",
    line2: "2 39084  98.2226 246.7033 0001085  89.7143 270.4306 14.57119018264947",
  },
  {
    name: "Iridium 101",
    line1: "1 24793U 97016A   24171.15017361  .00000049  00000+0  10000-4 0  9997",
    line2: "2 24793  86.3989 226.0189 0002298  88.9506 271.2060 14.34214835819089",
  },
  {
    name: "Iridium 102",
    line1: "1 24903U 97030A   24171.15347222  .00000053  00000+0  10000-4 0  9998",
    line2: "2 24903  86.3995 228.5014 0002260  93.2729 266.8854 14.34214835814476",
  },
];
