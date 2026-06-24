import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  const cacheKey = `celestrak:${lat}:${lng}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const group = searchParams.get("group") || "active";

  try {
    const response = await fetch(
      `https://celestrak.org/NORAD/elements/groups/${encodeURIComponent(group)}.json`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      throw new Error(`CelesTrak returned ${response.status}`);
    }

    const text = await response.text();
    const data = JSON.parse(text);

    const result = {
      source: "CelesTrak (cached proxy)",
      count: Array.isArray(data) ? data.length : 0,
      satellites: Array.isArray(data) ? data.slice(0, 200) : [],
    };

    cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(result, {
      headers: {
        "X-Cache": cached ? "HIT" : "MISS",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch CelesTrak data", satellites: [] },
      { status: 503 }
    );
  }
}
