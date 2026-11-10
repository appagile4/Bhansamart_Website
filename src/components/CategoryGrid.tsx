"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export interface CategoryItem {
  _id?: string;
  name: string;
  slug: string;
  image: string;
  imageUrl?: string;
  displayOrder?: number;
}

// Default 20 categories matching the grid
const INITIAL_CATEGORIES: CategoryItem[] = [
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

export default function CategoryGrid() {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      try {
        // 1. Try Next.js API / Backend route
        const res = await fetch("/api/categories");
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
            // Sort by displayOrder ascending
            const sorted = [...json.data].sort(
              (a: CategoryItem, b: CategoryItem) => (a.displayOrder || 999) - (b.displayOrder || 999)
            );
            if (isMounted) {
              setCategories(sorted.slice(0, 20));
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch live categories from backend, using fallback:", err);
      }
    }

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="w-full my-8">
      {/* ── 20-Category Grid (10 columns desktop x 2 rows) ── */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-x-3.5 gap-y-6 sm:gap-x-4 sm:gap-y-7">
        {categories.map((category, index) => {
          // Resolve image URL from backend or fallback to local static crop
          const rawSrc = category.imageUrl || category.image;
          const imageSrc =
            rawSrc && rawSrc.length > 0
              ? rawSrc.startsWith("http") || rawSrc.startsWith("/")
                ? rawSrc
                : `/images/categories/${rawSrc}`
              : `/images/categories/${category.slug}.png`;

          return (
            <Link
              key={category._id || category.slug || index}
              href={`/products?category=${encodeURIComponent(category.slug)}`}
              className="group flex flex-col items-center text-center cursor-pointer select-none focus:outline-none transition-transform hover:-translate-y-1"
            >
              {/* ── Category Image Card Box (Light Blue Rounded Container) ── */}
              <div className="w-full aspect-square bg-[#EBF5FA] hover:bg-[#E3F1F9] rounded-2xl flex items-center justify-center p-2.5 sm:p-3 transition-all duration-200 border border-transparent group-hover:border-blue-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]">
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={imageSrc}
                    alt={category.name}
                    className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-108"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to local static crop if backend image fails
                      const target = e.currentTarget;
                      const fallback = `/images/categories/${category.slug}.png`;
                      if (target.src !== fallback && !target.src.endsWith(fallback)) {
                        target.src = fallback;
                      }
                    }}
                  />
                </div>
              </div>

              {/* ── Category Name (2 lines, centered, clean font) ── */}
              <div className="mt-2.5 px-0.5 min-h-[2.4rem] flex items-start justify-center">
                <span className="text-xs sm:text-[13px] font-medium leading-[1.25] text-slate-700 group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {category.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
