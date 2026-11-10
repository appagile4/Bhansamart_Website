"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressModal from "@/components/AddressModal";
import CartDrawer from "@/components/CartDrawer";
import { ShieldCheck, Lock, KeyRound, CheckCircle, ArrowLeft, ShieldAlert, Smartphone, Database } from "lucide-react";

export default function SecurityPage() {
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
          <span className="text-slate-800 font-bold">Security</span>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#0C831F]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Trust &amp; Security at BhansaMart
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Protecting your account, payments, and personal information at every step
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed pt-3 border-t border-slate-100">
            At BhansaMart, we believe shopping for fresh groceries should be completely worry-free.
            We employ bank-grade encryption, certified payment gateways, and rigorous quality standards
            to ensure that every order is safe, confidential, and tamper-proof.
          </p>
        </div>

        {/* Security Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pillar 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">256-Bit SSL/TLS Encryption</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every request between your device and BhansaMart servers is encrypted using modern TLS 1.3
              and AES-256 protocols. Your session, browsing, and personal data remain protected against interception.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Secure OTP Authentication</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Login and critical account changes are guarded by multi-factor one-time verification codes (OTP)
              delivered directly to your registered mobile number, eliminating password vulnerabilities.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Zero Raw Card Storage</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              BhansaMart strictly complies with RBI / regulatory tokenization guidelines and PCI-DSS Level 1 standards.
              We never store your full card number, CVV, or PIN on our servers.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Tamper-Evident Packaging</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Fresh groceries and household packages are securely sealed at local partner hubs with tamper-evident stickers
              to guarantee hygiene and food safety during transit.
            </p>
          </div>
        </div>

        {/* Security Recommendations Card */}
        <div className="bg-emerald-50/70 rounded-2xl p-6 sm:p-8 border border-emerald-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-base sm:text-lg">
            <KeyRound className="w-5 h-5 text-[#0C831F]" />
            <h2>Security Tips for Customers</h2>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700 list-disc list-inside">
            <li>Never share your BhansaMart login OTP or verification code with anyone, including delivery partners.</li>
            <li>BhansaMart employees will never ask for your banking passwords, UPI PINs, or card CVVs.</li>
            <li>Report suspicious activities or unauthorized orders immediately to our security response desk.</li>
          </ul>
        </div>
      </main>

      <Footer />
      <AddressModal />
      <CartDrawer />
    </div>
  );
}
