"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressModal from "@/components/AddressModal";
import CartDrawer from "@/components/CartDrawer";
import { FileText, ArrowLeft, CheckCircle2, AlertCircle, ShoppingBag, Truck } from "lucide-react";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      <Header />

      <main className="flex-1 w-[92%] max-w-4xl mx-auto py-10 sm:py-14">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-emerald-700 flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-bold">Terms &amp; Conditions</span>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#0C831F]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Terms &amp; Conditions
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Effective: November 2026 • BhansaMart Commerce Private Limited
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed pt-3 border-t border-slate-100">
            Please read these Terms and Conditions carefully before using the BhansaMart website
            or mobile application. By accessing our platform or placing an order, you agree to be bound
            by these terms.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <span className="w-7 h-7 rounded-xl bg-emerald-100/70 text-emerald-800 text-xs font-black flex items-center justify-center">
                1
              </span>
              <h2>Account Registration &amp; Security</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              To place orders on BhansaMart, you must register using an active mobile number and OTP verification.
              You are responsible for maintaining the confidentiality of your login credentials and for all activities
              under your account. You agree to provide accurate and updated delivery details at all times.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <span className="w-7 h-7 rounded-xl bg-emerald-100/70 text-emerald-800 text-xs font-black flex items-center justify-center">
                2
              </span>
              <h2>Pricing, Invoicing &amp; Product Availability</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              All prices listed on BhansaMart are in Indian Rupees (INR / ₹) and are inclusive of applicable taxes.
              While we strive to ensure absolute accuracy in pricing and inventory, product availability depends on
              real-time local hub stocks. In the rare event an item is out of stock, we will notify you immediately
              and issue a full refund.
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <span className="w-7 h-7 rounded-xl bg-emerald-100/70 text-emerald-800 text-xs font-black flex items-center justify-center">
                3
              </span>
              <h2>15-25 Minute Express Delivery</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              BhansaMart guarantees superfast delivery within 15 to 25 minutes for delivery zones serviced by our local partner hubs.
              Delivery times may occasionally vary due to extreme weather conditions, traffic restrictions, or public holidays.
              You will receive live GPS tracking updates as soon as the rider accepts and departs with your package.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <span className="w-7 h-7 rounded-xl bg-emerald-100/70 text-emerald-800 text-xs font-black flex items-center justify-center">
                4
              </span>
              <h2>Order Cancellation &amp; Doorstep Returns</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>Pre-Dispatch Cancellation:</strong> You can cancel any order free of charge directly from your Profile order details before it leaves the store.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>Quality Guarantee:</strong> Fresh fruits, vegetables, dairy, and grocery items can be inspected at your doorstep. If any item is damaged or substandard, our delivery partner will initiate an instant return or full refund right away.
            </p>
          </div>

          {/* Section 5 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <span className="w-7 h-7 rounded-xl bg-emerald-100/70 text-emerald-800 text-xs font-black flex items-center justify-center">
                5
              </span>
              <h2>Acceptable Use &amp; Intellectual Property</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              All trademarks, logos, content, interface designs, and product catalogs are the exclusive intellectual property
              of BhansaMart Commerce Private Limited. Any unauthorized scraping, duplication, or reproduction is strictly prohibited.
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <AddressModal />
      <CartDrawer />
    </div>
  );
}
