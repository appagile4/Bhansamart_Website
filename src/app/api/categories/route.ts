import { NextResponse } from "next/server";
import { ALL_CATEGORY_SECTIONS, ALL_CATEGORY_ITEMS } from "@/lib/constants/categories";

export async function GET() {
  return NextResponse.json({
    success: true,
    source: "customer-panel-categories",
    sectionsCount: ALL_CATEGORY_SECTIONS.length,
    totalCategories: ALL_CATEGORY_ITEMS.length,
    sections: ALL_CATEGORY_SECTIONS,
    data: ALL_CATEGORY_ITEMS,
  });
}
