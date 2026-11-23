import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";

/** Proxies Google Sign-In to the backend: POST /auth/google { idToken, referralCode? }. */
export async function POST(req: NextRequest) {
  try {
    const backendUrl = getBackendApiUrl();
    const body = await req.json();

    const res = await fetch(`${backendUrl}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: body?.idToken, referralCode: body?.referralCode }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to connect to the authentication server. Please ensure the backend is running.",
      },
      { status: 503 }
    );
  }
}
