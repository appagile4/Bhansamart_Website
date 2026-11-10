import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://bhansamart.webstudiomatrix.com/api";

/**
 * DELETE /api/cart/remove/[productId]
 * Removes product from server cart
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params;
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Authorization required" },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`${BACKEND_URL}/cart/remove/${encodeURIComponent(productId)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Cart Remove Item Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove item from cart." },
      { status: 503 }
    );
  }
}
