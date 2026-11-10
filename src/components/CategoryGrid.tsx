"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSelectedCategory, setSelectedSubCategory } from "@/redux/slices/productsSlice";

export interface CategoryItem {
  _id?: string;
  name: string;
  slug: string;
  image: string;
  imageUrl?: string;
  displayOrder?: number;
}

// 20 Root Categories matching the screenshot layout exactly
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
  const dispatch = useAppDispatch();
  const { selectedCategory } = useAppSelector((state) => state.products);
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);

  // Fetch real categories and images from backend API
  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
            const sorted = [...json.data].sort(
              (a: CategoryItem, b: CategoryItem) => (a.displayOrder || 999) - (b.displayOrder || 999)
            );
            if (isMounted) {
              setCategories(sorted.slice(0, 20));
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch live categories from backend, using default list:", err);
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryClick = (category: CategoryItem) => {
    // If clicking already selected category, clear it to 'all'
    if (selectedCategory.toLowerCase() === category.name.toLowerCase()) {
      dispatch(setSelectedCategory("all"));
      dispatch(setSelectedSubCategory("all"));
      return;
    }

    dispatch(setSelectedCategory(category.name));
    dispatch(setSelectedSubCategory("all"));

    const elem = document.getElementById("products-section");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="w-full my-8">
      {/* ── 20-Category Grid (10 columns desktop x 2 rows) ── */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-x-3.5 gap-y-6 sm:gap-x-4 sm:gap-y-7">
        {categories.map((category, index) => {
          const rawSrc = category.imageUrl || category.image;
          const imageSrc =
            rawSrc && rawSrc.length > 0
              ? rawSrc.startsWith("http") || rawSrc.startsWith("/")
                ? rawSrc
                : `/images/categories/${rawSrc}`
              : `/images/categories/${category.slug}.png`;

          const isSelected = selectedCategory.toLowerCase() === category.name.toLowerCase();

          return (
            <div
              key={category._id || category.slug || index}
              onClick={() => handleCategoryClick(category)}
              className="group flex flex-col items-center text-center cursor-pointer select-none focus:outline-none transition-transform hover:-translate-y-1"
            >
              {/* ── Category Image Card Box (Light Blue Rounded Container) ── */}
              <div
                className={`w-full aspect-square bg-[#EBF5FA] hover:bg-[#E3F1F9] rounded-2xl flex items-center justify-center p-2.5 sm:p-3 transition-all duration-200 border shadow-[0_2px_8px_rgba(0,0,0,0.03)] group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] ${
                  isSelected
                    ? "border-[#0C831F] ring-2 ring-emerald-400 bg-emerald-50/60"
                    : "border-transparent group-hover:border-blue-100"
                }`}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={imageSrc}
                    alt={category.name}
                    className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-108"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to local image if remote fails
                      const target = e.currentTarget;
                      if (!target.src.includes(`/images/categories/${category.slug}.png`)) {
                        target.src = `/images/categories/${category.slug}.png`;
                      }
                    }}
                  />
                </div>
              </div>

              {/* ── Category Name (2 lines centered text matching screenshot) ── */}
              <p
                className={`text-[11px] sm:text-xs font-semibold leading-tight text-center mt-2 line-clamp-2 min-h-[2rem] transition-colors duration-150 ${
                  isSelected
                    ? "text-[#0C831F] font-bold"
                    : "text-slate-800 group-hover:text-emerald-700"
                }`}
              >
                {category.name}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
