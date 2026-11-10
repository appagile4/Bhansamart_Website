"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ALL_CATEGORY_SECTIONS,
  ALL_CATEGORY_ITEMS,
} from "@/lib/constants/categories";

// ── Useful Links Data ──
const USEFUL_LINKS_COL_1 = [
  { label: "Blog", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms & Conditions", href: "#" },
  { label: "FAQs", href: "#" },
  { label: "Security", href: "#" },
  { label: "Contact Us", href: "#" },
];

const USEFUL_LINKS_COL_2 = [
  { label: "Partner With Us", href: "#" },
  { label: "Franchise Inquiry", href: "#" },
  { label: "Seller Hub", href: "#" },
  { label: "Warehouse Locator", href: "#" },
  { label: "Deliver With Us", href: "#" },
  { label: "Resources", href: "#" },
];

const USEFUL_LINKS_COL_3 = [
  { label: "Recipes & Meals", href: "#" },
  { label: "Quick Bistro", href: "#" },
  { label: "District Hubs", href: "#" },
  { label: "BhansaMart Care", href: "#" },
  { label: "Feeding Bharat", href: "#" },
  { label: "BhansaMart Rewards", href: "#" },
];

// ── Real Categories in 3 Columns from System Catalog ──
const REAL_CATEGORIES_COL_1 = [
  "Vegetables & Fruits",
  "Atta, Rice & Dal",
  "Oil, Ghee & Masala",
  "Dairy, Bread & Eggs",
  "Bakery & Biscuits",
  "Dry Fruits & Cereals",
  "Chicken, Meat & Fish",
  "Kitchenware & Appliances",
  "Chips, Nachos & Popcorn",
  "Namkeen & Roasted",
  "Cold Drinks & Ice Cream",
];

const REAL_CATEGORIES_COL_2 = [
  "Biscuits & Cookies",
  "Chocolates & Candies",
  "Dry Fruits & Nuts",
  "Snack Bars & Healthy Bites",
  "Instant Noodles & Pasta",
  "Bath & Body",
  "Hair Care",
  "Skin & Faces",
  "Beauty & Cosmetics",
  "Feminine Hygiene",
  "Fragrances & Deodorants",
];

const REAL_CATEGORIES_COL_3 = [
  "Health & Pharma",
  "Sexual Wellness",
  "Baby Food",
  "Diapers & Pants",
  "Baby Care",
  "Cleaners & Repellents",
  "Laundry & Detergents",
  "Home & Lifestyle",
  "Air Fresheners",
  "Pooch & Pet Care",
  "Electronics & Gadgets",
];

export default function Footer() {
  const router = useRouter();

  const handleCategoryClick = (categoryName: string) => {
    // 1. Check if category matches a subcategory item
    const matchedItem = ALL_CATEGORY_ITEMS.find(
      (it) => it.name.replace("\n", " ").toLowerCase() === categoryName.toLowerCase()
    );

    if (matchedItem) {
      const section = matchedItem.categoryTitle || "Grocery & Kitchen";
      const subName = matchedItem.name.replace("\n", " ");
      router.push(
        `/categoryExpand?category=${encodeURIComponent(section)}&subCategory=${encodeURIComponent(subName)}`
      );
    } else {
      // 2. Check if category matches a main section title
      const matchedSection = ALL_CATEGORY_SECTIONS.find(
        (s) => s.title.toLowerCase() === categoryName.toLowerCase()
      );
      if (matchedSection) {
        const firstSub = matchedSection.items[0]?.name.replace("\n", " ") || "All";
        router.push(
          `/categoryExpand?category=${encodeURIComponent(matchedSection.title)}&subCategory=${encodeURIComponent(firstSub)}`
        );
      } else {
        router.push(`/categoryExpand?category=${encodeURIComponent(categoryName)}`);
      }
    }

    // Scroll smoothly to top of products catalog
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full bg-white border-t border-slate-200/80 text-slate-700 mt-auto select-none">
      <div className="w-[90%] lg:w-[85%] max-w-7xl mx-auto pt-12 pb-8">
        
        {/* ── Top Section: Useful Links & Real Categories ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 pb-10">
          
          {/* ── Left Column: Useful Links (5 cols) ── */}
          <div className="lg:col-span-4 xl:col-span-5">
            <h3 className="text-base font-extrabold text-slate-900 mb-5 tracking-tight">
              Useful Links
            </h3>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2.5 text-xs text-slate-600">
              <div className="space-y-2.5">
                {USEFUL_LINKS_COL_1.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block hover:text-[#0C831F] transition-colors leading-snug cursor-pointer"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="space-y-2.5">
                {USEFUL_LINKS_COL_2.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block hover:text-[#0C831F] transition-colors leading-snug cursor-pointer"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="space-y-2.5">
                {USEFUL_LINKS_COL_3.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block hover:text-[#0C831F] transition-colors leading-snug cursor-pointer"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Column: Real Categories with Active Route (7 cols) ── */}
          <div className="lg:col-span-8 xl:col-span-7">
            <div className="flex items-center gap-2.5 mb-5">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Categories
              </h3>
              <Link
                href="/categoryExpand"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="text-xs font-bold text-[#0C831F] hover:underline cursor-pointer"
              >
                see all
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-xs text-slate-600">
              {/* Category Col 1 */}
              <div className="space-y-2.5">
                {REAL_CATEGORIES_COL_1.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="block text-left text-xs text-slate-600 hover:text-[#0C831F] transition-colors leading-snug cursor-pointer truncate w-full"
                    title={`Browse ${cat}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Category Col 2 */}
              <div className="space-y-2.5">
                {REAL_CATEGORIES_COL_2.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="block text-left text-xs text-slate-600 hover:text-[#0C831F] transition-colors leading-snug cursor-pointer truncate w-full"
                    title={`Browse ${cat}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Category Col 3 */}
              <div className="space-y-2.5">
                {REAL_CATEGORIES_COL_3.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="block text-left text-xs text-slate-600 hover:text-[#0C831F] transition-colors leading-snug cursor-pointer truncate w-full"
                    title={`Browse ${cat}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Section: Copyright, Download App, Social Icons ── */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <div className="text-xs text-slate-500 font-medium">
            © BhansaMart Commerce Private Limited, 2016-2026
          </div>

          {/* Download App Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Download App</span>

            {/* Apple App Store */}
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#121417] hover:bg-black text-white px-3 py-1.5 rounded-lg text-left transition shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.94.04-2.07.63-2.73 1.4-.58.67-1.09 1.74-1.02 2.78 1.05.08 2.12-.56 2.74-1.31z"/>
              </svg>
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-slate-300 font-medium">Download on the</span>
                <span className="block text-xs font-bold -mt-0.5 tracking-tight">App Store</span>
              </div>
            </a>

            {/* Google Play */}
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#121417] hover:bg-black text-white px-3 py-1.5 rounded-lg text-left transition shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a2.023 2.023 0 0 1-.61-1.443V3.257c0-.555.226-1.066.609-1.443zm11.246 11.247l2.25 2.25-11.83 6.83 9.58-9.08zm2.25-2.25l-2.25 2.25L5.275 3.98l11.83 6.831zm1.06 1.06l3.528 2.037a1.05 1.05 0 0 1 0 1.814l-3.528 2.037-2.062-2.062 2.062-2.826z"/>
              </svg>
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-slate-300 font-medium">GET IT ON</span>
                <span className="block text-xs font-bold -mt-0.5 tracking-tight">Google Play</span>
              </div>
            </a>
          </div>

          {/* Social Icons (Black circular pills) */}
          <div className="flex items-center gap-2.5">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-8 h-8 rounded-full bg-[#16181C] hover:bg-slate-800 text-white flex items-center justify-center transition cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* X (formerly Twitter) */}
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="w-8 h-8 rounded-full bg-[#16181C] hover:bg-slate-800 text-white flex items-center justify-center transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-8 h-8 rounded-full bg-[#16181C] hover:bg-slate-800 text-white flex items-center justify-center transition cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-8 h-8 rounded-full bg-[#16181C] hover:bg-slate-800 text-white flex items-center justify-center transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>

            {/* Threads */}
            <a
              href="https://threads.net"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Threads"
              className="w-8 h-8 rounded-full bg-[#16181C] hover:bg-slate-800 text-white flex items-center justify-center transition cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.001 2c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zm4.568 11.233c-.152 2.378-1.558 3.771-3.957 3.771-2.529 0-4.144-1.79-4.144-4.523 0-2.827 1.724-4.57 4.293-4.57 2.348 0 3.791 1.458 3.96 3.593h-1.693c-.15-1.28-.909-2.091-2.267-2.091-1.547 0-2.502 1.157-2.502 3.068 0 1.86.914 3.021 2.404 3.021 1.488 0 2.213-.807 2.274-2.269h-2.374v-1.424h4.006v1.424z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* ── Disclaimer Line ── */}
        <p className="text-[11px] text-slate-400 mt-6 leading-relaxed">
          &quot;BhansaMart&quot; is owned &amp; managed by &quot;BhansaMart Commerce Private Limited&quot; and is committed to delivering 100% fresh groceries, daily essentials, and kitchen staples to your doorstep in 15-25 minutes.
        </p>

      </div>
    </footer>
  );
}
