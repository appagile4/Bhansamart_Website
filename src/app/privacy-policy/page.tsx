"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressModal from "@/components/AddressModal";
import CartDrawer from "@/components/CartDrawer";
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft, Mail, Phone } from "lucide-react";

export default function PrivacyPolicyPage() {
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
          <span className="text-slate-800 font-bold">Privacy Policy</span>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#0C831F]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Last updated: November 2026 • BhansaMart Commerce Private Limited
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed pt-3 border-t border-slate-100">
            Welcome to BhansaMart. We are committed to protecting your personal information and
            your right to privacy. This Privacy Policy describes how we collect, use, store, and
            share your information when you use our website, mobile application, and rapid delivery services.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <span className="w-7 h-7 rounded-xl bg-emerald-100/70 text-emerald-800 text-xs font-black flex items-center justify-center">
                1
              </span>
              <h2>Information We Collect</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We collect personal information necessary to deliver fresh groceries directly to your doorstep in 15-25 minutes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 pl-2">
              <li><strong>Personal Details:</strong> Full name, verified mobile number, and email address.</li>
              <li><strong>Delivery Information:</strong> Precise GPS coordinates (latitude/longitude), delivery address line, house/flat number, landmarks, and city.</li>
              <li><strong>Transactional History:</strong> Order contents, dates, invoice amounts, and chosen payment method (Cash on delivery, Fonepay, or Online payments).</li>
              <li><strong>Technical Data:</strong> Device identifier, operating system version, browser type, and connection logs for fraud prevention.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <span className="w-7 h-7 rounded-xl bg-emerald-100/70 text-emerald-800 text-xs font-black flex items-center justify-center">
                2
              </span>
              <h2>How We Use Your Data</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Your data is strictly utilized to provide and elevate your shopping experience:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 pl-2">
              <li>Dispatching delivery orders to the nearest local dark store/vendor within minutes.</li>
              <li>Providing real-time order tracking and SMS / push notifications regarding rider arrival.</li>
              <li>Processing customer care inquiries, cancellation requests, and instant replacements.</li>
              <li><strong>Zero Data Selling:</strong> We never sell, rent, or trade your personal data with third-party advertisers.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <span className="w-7 h-7 rounded-xl bg-emerald-100/70 text-emerald-800 text-xs font-black flex items-center justify-center">
                3
              </span>
              <h2>Payment &amp; Financial Security</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              All financial transactions are encrypted with bank-grade 256-bit SSL protocols.
              BhansaMart complies with PCI-DSS standards. We do not store raw credit card numbers or CVV codes
              on our servers; all payments are routed through certified, authorized payment gateways.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base sm:text-lg">
              <span className="w-7 h-7 rounded-xl bg-emerald-100/70 text-emerald-800 text-xs font-black flex items-center justify-center">
                4
              </span>
              <h2>Location Data &amp; Live Tracking</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our 15-25 minute express delivery relies on your location to show products stocked in your nearest hub.
              Location coordinates are accessed with your explicit device consent and can be updated or deleted at any time
              through your Profile address settings.
            </p>
          </div>

          {/* Section 5: Grievance Officer */}
          <div className="bg-emerald-50/70 rounded-2xl p-6 sm:p-8 border border-emerald-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-base sm:text-lg">
              <Lock className="w-5 h-5 text-[#0C831F]" />
              <h2>Grievance Officer &amp; Contact</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              If you have any questions or concerns regarding our privacy practices or wish to request data deletion, please contact our designated Grievance Officer:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-800">
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200/60 flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Contact: <strong>9860454545</strong> / <strong>9899668888</strong></span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200/60 flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Email: <strong>support@bhansamart.com</strong></span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <AddressModal />
      <CartDrawer />
    </div>
  );
}
