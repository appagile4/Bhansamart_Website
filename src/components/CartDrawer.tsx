"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { closeCart, addToCart, removeFromCart } from "@/redux/slices/cartSlice";
import { groupCartByVendor, VendorCartGroup } from "@/lib/cartVendorUtils";
import {
  ArrowLeft,
  Share2,
  Plus,
  Minus,
  Info,
  ShoppingBag,
  ChevronRight,
  Package,
  Zap,
  Store,
} from "lucide-react";

/** Safe image resolver for cart products */
const getProductImg = (product: any): string => {
  if (!product) return "";
  if (typeof product.imageUrl === "string" && product.imageUrl.trim()) {
    return product.imageUrl;
  }
  if (typeof product.image === "string" && product.image.trim()) {
    return product.image;
  }
  if (product.image && typeof product.image === "object" && product.image.url) {
    return product.image.url;
  }
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    if (typeof first === "string" && first.trim()) return first;
    if (first && typeof first === "object" && first.url) return first.url;
  }
  return "";
};

/** Robust, flicker-free cart product image with non-looping SVG fallback */
function CartProductImage({ product }: { product: any }) {
  const [hasError, setHasError] = useState(false);
  const src = getProductImg(product);

  if (!src || hasError) {
    return (
      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0 border border-slate-200/80">
        <Package className="w-5 h-5 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
      <img
        src={src}
        alt={product?.name || "Product"}
        className="w-full h-full object-contain"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export default function CartDrawer() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, totalCount, totalPrice, isCartOpen } = useAppSelector(
    (state) => state.cart
  );
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const cartList = useMemo(() => Object.values(items), [items]);
  const vendorGroups: VendorCartGroup[] = useMemo(
    () => groupCartByVendor(cartList),
    [cartList]
  );
  const hasMultipleVendors = vendorGroups.length > 1;

  // Selected vendor tab: default to first vendor ID
  const [selectedVendorTab, setSelectedVendorTab] = useState<string>("");

  // Keep selected tab valid if cart items change
  useEffect(() => {
    if (vendorGroups.length > 0) {
      if (
        !selectedVendorTab ||
        !vendorGroups.some((vg) => vg.vendorId === selectedVendorTab)
      ) {
        setSelectedVendorTab(vendorGroups[0].vendorId);
      }
    }
  }, [vendorGroups, selectedVendorTab]);

  // Active vendor cart group (whichever vendor is currently selected)
  const activeSelectedGroup = useMemo(() => {
    if (!vendorGroups.length) return null;
    return (
      vendorGroups.find((vg) => vg.vendorId === selectedVendorTab) ||
      vendorGroups[0]
    );
  }, [vendorGroups, selectedVendorTab]);

  if (!isCartOpen) return null;

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "My BhansaMart Cart",
          text: `Check out my cart on BhansaMart with ${totalCount} items!`,
          url: window.location.href,
        });
      } catch {}
    } else {
      alert("Cart link copied to clipboard!");
    }
  };

  const handleCheckout = (vendorId?: string) => {
    dispatch(closeCart());
    const targetVendor = vendorId || activeSelectedGroup?.vendorId;
    const query = targetVendor
      ? `?vendorId=${encodeURIComponent(targetVendor)}`
      : "";
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/checkout${query}`)}`);
    } else {
      router.push(`/checkout${query}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-200">
      {/* ── Dark Overlay Backdrop ── */}
      <div
        onClick={() => dispatch(closeCart())}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* ── Sliding Panel ── */}
      <div className="fixed top-0 right-0 h-full w-full sm:max-w-md md:max-w-lg bg-[#F8FAFC] shadow-2xl flex flex-col justify-between z-50 animate-in slide-in-from-right duration-300 ease-out">
        {/* ── Top Bar ── */}
        <div className="bg-white px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
          <button
            type="button"
            onClick={() => dispatch(closeCart())}
            className="flex items-center gap-2 text-slate-900 hover:text-emerald-700 font-extrabold text-sm sm:text-base transition focus:outline-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-800" strokeWidth={2.4} />
            <span>My Cart ({totalCount})</span>
          </button>

          <div className="flex items-center gap-1.5">
            <Link
              href="/cart"
              onClick={() => dispatch(closeCart())}
              className="text-xs font-bold text-slate-600 hover:text-[#0C831F] hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-200 transition"
              title="Open full cart page"
            >
              Full Page
            </Link>
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition focus:outline-none cursor-pointer"
              title="Share Cart"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Cart Body ── */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
          {cartList.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 my-8 shadow-xs">
              <div className="w-16 h-16 bg-emerald-50 text-[#0C831F] rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Your cart is empty
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 mb-6 max-w-xs mx-auto leading-relaxed">
                Add fresh groceries, fruits, vegetables, and snacks for 15-25 min delivery.
              </p>
              <button
                type="button"
                onClick={() => dispatch(closeCart())}
                className="px-6 py-2.5 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {/* ── STORE TABS: SELECT ONE TO CHECKOUT ── */}
              {hasMultipleVendors && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-emerald-700" />
                      Select Store Cart to Checkout:
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      {vendorGroups.length} Stores
                    </span>
                  </div>

                  {/* Clean Tab Pills for each store */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
                    {vendorGroups.map((vg) => {
                      const isSelected = selectedVendorTab === vg.vendorId;
                      return (
                        <button
                          key={vg.vendorId}
                          type="button"
                          onClick={() => setSelectedVendorTab(vg.vendorId)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border text-left ${
                            isSelected
                              ? "bg-[#0C831F] text-white border-[#0C831F] shadow-sm ring-2 ring-emerald-400/30"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <Store
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? "text-white" : "text-emerald-700"
                            }`}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="leading-tight font-extrabold truncate max-w-[130px] sm:max-w-[160px]">
                              {vg.vendorName}
                            </span>
                            <span
                              className={`text-[10px] leading-tight ${
                                isSelected ? "text-emerald-100" : "text-slate-500"
                              }`}
                            >
                              {vg.itemCount} {vg.itemCount === 1 ? "item" : "items"} • ₹{vg.grandTotal}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── SELECTED STORE CART ITEMS ── */}
              {activeSelectedGroup && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  {/* Store Header */}
                  <div className="bg-slate-50/90 px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <Store className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-black text-slate-900 truncate">
                          {activeSelectedGroup.vendorName}
                        </h5>
                        {activeSelectedGroup.vendorCity && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {activeSelectedGroup.vendorCity}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                      <Zap className="w-2.5 h-2.5 fill-emerald-600" />
                      15-25 Mins Express
                    </span>
                  </div>

                  {/* Items in this store */}
                  <div className="p-3 divide-y divide-slate-100">
                    {activeSelectedGroup.items.map(({ product, quantity }) => (
                      <div
                        key={product._id}
                        className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5"
                      >
                        <CartProductImage product={product} />

                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400">
                              {product.unit || "1 unit"}
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              ₹{product.price}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => dispatch(removeFromCart(product._id))}
                            className="w-6 h-6 flex items-center justify-center text-slate-700 hover:text-rose-600 hover:bg-white rounded transition cursor-pointer"
                            title="Decrease"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-black text-slate-900">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => dispatch(addToCart(product))}
                            className="w-6 h-6 flex items-center justify-center text-slate-700 hover:text-[#0C831F] hover:bg-white rounded transition cursor-pointer"
                            title="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Store Subtotal Footer */}
                  <div className="bg-slate-50/70 px-3.5 py-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Store Subtotal ({activeSelectedGroup.itemCount} items)
                    </span>
                    <span className="font-extrabold text-slate-900">
                      ₹{activeSelectedGroup.subtotal}
                    </span>
                  </div>
                </div>
              )}

              {/* ── BILL DETAILS FOR SELECTED STORE ── */}
              {activeSelectedGroup && (
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                      Bill Summary ({activeSelectedGroup.vendorName})
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Taxes Included
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Items subtotal</span>
                    <span className="font-bold text-slate-900">
                      ₹{activeSelectedGroup.subtotal}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <span>Delivery fee</span>
                      <Info className="w-3 h-3 text-slate-400" />
                    </span>
                    <span className="font-bold text-slate-900">
                      {activeSelectedGroup.deliveryCharge === 0 ? (
                        <span className="text-emerald-700">FREE</span>
                      ) : (
                        `₹${activeSelectedGroup.deliveryCharge}`
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Handling charge</span>
                    <span className="font-bold text-slate-900">
                      ₹{activeSelectedGroup.handlingCharge}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
                    <span className="font-black text-slate-900">
                      Store Total
                    </span>
                    <span className="font-black text-base text-slate-900">
                      ₹{activeSelectedGroup.grandTotal}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── STICKY BOTTOM CHECKOUT ACTION ── */}
        {cartList.length > 0 && activeSelectedGroup ? (
          <div className="p-3.5 bg-white border-t border-slate-200 shrink-0 space-y-1.5">
            <button
              type="button"
              onClick={() => handleCheckout(activeSelectedGroup.vendorId)}
              className="w-full bg-[#0C831F] hover:bg-[#0a6f1a] active:scale-[0.99] text-white py-3 px-4 rounded-xl shadow-md transition flex items-center justify-between cursor-pointer focus:outline-none"
            >
              <div className="flex flex-col text-left min-w-0 pr-2">
                <span className="text-base sm:text-lg font-black leading-tight">
                  ₹{activeSelectedGroup.grandTotal}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 truncate">
                  CHECKOUT • {activeSelectedGroup.vendorName}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-extrabold text-xs sm:text-sm tracking-wide shrink-0">
                <span>
                  {!isAuthenticated
                    ? "Login to Proceed"
                    : `Checkout from ${activeSelectedGroup.vendorName}`}
                </span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </button>

            {hasMultipleVendors && (
              <p className="text-[10px] text-center text-slate-500">
                Ready to order from {activeSelectedGroup.vendorName}. Tap the other store tab above anytime to checkout.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
