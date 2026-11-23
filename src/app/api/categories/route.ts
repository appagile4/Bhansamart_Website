import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";
import { SectionCategoryData } from "@/lib/constants/categories";

interface BackendSubCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface BackendCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  subCategories?: BackendSubCategory[];
}

// Convert backend categories into the shape the website UI uses
function toSections(categories: BackendCategory[]): SectionCategoryData[] {
  return categories.map((cat) => ({
    id: cat.slug || cat._id,
    title: cat.name,
    badge: cat.description || undefined,
    imageUrl: cat.image || undefined,
    items: (cat.subCategories || []).map((sub) => ({
      id: sub.slug || sub._id,
      name: sub.name,
      slug: sub.slug,
      imageUrl: sub.image || "",
      categoryTitle: cat.name,
    })),
  }));
}

export async function GET(req: NextRequest) {
  try {
    const backendUrl = getBackendApiUrl();

    const res = await fetch(`${backendUrl}/categories`, {
      signal: AbortSignal.timeout(8000),
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
        return NextResponse.json({
          success: true,
          source: "backend",
          sections: toSections(json.data),
          categories: json.data,
          data: json.data,
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: json?.message || "No categories found in database",
          sections: [],
          categories: [],
          data: [],
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: `Backend categories API returned error: HTTP ${res.status}`,
        sections: [],
        categories: [],
        data: [],
      },
      { status: res.status || 502 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Categories API Error]:", errorMsg);
    return NextResponse.json(
      {
        success: false,
        message: `Backend categories service unavailable: ${errorMsg}`,
        sections: [],
        categories: [],
        data: [],
      },
      { status: 503 }
    );
  }
}
