import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Authorization required" },
      { status: 401 }
    );
  }

  const { productId } = await params;

  try {
    const backendUrl = getBackendApiUrl();
    const res = await fetch(`${backendUrl}/wishlist/remove/${productId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to remove item from wishlist." },
      { status: 503 }
    );
  }
}
