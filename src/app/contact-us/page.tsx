"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressModal from "@/components/AddressModal";
import CartDrawer from "@/components/CartDrawer";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ArrowLeft,
  Headphones,
  User,
  ShieldCheck,
} from "lucide-react";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    orderNumber: "",
    subject: "Order Status / Delivery Query",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate instant ticket dispatch
    setTimeout(() => {
      setSubmitting(false);
      setIsSubmitted(true);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      <Header />

      <main className="flex-1 w-[92%] max-w-5xl mx-auto py-10 sm:py-14">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-emerald-700 flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-bold">Contact Us</span>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#0C831F]">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Contact &amp; Customer Support
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                We are here to help you 7 days a week from 7:00 AM to 11:00 PM
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed pt-3 border-t border-slate-100">
            Have a question about your delivery, an item replacement, or vendor partnerships?
            Reach out via phone, email, or fill out the support form below and our team will get back to you promptly.
          </p>
        </div>

        {/* 2-Column Grid: Contact Information & Interactive Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Quick Contact Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Customer Care Helplines */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <h3>Customer Helplines</h3>
              </div>
              <p className="text-xs text-slate-500">Instant assistance for live orders and delivery queries:</p>
              <div className="space-y-1.5 pt-1 text-xs sm:text-sm font-bold text-emerald-700">
                <a href="tel:9899668888" className="block hover:underline">
                  📞 +91 9899668888
                </a>
                <a href="tel:9899668898" className="block hover:underline">
                  📞 +91 9899668898
                </a>
              </div>
            </div>

            {/* Email Support */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <h3>Email Support</h3>
              </div>
              <p className="text-xs text-slate-500">Send inquiries, invoices, or feedback anytime:</p>
              <div className="pt-1 text-xs sm:text-sm font-bold text-emerald-700">
                <a href="mailto:support@bhansamart.com" className="hover:underline">
                  ✉️ support@bhansamart.com
                </a>
              </div>
            </div>

            {/* Grievance Redressal Card */}
            <div className="bg-emerald-50/70 rounded-2xl p-6 border border-emerald-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm sm:text-base">
                <ShieldCheck className="w-4 h-4 text-[#0C831F]" />
                <h3>Grievance Officer</h3>
              </div>
              <p className="text-xs text-slate-600">
                For escalations or unresolved issues, contact our official Grievance Officer:
              </p>
              <div className="text-xs text-slate-700 space-y-1 pt-1">
                <p><strong>Name:</strong> Ram Bahadur</p>
                <p><strong>Direct Phone:</strong> <a href="tel:9860454545" className="text-emerald-700 font-bold hover:underline">9860454545</a></p>
                <p><strong>Direct Email:</strong> <a href="mailto:Damion_Davis93@hotmail.com" className="text-emerald-700 font-bold hover:underline">Damion_Davis93@hotmail.com</a></p>
              </div>
            </div>

            {/* Operational Hours */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center gap-3 text-xs text-slate-600">
              <Clock className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <p className="font-bold text-slate-800">Support Hours</p>
                <p className="text-slate-500 mt-0.5">7:00 AM – 11:00 PM (Monday to Sunday)</p>
              </div>
            </div>
          </div>

          {/* Right Column: Send Us a Message Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1">
              Send Us a Message
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Fill in the form below and our support executive will respond within 15 minutes.
            </p>

            {isSubmitted ? (
              <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 animate-in fade-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-12 h-12 text-[#0C831F] mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Message Received!</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Thank you for reaching out. Ticket <strong>#BM-TK{Math.floor(1000 + Math.random() * 9000)}</strong> has been opened. We will contact you at <strong>{formData.phone || formData.email}</strong> shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({
                      name: "",
                      email: "",
                      phone: "",
                      orderNumber: "",
                      subject: "Order Status / Delivery Query",
                      message: "",
                    });
                  }}
                  className="mt-5 px-5 py-2 bg-[#0C831F] hover:bg-[#0a6f1a] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Ayushmaan Sharma"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0C831F] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="e.g. 9868686868"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0C831F] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                      placeholder="e.g. name@example.com"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0C831F] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Order Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.orderNumber}
                      onChange={(e) => setFormData((p) => ({ ...p, orderNumber: e.target.value }))}
                      placeholder="e.g. BM-261110-8958"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0C831F] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Subject / Query Category
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0C831F] focus:bg-white transition cursor-pointer"
                  >
                    <option value="Order Status / Delivery Query">Order Status / Delivery Query</option>
                    <option value="Damaged or Missing Item">Damaged or Missing Item</option>
                    <option value="Refund & Return Request">Refund &amp; Return Request</option>
                    <option value="Payment / Billing Issue">Payment / Billing Issue</option>
                    <option value="Vendor / Partner Inquiries">Vendor / Partner Inquiries</option>
                    <option value="Other Feedback">Other Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Message / Query Details *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Describe your issue or question in detail..."
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0C831F] focus:bg-white transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? "Submitting Inquiry..." : "Submit Message"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <AddressModal />
      <CartDrawer />
    </div>
  );
}
