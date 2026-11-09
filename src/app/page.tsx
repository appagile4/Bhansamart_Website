"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";

export default function Home() {
  const [cartCount, setCartCount] = useState(0);

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      {/* ── 1. Header Component (90% width with BhansaMart Logo) ── */}
      <Header
        deliveryTime="18 minutes"
        address="O-91, O Pocket, Pocket O, Phas..."
        cartItemCount={cartCount}
        onLoginClick={() => alert("Login clicked")}
        onAddressClick={() => alert("Select Address clicked")}
        onCartClick={() => alert("Cart clicked")}
      />

      {/* ── 2. Main Page Content (90% width) ── */}
      <main className="flex-1 w-[70%] mx-auto pb-12">
        {/* ── Hero Banner with BhansaMart Fresh Groceries Delivered Fast ── */}
        <HeroBanner />
      </main>
    </div>
  );
}
