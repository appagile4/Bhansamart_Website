import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";

/** Proxies the one-time "add mobile number" call: PUT /auth/profile/phone { phone }. */
export async function PUT(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ success: false, message: "Authorization required" }, { status: 401 });
  }

  try {
    const backendUrl = getBackendApiUrl();
    const body = await req.json();

    const res = await fetch(`${backendUrl}/auth/profile/phone`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ phone: body?.phone }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to save mobile number. Backend unreachable." },
      { status: 503 }
    );
  }
}
