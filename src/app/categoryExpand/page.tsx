"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import AddressModal from "@/components/AddressModal";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import { ProductItem } from "@/components/ProductCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addToCart, removeFromCart } from "@/redux/slices/cartSlice";
import {
  ALL_CATEGORY_SECTIONS,
  SectionCategoryData,
  CategoryCardData,
} from "@/lib/constants/categories";
import {
  Zap,
  Plus,
  Minus,
  ArrowLeft,
  ChevronRight,
  PackageOpen,
  Sparkles,
} from "lucide-react";

function CategoryExpandContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const { items: cartItems } = useAppSelector((state) => state.cart);
  const { currentAddress } = useAppSelector((state) => state.address);

  // URL Query Params
  const queryCategory = searchParams.get("category") || "";
  const querySubCategory = searchParams.get("subCategory") || "";

  // 1. Resolve Active Category Section
  const activeSection: SectionCategoryData = useMemo(() => {
    if (queryCategory) {
      // 1a. Direct section title match
      const found = ALL_CATEGORY_SECTIONS.find(
        (s) => s.title.toLowerCase() === queryCategory.toLowerCase()
      );
      if (found) return found;

      // 1b. Check if queryCategory matches a subcategory item name
      const foundByItem = ALL_CATEGORY_SECTIONS.find((s) =>
        s.items.some(
          (i) =>
            i.name.replace("\n", " ").toLowerCase() ===
            queryCategory.toLowerCase()
        )
      );
      if (foundByItem) return foundByItem;
    }
    if (querySubCategory) {
      const foundBySub = ALL_CATEGORY_SECTIONS.find((s) =>
        s.items.some(
          (i) =>
            i.name.replace("\n", " ").toLowerCase() ===
            querySubCategory.toLowerCase()
        )
      );
      if (foundBySub) return foundBySub;
    }
    return ALL_CATEGORY_SECTIONS[0]; // Grocery & Kitchen default
  }, [queryCategory, querySubCategory]);

  // 2. Resolve Active Subcategory
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(() => {
    if (querySubCategory) {
      const match = activeSection.items.find(
        (i) =>
          i.name.replace("\n", " ").toLowerCase() ===
          querySubCategory.toLowerCase()
      );
      if (match) return match.name.replace("\n", " ");
    }
    if (queryCategory) {
      const matchCat = activeSection.items.find(
        (i) =>
          i.name.replace("\n", " ").toLowerCase() ===
          queryCategory.toLowerCase()
      );
      if (matchCat) return matchCat.name.replace("\n", " ");
    }
    return activeSection.items[0]?.name.replace("\n", " ") || "All";
  });

  // Keep state synced if URL changes
  useEffect(() => {
    if (querySubCategory) {
      setSelectedSubCategory(querySubCategory);
    } else if (queryCategory) {
      const matchCat = activeSection.items.find(
        (i) =>
          i.name.replace("\n", " ").toLowerCase() ===
          queryCategory.toLowerCase()
      );
      if (matchCat) {
        setSelectedSubCategory(matchCat.name.replace("\n", " "));
      } else if (activeSection.items[0]) {
        setSelectedSubCategory(activeSection.items[0].name.replace("\n", " "));
      }
    } else if (activeSection.items[0]) {
      setSelectedSubCategory(activeSection.items[0].name.replace("\n", " "));
    }
  }, [queryCategory, querySubCategory, activeSection]);

  // 3. Products state
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 4. Fetch real products from backend API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadProducts() {
      try {
        const cat = activeSection.title;
        const sub = selectedSubCategory;

        // Query live backend proxy
        const query = new URLSearchParams();
        if (cat) query.set("category", cat);
        if (sub && sub !== "All") query.set("subCategory", sub);
        if (currentAddress.city) query.set("city", currentAddress.city);
        query.set("limit", "100");

        const res = await fetch(`/api/products?${query.toString()}`);
        const data = await res.json();

        if (isMounted) {
          if (data.success && Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
          } else {
            // If exact subcategory has 0, fetch category products as fallback
            const fallbackRes = await fetch(
              `/api/products?category=${encodeURIComponent(cat)}&limit=100`
            );
            const fallbackData = await fallbackRes.json();
            if (fallbackData.success && Array.isArray(fallbackData.products)) {
              setProducts(fallbackData.products);
            } else {
              setProducts([]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load category products:", err);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [activeSection.title, selectedSubCategory, currentAddress.city]);

  const handleSubCategoryClick = (item: CategoryCardData) => {
    const subName = item.name.replace("\n", " ");
    setSelectedSubCategory(subName);
    router.replace(
      `/categoryExpand?category=${encodeURIComponent(
        activeSection.title
      )}&subCategory=${encodeURIComponent(subName)}`
    );
  };

  const handleProductClick = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      {/* ── 1. Global Header ── */}
      <Header />

      {/* ── 2. Category Title Bar (Top) ── */}
      <div className="bg-white border-b border-slate-200/80 sticky top-20 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="w-[96%] max-w-[1700px] mx-auto py-3 sm:py-3.5 px-2 sm:px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                  {activeSection.title}
                </h1>
                <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                  •
                </span>
                <span className="text-xs sm:text-sm font-bold text-emerald-700 hidden sm:inline">
                  {selectedSubCategory}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none mt-0.5">
                {products.length} Products Available in your area
              </p>
            </div>
          </div>

          {/* Category Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold hidden md:inline">
              Category:
            </span>
            <select
              value={activeSection.id}
              onChange={(e) => {
                const targetSec = ALL_CATEGORY_SECTIONS.find(
                  (s) => s.id === e.target.value
                );
                if (targetSec) {
                  const firstSub = targetSec.items[0]?.name.replace("\n", " ") || "";
                  router.push(
                    `/categoryExpand?category=${encodeURIComponent(
                      targetSec.title
                    )}&subCategory=${encodeURIComponent(firstSub)}`
                  );
                }
              }}
              className="text-xs font-bold text-slate-800 bg-[#F4F6F8] hover:bg-slate-200/80 border border-slate-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
            >
              {ALL_CATEGORY_SECTIONS.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 3. Main Split Container (Sidebar + Products Grid) ── */}
      <div className="flex-1 w-[96%] max-w-[1700px] mx-auto flex flex-row items-stretch my-3 bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
        
        {/* ── Left Sidebar: Subcategories ── */}
        <aside className="w-20 sm:w-28 md:w-32 shrink-0 bg-white border-r border-slate-200/80 overflow-y-auto no-scrollbar py-2 select-none">
          <div className="flex flex-col">
            {activeSection.items.map((subItem) => {
              const subName = subItem.name.replace("\n", " ");
              const isActive =
                selectedSubCategory.toLowerCase() === subName.toLowerCase();

              return (
                <button
                  key={subItem.id}
                  type="button"
                  onClick={() => handleSubCategoryClick(subItem)}
                  className={`w-full py-3 px-1.5 flex flex-col items-center justify-center transition-all cursor-pointer relative group text-center ${
                    isActive
                      ? "bg-[#EBF7F2] text-[#0C831F] font-bold"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  {/* Active Indicator Bar on right side (exact match to screenshot) */}
                  {isActive ? (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#0C831F] rounded-l" />
                  ) : null}

                  {/* Thumbnail Image Box */}
                  <div
                    className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden flex items-center justify-center p-1 border transition-all mb-1 ${
                      isActive
                        ? "border-[#0C831F] bg-white shadow-2xs scale-102"
                        : "border-slate-100 bg-slate-50 group-hover:border-slate-200"
                    }`}
                  >
                    <img
                      src={subItem.imageUrl}
                      alt={subName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Subcategory Label */}
                  <span
                    className={`text-[10px] sm:text-[11px] leading-tight line-clamp-2 px-1 text-center ${
                      isActive ? "font-extrabold text-[#0C831F]" : "font-medium"
                    }`}
                  >
                    {subName}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Right Content Area: Products Grid ── */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 bg-[#FAFBFD] overflow-y-auto">
          {/* Subheader */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                {selectedSubCategory}
              </h2>
              <span className="text-xs text-slate-500 font-normal">
                ({products.length} items)
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>15-25 Mins Express Delivery</span>
            </div>
          </div>

          {/* ── Loading Skeleton State ── */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/70 rounded-2xl p-3 flex flex-col animate-pulse h-64"
                >
                  <div className="w-full aspect-square bg-slate-100 rounded-xl mb-3" />
                  <div className="h-3 bg-slate-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                  <div className="mt-auto flex items-center justify-between">
                    <div className="h-4 bg-slate-100 rounded w-12" />
                    <div className="h-7 bg-slate-100 rounded-lg w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* ── Empty State ── */
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-12 shadow-2xs">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <PackageOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                No items currently found in {selectedSubCategory}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Try selecting another subcategory from the left menu or explore all categories.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0C831F] text-white font-bold text-xs rounded-xl hover:bg-[#0a6f1a] transition"
              >
                <span>Back to All Categories</span>
              </Link>
            </div>
          ) : (
            /* ── Products Grid (Matching Screenshot with 5-6 Columns) ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {products.map((product) => {
                const prodId = product._id || product.id || "";
                const qty = cartItems[prodId]?.quantity || 0;

                const discountPercent =
                  product.originalPrice && product.originalPrice > product.price
                    ? Math.round(
                        ((product.originalPrice - product.price) /
                          product.originalPrice) *
                          100
                      )
                    : null;

                const imgSrc =
                  product.images && product.images.length > 0 && product.images[0].url
                    ? product.images[0].url
                    : "/images/placeholder-product.png";

                return (
                  <div
                    key={prodId}
                    className="group relative bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 select-none"
                  >
                    {/* Top: Discount Badge (Blue/Red as in screenshot) */}
                    <div className="relative w-full aspect-square bg-[#F8FAFC] rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2">
                      {discountPercent ? (
                        <span className="absolute top-1.5 left-1.5 z-10 bg-[#0070F3] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md tracking-tight shadow-xs">
                          {discountPercent}% OFF
                        </span>
                      ) : null}

                      {/* Product Image Clickable */}
                      <button
                        type="button"
                        onClick={() => handleProductClick(prodId)}
                        className="w-full h-full flex items-center justify-center cursor-pointer focus:outline-none"
                      >
                        <img
                          src={imgSrc}
                          alt={product.name}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-108"
                          loading="lazy"
                        />
                      </button>

                      {/* Delivery Time Pill (20 MINS) */}
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-white/95 backdrop-blur-xs px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold text-slate-700 shadow-2xs border border-slate-100 pointer-events-none">
                        <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span>20 MINS</span>
                      </div>
                    </div>

                    {/* Middle: Title & Weight */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Title */}
                        <button
                          type="button"
                          onClick={() => handleProductClick(prodId)}
                          className="text-left cursor-pointer focus:outline-none w-full"
                        >
                          <h3
                            className="text-xs sm:text-[13px] font-semibold text-slate-900 leading-snug line-clamp-2 min-h-[2.1rem] group-hover:text-emerald-700 transition-colors"
                            title={product.name}
                          >
                            {product.name}
                          </h3>
                        </button>

                        {/* Unit / Weight */}
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          {product.unit || "1 pc"}
                        </p>
                      </div>

                      {/* Bottom Row: Price & ADD Button */}
                      <div className="flex items-center justify-between gap-1 mt-3 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleProductClick(prodId)}
                          className="flex flex-col text-left cursor-pointer focus:outline-none"
                        >
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 leading-none">
                            ₹{product.price}
                          </span>
                          {product.originalPrice &&
                          product.originalPrice > product.price ? (
                            <span className="text-[10px] text-slate-400 line-through font-normal mt-0.5">
                              ₹{product.originalPrice}
                            </span>
                          ) : null}
                        </button>

                        {/* ADD / Quantity Counter Button */}
                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(addToCart(product));
                            }}
                            className="px-3.5 py-1.5 border border-[#0C831F] text-[#0C831F] hover:bg-[#0C831F] hover:text-white bg-white font-extrabold text-xs rounded-lg transition shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1 focus:outline-none"
                          >
                            <span>ADD</span>
                          </button>
                        ) : (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center bg-[#0C831F] text-white rounded-lg shadow-2xs overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => dispatch(removeFromCart(prodId))}
                              className="p-1 hover:bg-[#0a6f1a] transition cursor-pointer focus:outline-none"
                              title="Decrease"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-extrabold text-xs px-2 select-none">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => dispatch(addToCart(product))}
                              className="p-1 hover:bg-[#0a6f1a] transition cursor-pointer focus:outline-none"
                              title="Increase"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ── 4. Footer ── */}
      <Footer />

      {/* ── 5. Modals ── */}
      <AddressModal />
      <CartDrawer />
    </div>
  );
}

function CategoryExpandSkeleton() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      <div className="w-full h-20 bg-white border-b border-slate-200/70" />
      <div className="w-[96%] max-w-[1700px] mx-auto my-4 flex-1 bg-white rounded-3xl p-6 border border-slate-200/80 animate-pulse" />
    </div>
  );
}

export default function CategoryExpandPage() {
  return (
    <Suspense fallback={<CategoryExpandSkeleton />}>
      <CategoryExpandContent />
    </Suspense>
  );
}
