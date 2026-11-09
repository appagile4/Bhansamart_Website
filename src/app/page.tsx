"use client";

import React from "react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import CategoryGrid from "@/components/CategoryGrid";
import NearbyProducts from "@/components/NearbyProducts";
import AddressModal from "@/components/AddressModal";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      {/* ── 1. Header Component (90% width with BhansaMart Logo, Redux Auth & Location) ── */}
      <Header />

      {/* ── 2. Main Page Content (70% width) ── */}
      <main className="flex-1 w-[70%] mx-auto pb-16">
        {/* ── Hero Banner with BhansaMart Fresh Groceries Delivered Fast ── */}
        <HeroBanner />

        {/* ── 20-Category Grid from Backend (2 Rows of 10) ── */}
        <CategoryGrid />

        {/* ── Products Delivering to Current Address / Location from Backend ── */}
        <NearbyProducts />
      </main>

      {/* ── 3. Address Selection Modal ── */}
      <AddressModal />
    </div>
  );
}
