# Project Zenith 🌌

**Real-time celestial awareness platform** — select any location on Earth and instantly visualize what's happening in the sky above: planets, satellites, the ISS, and more.

## ✨ Features

- **Interactive 3D Globe** — Three.js globe with day/night terminator, atmospheric glow, and real-time satellite tracking
- **Satellite Propagation** — SGP4 orbital mechanics via `satellite.js` for ISS and 10 tracked satellites with orbit paths
- **Live Satellite Count** — Fetches real-time TLE data from the CelesTrak API proxy
- **D3 Star Chart** — 2D sky map with constellation lines and visible planet positions
- **Satellite Pass Timeline** — D3 visualization of upcoming visible passes (next 6 hours)
- **Location Search** — Leaflet dark map with debounced autocomplete via Nominatim
- **Celestial Data** — Sunrise/sunset times, moon phase, visible planets, and upcoming astronomical events
- **Layer Controls** — Toggle planets, ISS, satellites, and constellations on/off

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| 3D Visualization | Three.js + React Three Fiber |
| 2D Map | Leaflet.js with CARTO dark tiles |
| Charts | D3.js |
| Orbital Mechanics | satellite.js (SGP4/SDP4) |
| State Management | Zustand |
| APIs | NASA JPL Horizons, CelesTrak, OpenNotify, Sunrise-Sunset.org, Nominatim |
| Deployment | Vercel-ready |

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Screen 1 — Landing map with search
│   ├── confirm/page.tsx   # Screen 2 — Location confirmation
│   ├── dashboard/page.tsx # Screen 3 — Celestial dashboard
│   └── api/               # API proxy routes
│       ├── horizons/      # NASA JPL Horizons (cached)
│       ├── celestrak/     # CelesTrak TLE data (cached)
│       ├── opennotify/    # ISS position & passes
│       └── sunrise/       # Sunrise/Sunset times
├── components/
│   ├── LocationMap.tsx    # Leaflet map with search autocomplete
│   ├── Globe3D.tsx        # Three.js 3D globe with shaders
│   ├── SkyInfo.tsx        # Info sidebar panel
│   ├── StarChart.tsx      # D3 sky map with constellations
│   └── SatelliteTimeline.tsx # D3 satellite pass chart
├── store/
│   └── useStore.ts        # Zustand global state
└── lib/
    └── satellite-utils.ts # TLE propagation helpers
```

## 📡 Data Sources

- **NASA JPL Horizons** — Planet ephemerides (proxied + cached)
- **CelesTrak** — TLE orbital data for thousands of satellites (proxied + cached)
- **OpenNotify** — Real-time ISS position and pass predictions
- **Sunrise-Sunset.org** — Day/night and twilight times
- **Nominatim (OSM)** — Geocoding and reverse geocoding

## 📄 License

MIT
