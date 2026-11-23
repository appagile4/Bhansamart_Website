"use client";

import React, { useEffect, useMemo, useRef } from "react";
import ProductCard from "./ProductCard";
import { useAppDispatch, useAppSelector, useCurrentAddress } from "@/redux/hooks";
import { useCategorySections } from "@/lib/hooks/useCategorySections";
import {
  fetchProducts,
  setSelectedCategory,
  setSelectedSubCategory,
  setSearchQuery,
} from "@/redux/slices/productsSlice";
import { addToCart, removeFromCart } from "@/redux/slices/cartSlice";
import { openAddressModal } from "@/redux/slices/addressSlice";
import { Store, Zap, MapPin, AlertCircle } from "lucide-react";

export default function NearbyProducts() {
  const dispatch = useAppDispatch();
  const currentAddress = useCurrentAddress();
  const { items: cartItems } = useAppSelector((state) => state.cart);
  const { sections, loaded: categoriesLoaded } = useCategorySections();

  const categoryTabs = useMemo(
    () => [
      { label: "All Products", value: "all" },
      ...sections.map((sec) => ({ label: sec.title, value: sec.title })),
    ],
    [sections]
  );
  const {
    items: products,
    loading,
    selectedCategory,
    selectedSubCategory,
    searchQuery,
    eligibleVendorsCount,
    isOutsideDeliveryZone,
  } = useAppSelector((state) => state.products);

  // When a search starts, bring the results into view (on phones they sit below the banner and categories)
  const hadSearch = useRef(false);
  useEffect(() => {
    const has = Boolean(searchQuery.trim());
    if (has && !hadSearch.current) {
      document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    hadSearch.current = has;
  }, [searchQuery]);

  // Re-fetch products when address, category/subCategory or search changes.
  // Search waits for a short typing pause, and a newer request cancels the older one,
  // so a slow response for "mi" can never overwrite the results for "milk".
  useEffect(() => {
    let request: { abort: () => void } | undefined;
    const timer = setTimeout(
      () => {
        request = dispatch(
          fetchProducts({
            lat: currentAddress.lat,
            lng: currentAddress.lng,
            city: currentAddress.city,
            category: selectedCategory,
            subCategory: selectedSubCategory,
            search: searchQuery.trim(),
          })
        );
      },
      searchQuery.trim() ? 250 : 0
    );
    return () => {
      clearTimeout(timer);
      request?.abort();
    };
  }, [
    dispatch,
    currentAddress.lat,
    currentAddress.lng,
    currentAddress.city,
    selectedCategory,
    selectedSubCategory,
    searchQuery,
  ]);

  return (
    <section id="products-section" className="w-full mt-4 sm:mt-6 mb-12 sm:mb-16 scroll-mt-24">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
              {selectedCategory === "all"
                ? "Products Near You"
                : selectedCategory}
            </h2>
            <span className="bg-emerald-100 text-[#0C831F] text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3 fill-[#0C831F]" />
              15-25 Mins
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-[11px] sm:text-xs md:text-sm text-slate-500 mt-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700 truncate max-w-[240px] sm:max-w-xs md:max-w-sm">
                {currentAddress.addressLine && !currentAddress.addressLine.includes("GPS")
                  ? currentAddress.addressLine
                  : "Plato 19, Dwarka Sector 5, New Delhi"}
              </span>
            </div>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1 shrink-0">
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span>
                {eligibleVendorsCount > 0
                  ? `${eligibleVendorsCount} nearby stores delivering live`
                  : "Live Express Catalog"}
              </span>
            </span>
          </div>
        </div>

        {/* Change Address Quick Button */}
        <button
          type="button"
          onClick={() => dispatch(openAddressModal())}
          className="self-start sm:self-auto px-3.5 sm:px-4 py-1.5 sm:py-2 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs sm:text-sm rounded-xl border border-emerald-200/90 transition cursor-pointer flex items-center gap-1.5 focus:outline-none shrink-0 shadow-2xs hover:shadow-xs"
        >
          <MapPin className="w-3.5 h-3.5 text-[#0C831F]" />
          <span>Change Location</span>
        </button>
      </div>

      {/* ── Main Category Filter Tabs ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar -mx-1 px-1 touch-pan-x">
        {!categoriesLoaded ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 h-8 rounded-xl bg-slate-200/70 animate-pulse"
              style={{ width: `${80 + (i % 3) * 25}px` }}
            />
          ))
        ) : (
          categoryTabs.map((tab) => {
            const isActive = selectedCategory.toLowerCase() === tab.value.toLowerCase();
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  dispatch(setSelectedCategory(tab.value));
                  dispatch(setSelectedSubCategory("all"));
                }}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer focus:outline-none select-none ${
                  isActive
                    ? "bg-[#0C831F] text-white shadow-xs"
                    : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80"
                }`}
              >
                {tab.label}
              </button>
            );
          })
        )}
      </div>

      {/* ── Products Grid or Skeletons / Empty State ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5 md:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/60 rounded-2xl p-3 flex flex-col animate-pulse h-64"
            >
              <div className="w-full aspect-square bg-slate-100 rounded-xl mb-3" />
              <div className="h-3 bg-slate-100 rounded-sm w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded-sm w-1/2 mb-4" />
              <div className="mt-auto flex items-center justify-between">
                <div className="h-4 bg-slate-100 rounded-sm w-12" />
                <div className="h-7 bg-slate-100 rounded-lg w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : isOutsideDeliveryZone || products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center max-w-md mx-auto my-6 shadow-xs">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-1.5 break-words">
            {searchQuery.trim() && !isOutsideDeliveryZone
              ? `No results for "${searchQuery.trim()}"`
              : "No Products Found in this Category"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
            {searchQuery.trim() && !isOutsideDeliveryZone
              ? `Nothing ${selectedCategory !== "all" ? `in "${selectedCategory}" ` : ""}matches your search at this delivery location. Try a different word or check the spelling.`
              : selectedCategory !== "all"
              ? `Currently there are no active items listed under "${selectedCategory}${
                  selectedSubCategory !== "all" ? ` > ${selectedSubCategory}` : ""
                }" in this delivery location.`
              : "No active products are currently available in this delivery zone."}
          </p>
          <button
            type="button"
            onClick={() => {
              dispatch(setSelectedCategory("all"));
              dispatch(setSelectedSubCategory("all"));
              dispatch(setSearchQuery(""));
            }}
            className="px-5 py-2.5 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
          >
            Show All Available Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5 md:gap-4">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              quantity={cartItems[product._id]?.quantity || 0}
              onAddToCart={(p) => dispatch(addToCart(p))}
              onRemoveFromCart={(p) => dispatch(removeFromCart(p._id))}
            />
          ))}
        </div>
      )}
    </section>
  );
}
