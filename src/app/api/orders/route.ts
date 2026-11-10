import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";

/**
 * POST /api/orders
 * Place a new order with live backend validation
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Please log in to place your order." },
      { status: 401 }
    );
  }

  try {
    const backendUrl = getBackendApiUrl();
    const body = await req.json();

    const res = await fetch(`${backendUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Create Order Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to place order on server." },
      { status: 503 }
    );
  }
}

/**
 * GET /api/orders
 * Retrieve list of orders
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Authorization required" },
      { status: 401 }
    );
  }

  try {
    const backendUrl = getBackendApiUrl();
    const res = await fetch(`${backendUrl}/orders/my-orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Get Orders Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders." },
      { status: 503 }
    );
  }
}
