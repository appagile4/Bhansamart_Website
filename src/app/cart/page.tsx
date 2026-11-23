"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressModal from "@/components/AddressModal";
import CartDrawer from "@/components/CartDrawer";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addToCart, removeFromCart, clearCart } from "@/redux/slices/cartSlice";
import { groupCartByVendor, VendorCartGroup } from "@/lib/cartVendorUtils";
import {
  ShoppingCart,
  Clock,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  ArrowRight,
  MapPin,
  ArrowLeft,
  Store,
  Package,
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
      <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0 border border-slate-200/80">
        <Package className="w-6 h-6 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center p-1 shrink-0 overflow-hidden">
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

export default function CartPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, totalCount, totalPrice } = useAppSelector(
    (state) => state.cart
  );
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const cartList = useMemo(() => Object.values(items), [items]);

  // Dynamically group items by Store / Vendor
  const vendorGroups: VendorCartGroup[] = useMemo(() => {
    return groupCartByVendor(cartList);
  }, [cartList]);
  const hasMultipleVendors = vendorGroups.length > 1;

  // Selected vendor filter: defaults to first vendor ID
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>("");

  // Keep selected filter valid if cart changes
  useEffect(() => {
    if (vendorGroups.length > 0) {
      if (
        !selectedVendorFilter ||
        !vendorGroups.some((g) => g.vendorId === selectedVendorFilter)
      ) {
        setSelectedVendorFilter(vendorGroups[0].vendorId);
      }
    }
  }, [vendorGroups, selectedVendorFilter]);

  // Active selected group
  const activeSelectedGroup = useMemo(() => {
    if (!vendorGroups.length) return null;
    return (
      vendorGroups.find((g) => g.vendorId === selectedVendorFilter) ||
      vendorGroups[0]
    );
  }, [vendorGroups, selectedVendorFilter]);

  const handleCheckoutVendor = (vendorId?: string) => {
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
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      <Header />

      <main className="flex-1 w-[94%] sm:w-[92%] md:w-[90%] lg:w-[85%] xl:w-[75%] 2xl:w-[70%] max-w-7xl mx-auto py-5 sm:py-7">
        {/* Top Header / Breadcrumbs */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center justify-center shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Shopping Cart
                {totalCount > 0 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0C831F]">
                    {totalCount} {totalCount === 1 ? "item" : "items"}
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {vendorGroups.length > 1
                  ? `Items from ${vendorGroups.length} partner stores ready for quick delivery`
                  : "Review items in your cart and proceed to delivery"}
              </p>
            </div>
          </div>

          {cartList.length > 0 && (
            <button
              onClick={() => dispatch(clearCart())}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 transition cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Empty Cart State */}
        {cartList.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-slate-200/80 shadow-xs max-w-xl mx-auto my-8">
            <div className="w-16 h-16 bg-emerald-50 text-[#0C831F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-1.5">
              Your cart is empty
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed max-w-md mx-auto">
              Add fresh groceries, fruits, vegetables, and daily staples delivered to your doorstep in 15-25 minutes!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition"
            >
              <span>Start Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* ════════ LEFT COLUMN: Selected Store Cart (8 cols) ════════ */}
            <div className="lg:col-span-8 space-y-4">
              {/* ── STORE CART SELECTOR TABS ── */}
              {hasMultipleVendors && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900">
                          Select Store Cart to Checkout:
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Choose which store you want to checkout. Each store delivers in 15-25 mins!
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      {vendorGroups.length} Stores in Bag
                    </span>
                  </div>

                  {/* Tab Pills for each store */}
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
                    {vendorGroups.map((vg) => {
                      const isSelected = selectedVendorFilter === vg.vendorId;
                      return (
                        <button
                          key={vg.vendorId}
                          type="button"
                          onClick={() => setSelectedVendorFilter(vg.vendorId)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border text-left ${
                            isSelected
                              ? "bg-[#0C831F] text-white border-[#0C831F] shadow-sm ring-2 ring-emerald-400/30"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            <Store className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="leading-tight font-extrabold truncate max-w-[150px] sm:max-w-[200px]">
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
                            <span className="w-2 h-2 rounded-full bg-white shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Store Card */}
              {activeSelectedGroup && (
                <div className="bg-white rounded-2xl border border-emerald-500/80 ring-1 ring-emerald-500/20 transition shadow-2xs overflow-hidden">
                  {/* Store Header */}
                  <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 truncate">
                            {activeSelectedGroup.vendorName}
                          </h3>
                          {hasMultipleVendors && (
                            <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Active Cart
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          {activeSelectedGroup.vendorCity && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{activeSelectedGroup.vendorCity}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[#0C831F] font-semibold">
                            <Clock className="w-3 h-3" />
                            <span>15-25 mins delivery</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCheckoutVendor(activeSelectedGroup.vendorId)}
                      className="bg-[#0C831F] hover:bg-[#0a6f1a] text-white text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
                    >
                      <span>Checkout Store</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Items in this Store */}
                  <div className="p-4 divide-y divide-slate-100">
                    {activeSelectedGroup.items.map(({ product, quantity }) => (
                      <div
                        key={product._id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <CartProductImage product={product} />

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-black text-slate-900">
                                ₹{product.price}
                              </span>
                              {product.originalPrice &&
                                product.originalPrice > product.price && (
                                  <span className="text-[11px] text-slate-400 line-through">
                                    ₹{product.originalPrice}
                                  </span>
                                )}
                              <span className="text-[11px] text-slate-400">
                                • {product.unit || "1 unit"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls & Line Total */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() =>
                                dispatch(removeFromCart(product._id))
                              }
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-rose-600 hover:bg-white rounded transition cursor-pointer"
                              title="Decrease"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center text-xs font-black text-slate-900">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => dispatch(addToCart(product))}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-[#0C831F] hover:bg-white rounded transition cursor-pointer"
                              title="Increase"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-xs sm:text-sm font-black text-slate-900 min-w-12 text-right">
                            ₹{(product.price || 0) * quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Store Card Footer */}
                  <div className="bg-slate-50/70 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">
                        {activeSelectedGroup.itemCount} {activeSelectedGroup.itemCount === 1 ? "item" : "items"}:
                      </span>
                      <span className="font-black text-slate-900">
                        ₹{activeSelectedGroup.subtotal}
                      </span>
                      {activeSelectedGroup.subtotal >= 200 ? (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                          FREE Delivery
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCheckoutVendor(activeSelectedGroup.vendorId)}
                      className="text-[#0C831F] hover:text-[#0a6f1a] font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Checkout Store (₹{activeSelectedGroup.grandTotal})</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ════════ RIGHT COLUMN: Order Summary for Selected Store (4 cols) ════════ */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-36 static">
              {activeSelectedGroup && (
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
                  <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                        Order Summary
                      </h3>
                      <span className="text-xs text-emerald-800 font-bold block truncate max-w-[200px]">
                        {activeSelectedGroup.vendorName}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {activeSelectedGroup.itemCount} items
                    </span>
                  </div>

                  {/* Subtotals for Selected Store */}
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-bold text-slate-900">
                        ₹{activeSelectedGroup.subtotal}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Delivery Fee</span>
                      <span className="font-bold text-slate-900">
                        {activeSelectedGroup.deliveryCharge === 0 ? (
                          <span className="text-emerald-700 font-bold">FREE</span>
                        ) : (
                          `₹${activeSelectedGroup.deliveryCharge}`
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Handling Charge</span>
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

                  {/* Primary Checkout Button */}
                  <button
                    type="button"
                    onClick={() => handleCheckoutVendor(activeSelectedGroup.vendorId)}
                    className="w-full py-3 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-between px-4 cursor-pointer active:scale-[0.99]"
                  >
                    <span className="truncate pr-2">
                      {!isAuthenticated
                        ? "Login to Proceed"
                        : `Checkout ${activeSelectedGroup.vendorName}`}
                    </span>
                    <div className="flex items-center gap-1 font-black shrink-0">
                      <span>₹{activeSelectedGroup.grandTotal}</span>
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </button>

                  {/* Multiple Store Switcher in Summary Card */}
                  {hasMultipleVendors && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Other Store Carts:
                      </span>
                      <div className="space-y-1.5">
                        {vendorGroups
                          .filter((g) => g.vendorId !== activeSelectedGroup.vendorId)
                          .map((group) => (
                            <button
                              key={group.vendorId}
                              type="button"
                              onClick={() => setSelectedVendorFilter(group.vendorId)}
                              className="w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 text-xs transition cursor-pointer border bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-700"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span className="truncate font-semibold max-w-[150px]">
                                  {group.vendorName}
                                </span>
                              </div>
                              <span className="text-[11px] shrink-0 font-extrabold text-slate-900">
                                ₹{group.grandTotal} &rarr;
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Guarantees */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>BhansaMart 15-25 Min Guarantee</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Orders are packed and dispatched directly from individual vendor hubs for peak freshness and superfast arrival.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <AddressModal />
      <CartDrawer />
    </div>
  );
}
