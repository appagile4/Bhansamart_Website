"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { closeCart, addToCart, removeFromCart } from "@/redux/slices/cartSlice";
import { ArrowLeft, Share2, Plus, Minus, Clock, Info, ShoppingBag, ChevronRight } from "lucide-react";

export default function CartDrawer() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, totalCount, totalPrice, isCartOpen } = useAppSelector(
    (state) => state.cart
  );
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isCartOpen) return null;

  const cartList = Object.values(items);
  const deliveryCharge = totalPrice > 200 || totalPrice === 0 ? 0 : 25;
  const handlingCharge = totalPrice > 0 ? 2 : 0;
  const grandTotal = totalPrice + deliveryCharge + handlingCharge;

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

  const handleCheckout = () => {
    dispatch(closeCart());
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* ── Dark Overlay Backdrop ── */}
      <div
        onClick={() => dispatch(closeCart())}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* ── Sliding Panel (Right to Left) ── */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md sm:max-w-lg bg-[#F8FAFC] shadow-2xl flex flex-col justify-between z-50 animate-in slide-in-from-right duration-300 ease-out">
        
        {/* ── Top Bar ── */}
        <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
          <button
            type="button"
            onClick={() => dispatch(closeCart())}
            className="flex items-center gap-2.5 text-slate-900 hover:text-emerald-700 font-extrabold text-base transition focus:outline-none cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-800" strokeWidth={2.4} />
            <span>My Cart</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition focus:outline-none cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>

        {/* ── Scrollable Cart Body ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {cartList.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 my-8 shadow-xs">
              <div className="w-16 h-16 bg-emerald-50 text-[#0C831F] rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Your cart is empty
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 mb-6 max-w-xs mx-auto">
                Explore our fresh vegetables, dairy, snacks, and groceries with fast 15-25 min delivery.
              </p>
              <button
                type="button"
                onClick={() => dispatch(closeCart())}
                className="px-6 py-2.5 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <>
              {/* 1. Delivery Timer Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <Clock className="w-5 h-5 text-slate-800 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                    Delivery in 15-25 minutes
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Shipment of {totalCount} item{totalCount > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* 2. Items List */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs space-y-3.5">
                {cartList.map(({ product, quantity }) => {
                  const imageSrc =
                    product.images && product.images.length > 0 && product.images[0].url
                      ? product.images[0].url
                      : "/images/placeholder-product.png";

                  return (
                    <div
                      key={product._id}
                      className="flex items-center justify-between gap-3 pt-2.5 first:pt-0 pb-2.5 last:pb-0 border-b border-slate-100 last:border-b-0"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-14 h-14 bg-[#F8FAFC] rounded-xl border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80";
                          }}
                        />
                      </div>

                      {/* Title & Unit & Price */}
                      <div className="flex-1 min-w-0 pr-2">
                        <h5
                          className="text-xs font-bold text-slate-900 leading-tight truncate"
                          title={product.name}
                        >
                          {product.name}
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {product.unit || "1 pack"}
                        </p>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 block">
                          ₹{product.price}
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center bg-[#0C831F] text-white rounded-lg shadow-xs overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => dispatch(removeFromCart(product._id))}
                          className="p-1.5 hover:bg-[#0a6f1a] transition cursor-pointer focus:outline-none"
                          title="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-extrabold text-xs px-2.5 select-none">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => dispatch(addToCart(product))}
                          className="p-1.5 hover:bg-[#0a6f1a] transition cursor-pointer focus:outline-none"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3. Bill details Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Bill details
                </h4>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span>Items total</span>
                  </span>
                  <span className="font-medium text-slate-900">₹{totalPrice}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span>Delivery charge</span>
                    <Info className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="font-medium text-slate-900">
                    {deliveryCharge === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      `₹${deliveryCharge}`
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span>Handling charge</span>
                    <Info className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="font-medium text-slate-900">₹{handlingCharge}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>Grand total</span>
                    <Info className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900">
                    ₹{grandTotal}
                  </span>
                </div>
              </div>

              {/* 4. Cancellation Policy Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 mb-1">
                  Cancellation Policy
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Orders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund will be provided, if applicable.
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── Sticky Bottom Checkout Bar ── */}
        {cartList.length > 0 ? (
          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full bg-[#0C831F] hover:bg-[#0a6f1a] active:scale-[0.99] text-white py-3 px-4 rounded-xl shadow-md transition flex items-center justify-between cursor-pointer focus:outline-none"
            >
              <div className="flex flex-col text-left">
                <span className="text-base font-black leading-tight">₹{grandTotal}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                  TOTAL
                </span>
              </div>

              <div className="flex items-center gap-1 font-extrabold text-sm tracking-wide">
                <span>{isAuthenticated ? "Proceed to Pay" : "Login to Proceed"}</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
