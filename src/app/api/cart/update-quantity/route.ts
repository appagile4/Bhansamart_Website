import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";

/**
 * PUT /api/cart/update-quantity
 * Updates quantity (+/- delta or direct quantity value)
 */
export async function PUT(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Authorization required" },
      { status: 401 }
    );
  }

  try {
    const backendUrl = getBackendApiUrl();
    const body = await req.json();

    const res = await fetch(`${backendUrl}/cart/update-quantity`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Cart Update Quantity Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update item quantity." },
      { status: 503 }
    );
  }
}
