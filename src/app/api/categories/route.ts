import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";
import {
  ALL_CATEGORY_SECTIONS,
  SectionCategoryData,
} from "@/lib/constants/categories";

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

// Convert backend categories into the shape the website UI already uses
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

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${getBackendApiUrl()}/categories`, {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    clearTimeout(timeout);

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
    }
  } catch {
    // Backend unreachable — fall through to the static list
  }

  const fallbackData = ALL_CATEGORY_SECTIONS.map((sec) => ({
    _id: sec.id,
    name: sec.title,
    slug: sec.id,
    description: sec.badge || "",
    image: sec.imageUrl || "",
    subCategories: (sec.items || []).map((sub) => ({
      _id: sub.id,
      name: sub.name,
      slug: sub.slug || sub.id,
      image: sub.imageUrl || "",
    })),
  }));

  return NextResponse.json({
    success: true,
    source: "fallback",
    sections: ALL_CATEGORY_SECTIONS,
    categories: fallbackData,
    data: fallbackData,
  });
}
