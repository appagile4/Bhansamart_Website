import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";

export async function GET(req: NextRequest) {
  try {
    const backendUrl = getBackendApiUrl();
    const query = new URL(req.url).search;
    const url = `${backendUrl}/products/my-products${query}`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    if (error?.digest?.startsWith?.("NEXT_")) {
      throw error;
    }
    console.error("[My-Products API Error]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch vendor products" },
      { status: 502 }
    );
  }
}
