import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Product ID is required" },
      { status: 400 }
    );
  }

  const backendUrl = getBackendApiUrl();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${backendUrl}/products/${id}`, {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 30 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.product) {
        return NextResponse.json({
          success: true,
          product: data.product,
          source: "backend",
        });
      }
    }
  } catch (error) {
    console.error(`[API /api/products/${id}] Error fetching from backend:`, error);
  }

  // Fallback product mock if backend was unreachable or ID is local mock
  const fallbackProduct = {
    _id: id,
    name: "Fresh Grocery Selection",
    price: 99,
    originalPrice: 120,
    unit: "1 pack",
    category: "Grocery & Kitchen",
    subCategory: "Vegetables & Fruits",
    description:
      "Premium quality item sourced and hygienically packed for maximum daily freshness.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
        altText: "Product Preview",
      },
    ],
    ratingsAverage: 4.8,
    ratingsCount: 88,
    inStock: true,
    brand: "BhansaMart Daily",
    vendor: {
      businessDetails: {
        businessName: "BhansaMart Express Hub",
        categories: ["Grocery & Kitchen"],
      },
      sellerDetails: {
        sellerName: "BhansaMart Express",
        city: "Local Hub",
      },
    },
  };

  return NextResponse.json({
    success: true,
    product: fallbackProduct,
    source: "fallback",
  });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const backendUrl = getBackendApiUrl();

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const contentType = req.headers.get("content-type") || "";
    let body: any;
    if (contentType.includes("application/json")) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(await req.json());
    } else if (contentType.includes("multipart/form-data")) {
      body = await req.formData();
    } else {
      body = await req.text();
    }

    const res = await fetch(`${backendUrl}/products/${id}`, {
      method: "PUT",
      headers,
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update product" },
      { status: 502 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const backendUrl = getBackendApiUrl();

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(`${backendUrl}/products/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete product" },
      { status: 502 }
    );
  }
}
