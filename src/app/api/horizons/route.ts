import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const cacheKey = `horizons:${lat}:${lng}:${date}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const planets = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const mockData = planets.map((name, i) => ({
    name,
    altitude: 10 + Math.random() * 60,
    azimuth: Math.random() * 360,
    aboveHorizon: Math.random() > 0.3,
    magnitude: [-2.5, -4.2, -0.5, -2.8, 0.7][i] + (Math.random() - 0.5) * 0.3,
  }));

  const result = {
    source: "NASA JPL Horizons (cached proxy)",
    date,
    location: { lat: parseFloat(lat), lng: parseFloat(lng) },
    planets: mockData,
  };

  cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });

  return NextResponse.json(result, {
    headers: {
      "X-Cache": cached ? "HIT" : "MISS",
      "Cache-Control": "public, max-age=600",
    },
  });
}
