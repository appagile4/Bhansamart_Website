"use client";

import React from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSelectedCategory, setSelectedSubCategory } from "@/redux/slices/productsSlice";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  targetCategory: string;
  targetSubCategory?: string;
}

const CATEGORIES: CategoryItem[] = [
  // ── Row 1 ──
  {
    id: "paan-corner",
    name: "Paan Corner",
    slug: "paan-corner",
    image: "/images/categories/paan-corner.png",
    targetCategory: "Snacks & Drinks",
    targetSubCategory: "Paan Corner",
  },
  {
    id: "dairy-bread-eggs",
    name: "Dairy, Bread & Eggs",
    slug: "dairy-bread-eggs",
    image: "/images/categories/dairy-bread-eggs.png",
    targetCategory: "Grocery & Kitchen",
    targetSubCategory: "Dairy, Bread & Eggs",
  },
  {
    id: "fruits-vegetables",
    name: "Fruits & Vegetables",
    slug: "fruits-vegetables",
    image: "/images/categories/fruits-vegetables.png",
    targetCategory: "Grocery & Kitchen",
    targetSubCategory: "Vegetables & Fruits",
  },
  {
    id: "cold-drinks-juices",
    name: "Cold Drinks & Juices",
    slug: "cold-drinks-juices",
    image: "/images/categories/cold-drinks-juices.png",
    targetCategory: "Snacks & Drinks",
    targetSubCategory: "Cold Drinks & Ice Cream",
  },
  {
    id: "snacks-munchies",
    name: "Snacks & Munchies",
    slug: "snacks-munchies",
    image: "/images/categories/snacks-munchies.png",
    targetCategory: "Snacks & Drinks",
    targetSubCategory: "Chips, Nachos & Popcorn",
  },
  {
    id: "breakfast-instant-food",
    name: "Breakfast & Instant Food",
    slug: "breakfast-instant-food",
    image: "/images/categories/breakfast-instant-food.png",
    targetCategory: "Snacks & Drinks",
    targetSubCategory: "Instant Noodles & Pasta",
  },
  {
    id: "sweet-tooth",
    name: "Sweet Tooth",
    slug: "sweet-tooth",
    image: "/images/categories/sweet-tooth.png",
    targetCategory: "Snacks & Drinks",
    targetSubCategory: "Chocolates & Candies",
  },
  {
    id: "bakery-biscuits",
    name: "Bakery & Biscuits",
    slug: "bakery-biscuits",
    image: "/images/categories/bakery-biscuits.png",
    targetCategory: "Grocery & Kitchen",
    targetSubCategory: "Bakery & Biscuits",
  },
  {
    id: "tea-coffee-milk-drinks",
    name: "Tea, Coffee & Milk Drinks",
    slug: "tea-coffee-milk-drinks",
    image: "/images/categories/tea-coffee-milk-drinks.png",
    targetCategory: "Snacks & Drinks",
    targetSubCategory: "Cold Drinks & Ice Cream",
  },
  {
    id: "atta-rice-dal",
    name: "Atta, Rice & Dal",
    slug: "atta-rice-dal",
    image: "/images/categories/atta-rice-dal.png",
    targetCategory: "Grocery & Kitchen",
    targetSubCategory: "Atta, Rice & Dal",
  },

  // ── Row 2 ──
  {
    id: "masala-oil-more",
    name: "Masala, Oil & More",
    slug: "masala-oil-more",
    image: "/images/categories/masala-oil-more.png",
    targetCategory: "Grocery & Kitchen",
    targetSubCategory: "Oil, Ghee & Masala",
  },
  {
    id: "sauces-spreads",
    name: "Sauces & Spreads",
    slug: "sauces-spreads",
    image: "/images/categories/sauces-spreads.png",
    targetCategory: "Snacks & Drinks",
    targetSubCategory: "Sauce & Spreads",
  },
  {
    id: "chicken-meat-fish",
    name: "Chicken, Meat & Fish",
    slug: "chicken-meat-fish",
    image: "/images/categories/chicken-meat-fish.png",
    targetCategory: "Grocery & Kitchen",
    targetSubCategory: "Chicken, Meat & Fish",
  },
  {
    id: "organic-healthy-living",
    name: "Organic & Healthy Living",
    slug: "organic-healthy-living",
    image: "/images/categories/organic-healthy-living.png",
    targetCategory: "Grocery & Kitchen",
    targetSubCategory: "Vegetables & Fruits",
  },
  {
    id: "baby-care",
    name: "Baby Care",
    slug: "baby-care",
    image: "/images/categories/baby-care.png",
    targetCategory: "Baby",
    targetSubCategory: "Baby Care",
  },
  {
    id: "pharma-wellness",
    name: "Pharma & Wellness",
    slug: "pharma-wellness",
    image: "/images/categories/pharma-wellness.png",
    targetCategory: "Beauty & Personal Care",
    targetSubCategory: "Health & Pharma",
  },
  {
    id: "cleaning-essentials",
    name: "Cleaning Essentials",
    slug: "cleaning-essentials",
    image: "/images/categories/cleaning-essentials.png",
    targetCategory: "School, Office & Stationery",
    targetSubCategory: "Office & Desk Supplies",
  },
  {
    id: "home-office",
    name: "Home & Office",
    slug: "home-office",
    image: "/images/categories/home-office.png",
    targetCategory: "School, Office & Stationery",
    targetSubCategory: "Office & Desk Supplies",
  },
  {
    id: "personal-care",
    name: "Personal Care",
    slug: "personal-care",
    image: "/images/categories/personal-care.png",
    targetCategory: "Beauty & Personal Care",
    targetSubCategory: "Bath & Body",
  },
  {
    id: "pet-care",
    name: "Pet Care",
    slug: "pet-care",
    image: "/images/categories/pet-care.png",
    targetCategory: "Baby",
    targetSubCategory: "Baby Care",
  },
];

export default function CategoryGrid() {
  const dispatch = useAppDispatch();
  const { selectedCategory, selectedSubCategory } = useAppSelector((state) => state.products);

  const handleCategoryClick = (category: CategoryItem) => {
    dispatch(setSelectedCategory(category.targetCategory));
    if (category.targetSubCategory) {
      dispatch(setSelectedSubCategory(category.targetSubCategory));
    } else {
      dispatch(setSelectedSubCategory("all"));
    }

    // Smooth scroll to products section
    const elem = document.getElementById("products-section");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="w-full my-6 sm:my-8">
      {/* ── 20-Category Grid (10 Columns on Desktop x 2 Rows) ── */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
        {CATEGORIES.map((cat) => {
          const isSelected =
            (selectedCategory === cat.targetCategory &&
              selectedSubCategory === cat.targetSubCategory) ||
            selectedCategory === cat.name;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className="group flex flex-col items-center text-center cursor-pointer select-none focus:outline-none transition-transform hover:-translate-y-1"
            >
              {/* Category Image Box */}
              <div
                className={`w-full aspect-square rounded-2xl flex items-center justify-center p-2.5 sm:p-3 transition-all duration-200 border shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                  isSelected
                    ? "bg-[#E3F1F9] border-[#0C831F] ring-2 ring-emerald-300"
                    : "bg-[#EBF5FA] hover:bg-[#E3F1F9] border-transparent group-hover:border-blue-100"
                }`}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Category Name */}
              <span
                className={`text-[11px] sm:text-[12px] leading-tight font-medium text-center mt-2 px-0.5 line-clamp-2 transition-colors ${
                  isSelected
                    ? "text-[#0C831F] font-bold"
                    : "text-[#1e293b] group-hover:text-emerald-700"
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
