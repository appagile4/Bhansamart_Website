"use client";

import React, { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SectionCategoryData } from "@/lib/constants/categories";
import { useCategorySections } from "@/lib/hooks/useCategorySections";
import { Sparkles, ChevronDown } from "lucide-react";

export interface MainCategoryDisplayItem {
  id: string;
  title: string;
  name: string;
  slug: string;
  badge: string;
  image: string;
  fallbackImage: string;
  subCount: number;
  subCategoryTitle: string;
  categoryTitle: string;
  previewSubCategories: string[];
}

// Fallback images map for local fast delivery icons
const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  "grocery-kitchen": "/images/categories/dairy-bread-eggs.png",
  "snacks-drinks": "/images/categories/snacks-munchies.png",
  "beauty-personal-care": "/images/categories/personal-care.png",
  baby: "/images/categories/baby-care.png",
  "school-office-stationery": "/images/categories/home-office.png",
  gifting: "/images/categories/sweet-tooth.png",
};

// Map category sections into main category items for home page
const toMainCategories = (
  sections: SectionCategoryData[],
): MainCategoryDisplayItem[] =>
  sections.map((sec) => {
    const fallback =
      FALLBACK_CATEGORY_IMAGES[sec.id] ||
      "/images/categories/fruits-vegetables.png";
    return {
      id: sec.id,
      title: sec.title,
      name: sec.title,
      slug: sec.id,
      badge: sec.badge || `${sec.items.length} Subcategories`,
      image: sec.imageUrl || fallback,
      fallbackImage: fallback,
      subCount: sec.items.length,
      subCategoryTitle: sec.items[0]?.name.replace("\n", " ") || "All",
      categoryTitle: sec.title,
      previewSubCategories: sec.items
        .slice(0, 3)
        .map((it) => it.name.replace("\n", " ")),
    };
  });

export default function CategoryGrid() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { sections, loaded } = useCategorySections();
  const MAIN_CATEGORIES = useMemo(() => toMainCategories(sections), [sections]);

  // Open the main category; the category page lists all its subcategories
  const handleCategoryClick = (item: MainCategoryDisplayItem) => {
    router.push(`/categoryExpand?category=${encodeURIComponent(item.title)}`);
  };

  const toggleExpand = () => {
    if (isExpanded && sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.top < 0) {
        sectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
    setIsExpanded((prev) => !prev);
  };

  // Enforce max 2 rows responsively when collapsed:
  // Mobile (<sm, 4 cols): 8 items (2 rows of 4)
  // Small tablets (sm, 6 cols): 12 items (2 rows of 6)
  // Medium tablets (md, 8 cols): 16 items (2 rows of 8)
  // Desktop (lg, 10 cols): 20 items (2 rows of 10)
  const getCardVisibility = (index: number) => {
    if (isExpanded) return "flex flex-col";
    if (index < 8) return "flex flex-col";
    if (index < 12) return "hidden sm:flex flex-col";
    if (index < 16) return "hidden md:flex flex-col";
    if (index < 20) return "hidden lg:flex flex-col";
    return "hidden";
  };

  // The first 8 are always visible, so the expander only matters beyond that
  const showExpander = loaded && MAIN_CATEGORIES.length > 8;

  return (
    <section ref={sectionRef} className="w-full my-6 sm:my-8 scroll-mt-24">
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
              Explore Categories
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-100 text-[#0C831F] text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 fill-[#0C831F]" />
              Superfast Delivery
            </span>
          </div>
          <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-normal mt-0.5 leading-snug">
            Select any category to explore subcategories and fresh products from
            your nearest hub
          </p>
        </div>
      </div>

      {/* ── Category Grid Card ── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-300 overflow-hidden">
        {!loaded ? (
          /* ── Skeleton Loading Grid (Matches 2-Row Responsive Layout) ── */
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5 sm:gap-x-4 sm:gap-y-5">
            {Array.from({ length: 20 }).map((_, index) => (
              <div
                key={index}
                className={`w-full items-center text-center animate-pulse ${getCardVisibility(
                  index,
                )}`}
              >
                {/* Image Box Skeleton */}
                <div className="w-full aspect-square rounded-xl sm:rounded-2xl bg-slate-200/70 mb-1.5 sm:mb-2 shadow-2xs" />
                {/* Text Label Skeleton */}
                <div className="h-2.5 sm:h-3 w-3/4 bg-slate-200/70 rounded-md mx-auto mt-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5 sm:gap-x-4 sm:gap-y-5">
            {MAIN_CATEGORIES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleCategoryClick(item)}
                className={`group w-full items-center text-center cursor-pointer select-none focus:outline-none transition-transform hover:-translate-y-1 ${getCardVisibility(
                  index,
                )}`}
              >
                {/* Image Card Box */}
                <div className="w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden relative flex items-center justify-center transition-all duration-200 bg-[#EBF5FA] border border-slate-100/60 group-hover:border-slate-300 shadow-2xs">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-108"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to local image if remote fails
                      const target = e.currentTarget;
                      if (!target.src.endsWith(item.fallbackImage)) {
                        target.src = item.fallbackImage;
                      }
                    }}
                  />
                </div>

                {/* Category Name Label */}
                <span className="text-[10px] xs:text-[11px] sm:text-xs md:text-[13px] leading-snug font-semibold mt-1.5 sm:mt-2 min-h-[1.75rem] sm:min-h-[2.25rem] flex items-center justify-center text-center w-full px-0.5 text-slate-800 group-hover:text-[#0C831F] transition-colors whitespace-pre-line">
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── Seamless Full-Width Footer Expander Strip ── */}
        {showExpander && (
          <div className="mt-4 sm:mt-5 -mx-3.5 -mb-3.5 sm:-mx-5 sm:-mb-5 md:-mx-6 md:-mb-6 border-t border-slate-100 bg-gradient-to-b from-slate-50/40 to-slate-100/70">
            <button
              type="button"
              onClick={toggleExpand}
              className="w-full py-3.5 px-4 flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base font-bold text-slate-700 hover:text-[#0C831F] hover:bg-emerald-50/40 transition-all duration-200 cursor-pointer select-none group"
              aria-expanded={isExpanded}
            >
              <span className="tracking-tight">
                {isExpanded ? "Show Fewer Categories" : "See More Categories"}
              </span>

              <span className="w-5 h-5 rounded-full bg-white shadow-2xs border border-slate-200/70 group-hover:border-emerald-300 flex items-center justify-center text-slate-400 group-hover:text-[#0C831F] transition-all">
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    isExpanded ? "rotate-180 text-[#0C831F]" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
