"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressModal from "@/components/AddressModal";
import CartDrawer from "@/components/CartDrawer";
import { HelpCircle, ChevronDown, ChevronUp, Search, ArrowLeft, MessageSquare, PhoneCall } from "lucide-react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  subtitle?: string;
  points: string[];
}

const FAQ_LIST: FAQItem[] = [
  {
    id: "faq-1",
    category: "Orders & Tracking",
    question: "How can I track my order?",
    subtitle: "Tracking your order is easy and real-time!",
    points: [
      "Navigate to your Profile and click on the 'My Orders' tab.",
      "Locate your active order and click 'Track Order'.",
      "Follow our 5-stage live progress bar (Placed → Accepted → Packing → Out for Delivery → Delivered) and view estimated rider arrival time in 15-25 minutes.",
    ],
  },
  {
    id: "faq-2",
    category: "Orders & Tracking",
    question: "What happens if an item I ordered is out of stock?",
    subtitle: "Don't worry, your money and items are 100% protected!",
    points: [
      "If a fresh item is out of stock at your local hub, we will notify you before packing.",
      "You will receive an automatic instant refund to your original payment method, or zero charge for COD.",
      "Our store team will provide verified fresh alternatives if preferred.",
    ],
  },
  {
    id: "faq-3",
    category: "Delivery",
    question: "Can I schedule a delivery for later?",
    subtitle: "BhansaMart is designed for rapid instant fulfillment:",
    points: [
      "We specialize in superfast 15-25 minute express delivery directly upon order placement.",
      "Once an order is confirmed, our local hub immediately packs and dispatches with the nearest rider.",
      "Delivery timing depends slightly on distance, road traffic, and local weather conditions.",
    ],
  },
  {
    id: "faq-4",
    category: "Coupons & Discounts",
    question: "How do I apply a discount or promo code?",
    subtitle: "Using a promo code is simple and quick:",
    points: [
      "Add fresh groceries or daily items to your cart.",
      "Open your Sliding Cart or proceed to the Checkout page.",
      "Enter your valid coupon code in the Promo Code field and click Apply to enjoy instant savings.",
    ],
  },
  {
    id: "faq-5",
    category: "Payments",
    question: "What payment options do you accept?",
    subtitle: "We support safe and convenient payment choices:",
    points: [
      "Cash on Delivery (COD) at your doorstep with zero pre-payment.",
      "Fonepay QR scan upon delivery or checkout.",
      "Major Credit / Debit Cards & UPI payments with 256-bit bank-grade encryption.",
    ],
  },
  {
    id: "faq-6",
    category: "Cancellations & Returns",
    question: "Can I cancel an order after placing it?",
    subtitle: "Yes, pre-dispatch cancellations are completely free:",
    points: [
      "Go to Profile > My Orders.",
      "Click the 'Cancel Order' button beside your active order (available during Placed, Accepted, or Packing stages).",
      "Select your reason, confirm cancellation, and any dispatch will be halted immediately.",
    ],
  },
  {
    id: "faq-7",
    category: "Quality",
    question: "What if I receive damaged or unsatisfactory vegetables?",
    subtitle: "BhansaMart Doorstep Guarantee:",
    points: [
      "You can inspect all fresh vegetables, fruits, and dairy products at doorstep upon delivery.",
      "If any item does not meet your quality expectations, you can return it directly to the delivery partner.",
      "A replacement or refund will be issued immediately with zero hassle.",
    ],
  },
];

export default function FAQsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    "faq-1": true,
    "faq-2": true,
  });

  const toggleFAQ = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFAQs = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_LIST;
    const q = searchQuery.toLowerCase();
    return FAQ_LIST.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        (f.subtitle && f.subtitle.toLowerCase().includes(q)) ||
        f.points.some((p) => p.toLowerCase().includes(q))
    );
  }, [searchQuery]);

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
          <span className="text-slate-800 font-bold">Frequently Asked Questions</span>
        </div>

        {/* Hero Card with Search */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#0C831F]">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Help &amp; FAQs
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Have questions about orders, 15-25 min delivery, or payments? We have answers.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative mt-6">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics (e.g. tracking, cancellation, out of stock, payments)..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0C831F] focus:bg-white transition"
            />
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-500 text-xs">
              No matching questions found for &quot;{searchQuery}&quot;. Please contact customer care.
            </div>
          ) : (
            filteredFAQs.map((faq) => {
              const isOpen = !!openIds[faq.id];
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5 inline-block">
                        {faq.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                        {faq.question}
                      </h3>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-6 sm:px-6 sm:pb-6 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100 bg-slate-50/40">
                      {faq.subtitle && (
                        <p className="font-semibold text-slate-800 mb-2">{faq.subtitle}</p>
                      )}
                      <ul className="space-y-1.5 list-disc list-inside text-slate-600 pl-1">
                        {faq.points.map((pt, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Need Help Footer Banner */}
        <div className="mt-8 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base sm:text-lg font-bold">Still have questions?</h4>
            <p className="text-xs text-emerald-200 mt-0.5">
              Our 24/7 Customer Support and Grievance Team is always ready to assist you.
            </p>
          </div>
          <Link
            href="/contact-us"
            className="px-5 py-2.5 bg-white text-[#0C831F] font-bold text-xs rounded-xl hover:bg-emerald-50 transition shadow-xs text-center shrink-0"
          >
            Contact Customer Support
          </Link>
        </div>
      </main>

      <Footer />
      <AddressModal />
      <CartDrawer />
    </div>
  );
}
