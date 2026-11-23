"use client";

import React from "react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import CategoryGrid from "@/components/CategoryGrid";
import NearbyProducts from "@/components/NearbyProducts";
import AddressModal from "@/components/AddressModal";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      {/* ── 1. Header Component (90% width with BhansaMart Logo, Redux Auth & Location) ── */}
      <Header />

      {/* ── 2. Main Page Content (Responsive width from mobile to 2xl desktop) ── */}
      <main className="flex-1 w-[94%] sm:w-[92%] md:w-[90%] lg:w-[85%] xl:w-[75%] 2xl:w-[70%] max-w-7xl mx-auto pb-12 sm:pb-16">
        {/* ── Hero Banner with BhansaMart Fresh Groceries Delivered Fast ── */}
        <HeroBanner />

        {/* ── 20-Category Grid from Backend (2 Rows of 10) ── */}
        <CategoryGrid />

        {/* ── Products Delivering to Current Address / Location from Backend ── */}
        <NearbyProducts />
      </main>

      {/* ── 3. Footer Component ── */}
      <Footer />

      {/* ── 4. Address Selection Modal ── */}
      <AddressModal />

      {/* ── 5. Global Sliding Cart Drawer (Right to Left) ── */}
      <CartDrawer />
    </div>
  );
}
