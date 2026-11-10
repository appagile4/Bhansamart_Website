"use client";

import React, { useState } from "react";
import {
  ALL_CATEGORY_SECTIONS,
  ALL_CATEGORY_ITEMS,
  SectionCategoryData,
  CategoryCardData,
} from "@/lib/constants/categories";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSelectedCategory, setSelectedSubCategory } from "@/redux/slices/productsSlice";
import { Sparkles, ArrowRight } from "lucide-react";

export default function CategoryGrid() {
  const dispatch = useAppDispatch();
  const { selectedCategory, selectedSubCategory } = useAppSelector((state) => state.products);

  const [activeTab, setActiveTab] = useState<string>("all");

  // Determine which sections to display based on selected tab
  const displayedSections: SectionCategoryData[] =
    activeTab === "all"
      ? ALL_CATEGORY_SECTIONS
      : ALL_CATEGORY_SECTIONS.filter((s) => s.id === activeTab);

  const handleCategoryClick = (item: CategoryCardData, sectionTitle: string) => {
    // Set both category and subcategory in Redux
    dispatch(setSelectedCategory(sectionTitle));
    dispatch(setSelectedSubCategory(item.name.replace("\n", " ")));

    // Smooth scroll to products section
    const elem = document.getElementById("products-section");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="w-full my-8">
      {/* ── Section Title & Tabs ── */}
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

        {/* View All or Selected Indicator */}
        {selectedCategory !== "all" ? (
          <button
            type="button"
            onClick={() => {
              dispatch(setSelectedCategory("all"));
              dispatch(setSelectedSubCategory("all"));
            }}
            className="self-start sm:self-auto text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer transition"
          >
            <span>Showing: {selectedCategory}</span>
            <span className="text-slate-400 font-normal ml-1">(Clear)</span>
          </button>
        ) : null}
      </div>

      {/* ── Section Category Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer select-none ${
            activeTab === "all"
              ? "bg-[#0C831F] text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          🌟 All Categories ({ALL_CATEGORY_ITEMS.length})
        </button>

        {ALL_CATEGORY_SECTIONS.map((sec) => {
          const isActive = activeTab === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveTab(sec.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer select-none ${
                isActive
                  ? "bg-[#0C831F] text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {sec.title}
            </button>
          );
        })}
      </div>

      {/* ── Category Cards Grid by Section ── */}
      <div className="space-y-8">
        {displayedSections.map((section) => (
          <div key={section.id} className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            {/* Sub-Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {section.title}
                </h3>
                {section.badge ? (
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {section.badge}
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => {
                  dispatch(setSelectedCategory(section.title));
                  dispatch(setSelectedSubCategory("all"));
                  const elem = document.getElementById("products-section");
                  if (elem) elem.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer group"
              >
                <span>View products</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Grid of Items */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 sm:gap-4">
              {section.items.map((item) => {
                const isSelected =
                  selectedCategory.toLowerCase() === section.title.toLowerCase() &&
                  selectedSubCategory.toLowerCase() === item.name.replace("\n", " ").toLowerCase();

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleCategoryClick(item, section.title)}
                    className="group flex flex-col items-center text-center cursor-pointer select-none focus:outline-none transition-transform hover:-translate-y-1"
                  >
                    {/* Image Card Box */}
                    <div
                      className={`w-full aspect-square rounded-2xl flex items-center justify-center p-2.5 sm:p-3 transition-all duration-200 border shadow-2xs ${
                        isSelected
                          ? "bg-emerald-50 border-[#0C831F] ring-2 ring-emerald-300"
                          : "bg-[#EBF5FA] hover:bg-[#E1EFF7] border-transparent group-hover:border-blue-100"
                      }`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-108"
                        loading="lazy"
                      />
                    </div>

                    {/* Category Label */}
                    <span
                      className={`text-[11px] sm:text-xs leading-tight line-clamp-2 mt-2 font-medium ${
                        isSelected
                          ? "text-[#0C831F] font-bold"
                          : "text-slate-700 group-hover:text-emerald-800"
                      }`}
                    >
                      {item.name.replace("\n", " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
