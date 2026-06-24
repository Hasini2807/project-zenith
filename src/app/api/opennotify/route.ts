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
      `https://api.open-notify.org/iss-pass.json?lat=${lat}&lon=${lng}&n=5`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await response.json();

    return NextResponse.json({
      source: "OpenNotify",
      passes: data.response || [],
      request: data,
    });
  } catch (error) {
    try {
      const posRes = await fetch(
        `https://api.open-notify.org/iss-now.json`,
        { signal: AbortSignal.timeout(5000) }
      );
      const posData = await posRes.json();
      return NextResponse.json({
        source: "OpenNotify",
        currentPosition: posData.iss_position || null,
        passes: [],
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch ISS data", iss: null },
        { status: 503 }
      );
    }
  }
}
