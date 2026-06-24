import { create } from "zustand";

export interface CelestialData {
  planets: PlanetData[];
  iss: ISSData | null;
  satellites: SatelliteData[];
  sunData: SunData | null;
}

export interface PlanetData {
  name: string;
  altitude: number;
  azimuth: number;
  aboveHorizon: boolean;
  magnitude?: number;
}

export interface ISSData {
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: number;
}

export interface SatelliteData {
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface SunData {
  sunrise: string;
  sunset: string;
  solarNoon: string;
  dayLength: number;
}

interface AppState {
  location: { lat: number; lng: number } | null;
  locationName: string;
  dateTime: Date;
  celestialData: CelestialData;
  activeLayers: {
    planets: boolean;
    iss: boolean;
    satellites: boolean;
    constellations: boolean;
  };
  setLocation: (loc: { lat: number; lng: number }, name?: string) => void;
  setDateTime: (dt: Date) => void;
  setCelestialData: (data: Partial<CelestialData>) => void;
  toggleLayer: (layer: keyof AppState["activeLayers"]) => void;
}

export const useStore = create<AppState>((set) => ({
  location: null,
  locationName: "",
  dateTime: new Date(),
  celestialData: {
    planets: [],
    iss: null,
    satellites: [],
    sunData: null,
  },
  activeLayers: {
    planets: true,
    iss: true,
    satellites: true,
    constellations: false,
  },
  setLocation: (loc, name) =>
    set({ location: loc, locationName: name || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` }),
  setDateTime: (dt) => set({ dateTime: dt }),
  setCelestialData: (data) =>
    set((state) => ({
      celestialData: { ...state.celestialData, ...data },
    })),
  toggleLayer: (layer) =>
    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [layer]: !state.activeLayers[layer],
      },
    })),
}));
