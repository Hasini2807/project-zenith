import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error("API returned non-OK status");
    }

    return NextResponse.json({
      source: "Sunrise-Sunset.org",
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      sunrise: data.results.sunrise,
      sunset: data.results.sunset,
      solarNoon: data.results.solar_noon,
      dayLength: data.results.day_length,
      twilightBegin: data.results.civil_twilight_begin,
      twilightEnd: data.results.civil_twilight_end,
    });
  } catch (error) {
    const now = new Date();
    const sunrise = new Date(now);
    sunrise.setHours(6, 42, 0, 0);
    const sunset = new Date(now);
    sunset.setHours(19, 53, 0, 0);
    const dayLength = ((sunset.getTime() - sunrise.getTime()) / 3600000).toFixed(2);

    return NextResponse.json({
      source: "Sunrise-Sunset.org (fallback)",
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      sunrise: sunrise.toISOString(),
      sunset: sunset.toISOString(),
      solarNoon: new Date(now.setHours(13, 17, 0, 0)).toISOString(),
      dayLength: `${dayLength} hours`,
      twilightBegin: new Date(sunrise.getTime() - 30 * 60000).toISOString(),
      twilightEnd: new Date(sunset.getTime() + 30 * 60000).toISOString(),
      fallback: true,
    });
  }
}
