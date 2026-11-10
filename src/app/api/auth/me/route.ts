import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Authorization header missing" },
      { status: 401 }
    );
  }

  try {
    const backendUrl = getBackendApiUrl();
    const res = await fetch(`${backendUrl}/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to authentication server",
      },
      { status: 503 }
    );
  }
}
