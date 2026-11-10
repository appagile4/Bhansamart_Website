"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Store,
  MapPin,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Save,
  Phone,
  Mail,
  Building,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchMyVendorProfile,
  updateDeliveryRadius,
} from "@/redux/slices/vendorSlice";
import VendorLayout from "@/components/vendor/VendorLayout";

export default function VendorSettingsPage() {
  const dispatch = useAppDispatch();
  const { vendorProfile, vendorUser, deliveryRadiusKm } = useAppSelector(
    (state) => state.vendor
  );

  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [radius, setRadius] = useState(deliveryRadiusKm || 10);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (vendorProfile) {
      setBusinessName(
        vendorProfile.businessDetails?.businessName || vendorProfile.storeName || ""
      );
      setBusinessEmail(
        vendorProfile.businessDetails?.businessEmail || vendorUser?.email || ""
      );
      setBusinessPhone(
        vendorProfile.businessDetails?.businessPhone || vendorUser?.phone || ""
      );
      setAddress(
        vendorProfile.sellerDetails?.address ||
          vendorProfile.shippingLocations?.warehouseAddress ||
          ""
      );
      setCity(
        vendorProfile.sellerDetails?.city ||
          vendorProfile.shippingLocations?.city ||
          ""
      );
      setPincode(
        vendorProfile.sellerDetails?.pincode ||
          vendorProfile.shippingLocations?.pincode ||
          ""
      );
      setRadius(vendorProfile.deliveryRadiusKm || 10);
    }
  }, [vendorProfile, vendorUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem("bhansa_vendor_token");
      await fetch("/api/vendor/update-section", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          section: "businessDetails",
          data: {
            businessName,
            businessEmail,
            businessPhone,
          },
        }),
      });

      if (radius !== deliveryRadiusKm) {
        await dispatch(updateDeliveryRadius(radius));
      }

      dispatch(fetchMyVendorProfile());
      setSuccessMsg("Store profile and operational settings saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
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
            <span className="text-gray-500 font-medium">Administration</span>
            <span>/</span>
            <span className="text-[#0C831F] font-bold">Store Settings</span>
          </nav>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Store Profile & Configuration
          </h1>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-xs font-bold text-green-700 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-[#0C831F]" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Business Info */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
              <Store className="w-4 h-4 text-[#0C831F]" />
              Store Business Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Store Public Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Store Contact Email
                </label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Store Phone Number
                </label>
                <input
                  type="tel"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Delivery Radius (km)
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value, 10))}
                  className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Location & Dispatch Address */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0C831F]" />
              Store Hub & Dispatch Location
            </h2>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Physical Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop / Warehouse No., Landmark, Area"
                className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  City / Town
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Postal / Pincode
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Payment & UPI QR Configuration */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#0C831F]" />
              Store Payment & UPI Configuration
            </h2>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Store UPI VPA / Handle
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. bhansamart.vendor@okaxis"
                className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Used to generate direct customer and rider handover QR codes.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving Changes..." : "Save Store Settings"}
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
}
