import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";

/**
 * GET /api/cart
 * Fetches user's cart from backend
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
    const res = await fetch(`${backendUrl}/cart`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Cart GET Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to connect to cart service." },
      { status: 503 }
    );
  }
}

/**
 * DELETE /api/cart
 * Clears user's cart in backend
 */
export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Authorization required" },
      { status: 401 }
    );
  }

  try {
    const backendUrl = getBackendApiUrl();
    const res = await fetch(`${backendUrl}/cart/clear`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Cart DELETE Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to clear cart on server." },
      { status: 503 }
    );
  }
}
