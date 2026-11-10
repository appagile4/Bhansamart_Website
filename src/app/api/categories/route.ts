import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export interface CategoryItem {
  _id?: string;
  name: string;
  slug: string;
  image: string;
  imageUrl?: string;
  displayOrder: number;
}

// 20 Root Categories matching the screenshot layout exactly
const FALLBACK_CATEGORIES: CategoryItem[] = [
  { name: "Paan Corner", slug: "paan-corner", image: "/images/categories/paan-corner.png", displayOrder: 1 },
  { name: "Dairy, Bread & Eggs", slug: "dairy-bread-eggs", image: "/images/categories/dairy-bread-eggs.png", displayOrder: 2 },
  { name: "Fruits & Vegetables", slug: "fruits-vegetables", image: "/images/categories/fruits-vegetables.png", displayOrder: 3 },
  { name: "Cold Drinks & Juices", slug: "cold-drinks-juices", image: "/images/categories/cold-drinks-juices.png", displayOrder: 4 },
  { name: "Snacks & Munchies", slug: "snacks-munchies", image: "/images/categories/snacks-munchies.png", displayOrder: 5 },
  { name: "Breakfast & Instant Food", slug: "breakfast-instant-food", image: "/images/categories/breakfast-instant-food.png", displayOrder: 6 },
  { name: "Sweet Tooth", slug: "sweet-tooth", image: "/images/categories/sweet-tooth.png", displayOrder: 7 },
  { name: "Bakery & Biscuits", slug: "bakery-biscuits", image: "/images/categories/bakery-biscuits.png", displayOrder: 8 },
  { name: "Tea, Coffee & Milk Drinks", slug: "tea-coffee-milk-drinks", image: "/images/categories/tea-coffee-milk-drinks.png", displayOrder: 9 },
  { name: "Atta, Rice & Dal", slug: "atta-rice-dal", image: "/images/categories/atta-rice-dal.png", displayOrder: 10 },
  { name: "Masala, Oil & More", slug: "masala-oil-more", image: "/images/categories/masala-oil-more.png", displayOrder: 11 },
  { name: "Sauces & Spreads", slug: "sauces-spreads", image: "/images/categories/sauces-spreads.png", displayOrder: 12 },
  { name: "Chicken, Meat & Fish", slug: "chicken-meat-fish", image: "/images/categories/chicken-meat-fish.png", displayOrder: 13 },
  { name: "Organic & Healthy Living", slug: "organic-healthy-living", image: "/images/categories/organic-healthy-living.png", displayOrder: 14 },
  { name: "Baby Care", slug: "baby-care", image: "/images/categories/baby-care.png", displayOrder: 15 },
  { name: "Pharma & Wellness", slug: "pharma-wellness", image: "/images/categories/pharma-wellness.png", displayOrder: 16 },
  { name: "Cleaning Essentials", slug: "cleaning-essentials", image: "/images/categories/cleaning-essentials.png", displayOrder: 17 },
  { name: "Home & Office", slug: "home-office", image: "/images/categories/home-office.png", displayOrder: 18 },
  { name: "Personal Care", slug: "personal-care", image: "/images/categories/personal-care.png", displayOrder: 19 },
  { name: "Pet Care", slug: "pet-care", image: "/images/categories/pet-care.png", displayOrder: 20 },
];

export async function GET() {
  try {
    const db = await getDb();
    const categoriesFromDb = await db
      .collection("categories")
      .find({
        displayOrder: { $gte: 1, $lte: 20 },
        image: { $regex: "categories/" },
      })
      .sort({ displayOrder: 1 })
      .toArray();

    if (categoriesFromDb && categoriesFromDb.length > 0) {
      const formatted = categoriesFromDb.map((c) => ({
        _id: String(c._id),
        name: c.name,
        slug: c.slug,
        image: c.image || `/images/categories/${c.slug}.png`,
        imageUrl: c.image || `/images/categories/${c.slug}.png`,
        displayOrder: c.displayOrder,
      }));

      return NextResponse.json({
        success: true,
        source: "backend-mongodb",
        count: formatted.length,
        data: formatted,
      });
    }
  } catch (err) {
    console.warn("Could not load categories directly from MongoDB, using static fallback:", err);
  }

  return NextResponse.json({
    success: true,
    source: "fallback",
    count: FALLBACK_CATEGORIES.length,
    data: FALLBACK_CATEGORIES,
  });
}
