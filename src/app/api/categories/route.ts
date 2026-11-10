import { NextResponse } from "next/server";

// Fallback categories list matching the 20 grid categories exactly
const FALLBACK_CATEGORIES = [
  { _id: "1", name: "Paan Corner", slug: "paan-corner", image: "/images/categories/paan-corner.png", displayOrder: 1 },
  { _id: "2", name: "Dairy, Bread & Eggs", slug: "dairy-bread-eggs", image: "/images/categories/dairy-bread-eggs.png", displayOrder: 2 },
  { _id: "3", name: "Fruits & Vegetables", slug: "fruits-vegetables", image: "/images/categories/fruits-vegetables.png", displayOrder: 3 },
  { _id: "4", name: "Cold Drinks & Juices", slug: "cold-drinks-juices", image: "/images/categories/cold-drinks-juices.png", displayOrder: 4 },
  { _id: "5", name: "Snacks & Munchies", slug: "snacks-munchies", image: "/images/categories/snacks-munchies.png", displayOrder: 5 },
  { _id: "6", name: "Breakfast & Instant Food", slug: "breakfast-instant-food", image: "/images/categories/breakfast-instant-food.png", displayOrder: 6 },
  { _id: "7", name: "Sweet Tooth", slug: "sweet-tooth", image: "/images/categories/sweet-tooth.png", displayOrder: 7 },
  { _id: "8", name: "Bakery & Biscuits", slug: "bakery-biscuits", image: "/images/categories/bakery-biscuits.png", displayOrder: 8 },
  { _id: "9", name: "Tea, Coffee & Milk Drinks", slug: "tea-coffee-milk-drinks", image: "/images/categories/tea-coffee-milk-drinks.png", displayOrder: 9 },
  { _id: "10", name: "Atta, Rice & Dal", slug: "atta-rice-dal", image: "/images/categories/atta-rice-dal.png", displayOrder: 10 },
  { _id: "11", name: "Masala, Oil & More", slug: "masala-oil-more", image: "/images/categories/masala-oil-more.png", displayOrder: 11 },
  { _id: "12", name: "Sauces & Spreads", slug: "sauces-spreads", image: "/images/categories/sauces-spreads.png", displayOrder: 12 },
  { _id: "13", name: "Chicken, Meat & Fish", slug: "chicken-meat-fish", image: "/images/categories/chicken-meat-fish.png", displayOrder: 13 },
  { _id: "14", name: "Organic & Healthy Living", slug: "organic-healthy-living", image: "/images/categories/organic-healthy-living.png", displayOrder: 14 },
  { _id: "15", name: "Baby Care", slug: "baby-care", image: "/images/categories/baby-care.png", displayOrder: 15 },
  { _id: "16", name: "Pharma & Wellness", slug: "pharma-wellness", image: "/images/categories/pharma-wellness.png", displayOrder: 16 },
  { _id: "17", name: "Cleaning Essentials", slug: "cleaning-essentials", image: "/images/categories/cleaning-essentials.png", displayOrder: 17 },
  { _id: "18", name: "Home & Office", slug: "home-office", image: "/images/categories/home-office.png", displayOrder: 18 },
  { _id: "19", name: "Personal Care", slug: "personal-care", image: "/images/categories/personal-care.png", displayOrder: 19 },
  { _id: "20", name: "Pet Care", slug: "pet-care", image: "/images/categories/pet-care.png", displayOrder: 20 },
];

export async function GET() {
  const backendUrl =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://bhansamart.webstudiomatrix.com/api";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${backendUrl}/categories`, {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        return NextResponse.json({
          success: true,
          source: "backend",
          count: data.data.length,
          data: data.data,
        });
      }
    }
  } catch {
    // If backend isn't actively running on localhost:5000, gracefully fallback
  }

  return NextResponse.json({
    success: true,
    source: "fallback",
    count: FALLBACK_CATEGORIES.length,
    data: FALLBACK_CATEGORIES,
  });
}
