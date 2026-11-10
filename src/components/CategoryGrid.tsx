"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ALL_CATEGORY_ITEMS, CategoryCardData } from "@/lib/constants/categories";
import { Sparkles } from "lucide-react";

export default function CategoryGrid() {
  const router = useRouter();

  const handleCategoryClick = (item: CategoryCardData) => {
    const cat = item.categoryTitle || "Grocery & Kitchen";
    const sub = item.name.replace("\n", " ");
    // Route to categoryExpand independently without mutating NearbyProducts state
    router.push(
      `/categoryExpand?category=${encodeURIComponent(cat)}&subCategory=${encodeURIComponent(sub)}`
    );
  };

  return (
    <section className="w-full my-8">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Explore Categories
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-100 text-[#0C831F] text-xs font-bold px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 fill-[#0C831F]" />
              Superfast Delivery
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Select any category to browse verified products from your nearest hub
          </p>
        </div>
      </div>

      {/* ── Single Unified Category Grid (Independent Navigation) ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 sm:gap-4">
          {ALL_CATEGORY_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleCategoryClick(item)}
              className="group w-full flex flex-col items-center text-center cursor-pointer select-none focus:outline-none transition-transform hover:-translate-y-1"
            >
              {/* Image Card Box - Uniform 1:1 Aspect Square */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden relative flex items-center justify-center transition-all duration-200 border border-slate-100 group-hover:border-slate-300 shadow-2xs bg-[#EBF5FA]">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
              </div>

              {/* Category Label */}
              <span className="text-[11px] sm:text-xs leading-tight line-clamp-2 mt-2 font-medium h-7 sm:h-8 flex items-center justify-center text-center w-full px-0.5 text-slate-700 group-hover:text-emerald-800">
                {item.name.replace("\n", " ")}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
