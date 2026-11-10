import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat") || searchParams.get("latitude");
  const lngStr = searchParams.get("lng") || searchParams.get("longitude");

  if (!latStr || !lngStr) {
    return NextResponse.json(
      { success: false, message: "Coordinates lat and lng are required" },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    // 1. Try free reverse geocoding service
    const geoRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (geoRes.ok) {
      const data = await geoRes.json();
      const locality = data.locality || data.localityInfo?.administrative?.[data.localityInfo.administrative.length - 1]?.name || "";
      const city = data.city || data.principalSubdivision || "";
      const state = data.principalSubdivision || "";
      const country = data.countryName || "";

      const parts = Array.from(new Set([locality, city, state, country])).filter(Boolean);
      const formattedAddress = parts.join(", ");

      if (formattedAddress) {
        return NextResponse.json({
          success: true,
          addressLine: formattedAddress,
          city: city || locality || "Local Area",
          locality,
          lat,
          lng,
        });
      }
    }
  } catch (error) {
    console.warn("Reverse geocode fetch failed:", error);
  }

  // 2. Fallback based on known coordinate ranges
  let fallbackAddress = "Current Delivery Location";
  let fallbackCity = "New Delhi";

  if (lat >= 28.4 && lat <= 28.9 && lng >= 76.8 && lng <= 77.4) {
    if (lat > 28.65) {
      fallbackAddress = "Rohini, North West Delhi";
      fallbackCity = "Delhi";
    } else {
      fallbackAddress = "Dwarka, South West Delhi";
      fallbackCity = "New Delhi";
    }
  } else if (lat >= 27.5 && lat <= 27.9 && lng >= 85.1 && lng <= 85.6) {
    fallbackAddress = "Kathmandu Valley, Bagmati Province";
    fallbackCity = "Kathmandu";
  } else if (lat >= 28.8 && lat <= 29.2 && lng >= 77.5 && lng <= 78.0) {
    fallbackAddress = "Ganga Nagar, Meerut";
    fallbackCity = "Meerut";
  }

  return NextResponse.json({
    success: true,
    addressLine: fallbackAddress,
    city: fallbackCity,
    lat,
    lng,
  });
}
