import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://bhansamart.webstudiomatrix.com/api";

/**
 * POST /api/cart/add
 * Adds item to cart or increments quantity
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Authorization required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/cart/add`, {
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
    console.error("Cart Add Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add item to server cart." },
      { status: 503 }
    );
  }
}
