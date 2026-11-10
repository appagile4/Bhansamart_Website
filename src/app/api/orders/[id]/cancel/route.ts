import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Authorization required" },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Order ID is required" },
      { status: 400 }
    );
  }

  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const backendUrl = getBackendApiUrl();
    const res = await fetch(`${backendUrl}/orders/${id}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to cancel order.",
      },
      { status: 503 }
    );
  }
}
