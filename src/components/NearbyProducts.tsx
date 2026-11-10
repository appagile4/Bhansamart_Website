"use client";

import React, { useEffect } from "react";
import ProductCard from "./ProductCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchProducts,
  setSelectedCategory,
  setSelectedSubCategory,
} from "@/redux/slices/productsSlice";
import { addToCart, removeFromCart } from "@/redux/slices/cartSlice";
import { openAddressModal } from "@/redux/slices/addressSlice";
import { Store, Zap, MapPin, AlertCircle } from "lucide-react";

const MAIN_CATEGORY_TABS = [
  { label: "All Products", value: "all" },
  { label: "Grocery & Kitchen", value: "Grocery & Kitchen" },
  { label: "Snacks & Drinks", value: "Snacks & Drinks" },
  { label: "Beauty & Personal Care", value: "Beauty & Personal Care" },
  { label: "Baby", value: "Baby" },
  { label: "School & Stationery", value: "School, Office & Stationery" },
  { label: "Gifting", value: "Gifting" },
];

export default function NearbyProducts() {
  const dispatch = useAppDispatch();
  const { currentAddress } = useAppSelector((state) => state.address);
  const { items: cartItems } = useAppSelector((state) => state.cart);
  const {
    items: products,
    loading,
    selectedCategory,
    selectedSubCategory,
    searchQuery,
    eligibleVendorsCount,
    isOutsideDeliveryZone,
  } = useAppSelector((state) => state.products);

  // Re-fetch products when address or category/subCategory changes
  useEffect(() => {
    dispatch(
      fetchProducts({
        lat: currentAddress.lat,
        lng: currentAddress.lng,
        city: currentAddress.city,
        category: selectedCategory,
        subCategory: selectedSubCategory,
        search: searchQuery,
      })
    );
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
    <section id="products-section" className="w-full mt-6 mb-16 scroll-mt-24">
      {/* ── Section Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {selectedCategory === "all"
                ? "Products Near You"
                : selectedCategory}
            </h2>
            <span className="bg-emerald-100 text-[#0C831F] text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3 fill-[#0C831F]" />
              15-25 Mins
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-700 truncate max-w-sm">
              {currentAddress.addressLine}
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Store className="w-3 h-3" />
              {eligibleVendorsCount > 0
                ? `${eligibleVendorsCount} nearby stores delivering live products`
                : "Live Express Catalog"}
            </span>
          </div>
        </div>

        {/* Change Address Quick Button */}
        <button
          type="button"
          onClick={() => dispatch(openAddressModal())}
          className="self-start md:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 focus:outline-none"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Change Location</span>
        </button>
      </div>

      {/* ── Main Category Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
        {MAIN_CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory.toLowerCase() === tab.value.toLowerCase();
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                dispatch(setSelectedCategory(tab.value));
                dispatch(setSelectedSubCategory("all"));
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer focus:outline-none select-none ${
                isActive
                  ? "bg-[#0C831F] text-white shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Products Grid or Skeletons / Empty State ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
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
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto my-6 shadow-xs">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            No Products Found in this Category
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            {selectedCategory !== "all"
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
            }}
            className="px-5 py-2.5 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Show All Available Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
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
