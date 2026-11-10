"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  MapPin,
  Clock,
  Power,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Navigation,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  updateDeliveryRadius,
  updateStoreStatus,
  setLocalDeliveryRadius,
} from "@/redux/slices/vendorSlice";
import VendorLayout from "@/components/vendor/VendorLayout";

export default function VendorDeliveryPage() {
  const dispatch = useAppDispatch();
  const vendorState = useAppSelector((state) => state?.vendor);
  const isStoreOpen = vendorState?.isStoreOpen ?? true;
  const deliveryRadiusKm = vendorState?.deliveryRadiusKm ?? 10;
  const vendorProfile = vendorState?.vendorProfile ?? null;

  const [radius, setRadius] = useState(deliveryRadiusKm || 10);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleRadiusChange = (val: number) => {
    setRadius(val);
    dispatch(setLocalDeliveryRadius(val));
  };

  const handleSaveRadius = async () => {
    setSaving(true);
    setSavedSuccess(false);
    await dispatch(updateDeliveryRadius(radius));
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleToggleStore = () => {
    dispatch(updateStoreStatus(!isStoreOpen));
  };

  const warehouseAddress =
    vendorProfile?.shippingLocations?.warehouseAddress ||
    vendorProfile?.sellerDetails?.address ||
    "Central Hub, Meerut / Kathmandu";

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
            <span className="text-gray-500 font-medium">Logistics</span>
            <span>/</span>
            <span className="text-[#0C831F] font-bold">Delivery Management</span>
          </nav>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Delivery & Service Area
          </h1>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-xs font-bold text-green-700 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-[#0C831F]" />
            Delivery service radius updated successfully! Customers within {radius} km can now order.
          </div>
        )}

        {/* ── Store Open / Closed Card ── */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                isStoreOpen
                  ? "bg-green-50 text-[#0C831F]"
                  : "bg-red-50 text-red-600"
              }`}
            >
              <Power className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">
                Store Operating Status
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isStoreOpen
                  ? "Your store is currently OPEN and accepting new customer orders."
                  : "Your store is currently CLOSED. Customer orders are temporarily paused."}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleStore}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isStoreOpen
                ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                : "bg-[#0C831F] hover:bg-[#0A701A] text-white"
            }`}
          >
            {isStoreOpen ? "Pause Orders (Close Store)" : "Open Store Now"}
          </button>
        </div>

        {/* ── Delivery Radius Slider Card ── */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-[#0C831F]" />
                Customer Delivery Radius
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Define the maximum distance around your hub within which orders are eligible for 15-minute quick delivery.
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-[#0C831F]">{radius}</span>
              <span className="text-xs font-bold text-gray-400 ml-1">km</span>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-3">
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={radius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value, 10))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0C831F]"
            />
            <div className="flex justify-between text-[11px] font-bold text-gray-400">
              <span>1 km (Ultra-local)</span>
              <span>10 km (Standard)</span>
              <span>25 km (Maximum Reach)</span>
            </div>
          </div>

          {/* Store Location */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3 text-xs text-gray-600">
            <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">Current Hub Address</p>
              <p className="text-gray-500 mt-0.5">{warehouseAddress}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveRadius}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
            >
              {saving ? "Saving Radius..." : `Set Delivery Radius to ${radius} km`}
            </button>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
