"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Minus, Heart, Zap, Store } from "lucide-react";

export interface ProductItem {
  _id: string;
  id?: string;
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  unit?: string;
  category?: string;
  subCategory?: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  stock?: number;
  inStock?: boolean;
  ratingsAverage?: number;
  ratingsCount?: number;
  images?: Array<{ url: string; altText?: string; publicId?: string }>;
  vendor?: {
    _id?: string;
    businessDetails?: {
      businessName?: string;
      city?: string;
      categories?: string | string[];
    };
    sellerDetails?: {
      sellerName?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    shippingLocations?: {
      city?: string;
      warehouseAddress?: string;
      latitude?: number;
      longitude?: number;
    };
  };
}

interface ProductCardProps {
  product: ProductItem;
  quantity?: number;
  onAddToCart?: (product: ProductItem) => void;
  onRemoveFromCart?: (product: ProductItem) => void;
}

export default function ProductCard({
  product,
  quantity = 0,
  onAddToCart,
  onRemoveFromCart,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (product.images && product.images.length > 0 && product.images[0].url) {
      return product.images[0].url;
    }
    return "/images/placeholder-product.png";
  });

  const productId = product._id || product.id || "";
  const productUrl = `/product/${productId}`;

  // Calculate discount percentage
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const vendorName =
    product.vendor?.businessDetails?.businessName ||
    product.vendor?.sellerDetails?.sellerName ||
    "BhansaMart Express Hub";

  return (
    <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 select-none">
      
      {/* ── Top Bar: Discount Badge & Wishlist Heart ── */}
      <div className="relative w-full aspect-square bg-[#F8FAFC] rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2.5">
        {discountPercent ? (
          <span className="absolute top-2 left-2 z-10 bg-[#E23744] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full tracking-tight shadow-xs">
            {discountPercent}% OFF
          </span>
        ) : null}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-red-500 shadow-xs transition-colors focus:outline-none cursor-pointer"
          title="Add to Wishlist"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? "fill-red-500 text-red-500" : "text-slate-400"
            }`}
          />
        </button>

        {/* Product Image Clickable Link */}
        <Link
          href={productUrl}
          className="w-full h-full flex items-center justify-center cursor-pointer"
        >
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => {
              setImgSrc("https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80");
            }}
          />
        </Link>

        {/* Delivery Time Pill (15-25 Mins) */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 shadow-xs border border-slate-100 pointer-events-none">
          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>15-25 MINS</span>
        </div>
      </div>

      {/* ── Product Content ── */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Vendor Tag */}
          <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 mb-1 truncate" title={vendorName}>
            <Store className="w-3 h-3 shrink-0" />
            <span className="truncate">{vendorName}</span>
          </div>

          {/* Product Name Link */}
          <Link href={productUrl} className="block cursor-pointer">
            <h3
              className="text-xs sm:text-[13px] font-semibold text-slate-900 leading-tight line-clamp-2 min-h-[2rem] group-hover:text-emerald-700 transition-colors"
              title={product.name}
            >
              {product.name}
            </h3>
          </Link>

          {/* Unit / Weight */}
          <p className="text-[11px] text-slate-500 font-normal mt-1">
            {product.unit || "1 pack"}
          </p>
        </div>

        {/* ── Price & Add to Cart Row ── */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100">
          <Link href={productUrl} className="flex flex-col cursor-pointer">
            <span className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
              ₹{product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price ? (
              <span className="text-[11px] text-slate-400 line-through font-normal mt-0.5">
                ₹{product.originalPrice}
              </span>
            ) : null}
          </Link>

          {/* Add To Cart Controller */}
          {quantity === 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onAddToCart) onAddToCart(product);
              }}
              className="px-4 py-1.5 bg-[#0C831F] hover:bg-[#0a6f1a] active:scale-95 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer focus:outline-none"
            >
              <span>ADD</span>
            </button>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center bg-[#0C831F] text-white rounded-lg shadow-xs overflow-hidden"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onRemoveFromCart) onRemoveFromCart(product);
                }}
                className="p-1.5 hover:bg-[#0a6f1a] transition cursor-pointer focus:outline-none"
                title="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-extrabold text-xs px-2 select-none">{quantity}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onAddToCart) onAddToCart(product);
                }}
                className="p-1.5 hover:bg-[#0a6f1a] transition cursor-pointer focus:outline-none"
                title="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
