"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Gift,
  Copy,
  Check,
  Award,
  Users,
  Percent,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import VendorLayout from "@/components/vendor/VendorLayout";

export default function VendorRewardsPage() {
  const vendorState = useAppSelector((state) => state?.vendor);
  const vendorUser = vendorState?.vendorUser ?? null;
  const vendorProfile = vendorState?.vendorProfile ?? null;
  const [copied, setCopied] = useState(false);

  const referralCode =
    vendorUser?._id?.slice(-6).toUpperCase() || "BHANSA50";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Breadcrumb & Top Header ── */}
        <div>
          <nav className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
            <Link href="/seller/dashboard" className="hover:text-gray-700">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-500 font-medium">Partner Program</span>
            <span>/</span>
            <span className="text-[#0C831F] font-bold">Referral & Rewards</span>
          </nav>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Vendor Rewards & Referral Program
          </h1>
        </div>

        {/* ── Tier Hero Card ── */}
        <div className="bg-gradient-to-tr from-[#0C831F] to-[#25A53B] text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Award className="w-4 h-4 text-amber-300" />
              Gold Merchant Tier
            </span>
            <h2 className="text-2xl font-black">
              Earn ₹1,000 for Every Merchant You Refer
            </h2>
            <p className="text-xs text-green-50 max-w-lg leading-relaxed">
              Invite neighboring store owners and wholesalers to sell on BhansaMart. When they complete their first 10 orders, both of you receive a cash credit bonus directly into your vendor wallet!
            </p>
          </div>

          <div className="relative z-10 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center shrink-0 w-full md:w-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-green-100 block">
              Your Referral Code
            </span>
            <div className="flex items-center justify-center gap-2 mt-2 bg-white text-gray-900 px-4 py-2.5 rounded-xl font-mono font-black text-base">
              <span>{referralCode}</span>
              <button
                onClick={handleCopy}
                className="p-1 hover:text-[#0C831F] transition-colors cursor-pointer"
                title="Copy Code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[#0C831F]" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            {copied && (
              <span className="text-[10px] text-green-200 mt-1 block font-semibold">
                Copied to clipboard!
              </span>
            )}
          </div>
        </div>

        {/* ── Benefits Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-[#0C831F] flex items-center justify-center font-bold mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Merchant Network</h3>
            <p className="text-xs text-gray-500 mt-1">
              Connect with fellow certified merchants in your delivery cluster for shared sourcing.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
              <Percent className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Commission Rebates</h3>
            <p className="text-xs text-gray-500 mt-1">
              Top volume merchants qualify for discounted 2.5% platform commission brackets.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3">
              <Gift className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Priority Rider Dispatch</h3>
            <p className="text-xs text-gray-500 mt-1">
              Gold Tier hubs get instantaneous delivery rider assignment within 90 seconds.
            </p>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
