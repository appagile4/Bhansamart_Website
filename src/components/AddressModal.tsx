"use client";

import React, { useState } from "react";
import { Navigation, Search, X, Check, Store, MapPin } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setAddress, closeAddressModal } from "@/redux/slices/addressSlice";

export interface AddressLocation {
  name: string;
  addressLine: string;
  city: string;
  lat: number;
  lng: number;
  nearbyStoresCount?: number;
}

export const PRESET_HUBS: AddressLocation[] = [
  {
    name: "Dwarka Sector 5 Hub",
    addressLine: "Plato 19, Dwarka Sector 5, New Delhi",
    city: "New Delhi",
    lat: 28.5921,
    lng: 77.046,
    nearbyStoresCount: 4,
  },
  {
    name: "Rohini Sector 24 Hub",
    addressLine: "Pocket 24, Rohini Sector 24, Delhi",
    city: "Delhi",
    lat: 28.7212,
    lng: 77.1038,
    nearbyStoresCount: 3,
  },
  {
    name: "Kathmandu Valley Hub",
    addressLine: "Kathmandu Central, Bagmati Province, Nepal",
    city: "Kathmandu",
    lat: 27.7172,
    lng: 85.324,
    nearbyStoresCount: 11,
  },
  {
    name: "Ganga Nagar Hub",
    addressLine: "Main Market, Ganga Nagar, Meerut",
    city: "Meerut",
    lat: 28.9845,
    lng: 77.7064,
    nearbyStoresCount: 1,
  },
];

export default function AddressModal() {
  const dispatch = useAppDispatch();
  const { currentAddress, isModalOpen } = useAppSelector((state) => state.address);

  const [searchTerm, setSearchTerm] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isModalOpen) return null;

  const handleClose = () => {
    dispatch(closeAddressModal());
  };

  // Handle HTML5 Geolocation API with reverse geocoding to real street address
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }

    setDetecting(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const res = await fetch(`/api/address/reverse-geocode?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          if (data && data.success && data.addressLine) {
            dispatch(
              setAddress({
                name: data.locality || "Current Location",
                addressLine: data.addressLine,
                city: data.city || "Delhi",
                lat,
                lng,
              })
            );
          } else {
            dispatch(
              setAddress({
                name: "Current Location",
                addressLine: "Plato 19, Dwarka Sector 5, New Delhi",
                city: "New Delhi",
                lat,
                lng,
              })
            );
          }
        } catch {
          dispatch(
            setAddress({
              name: "Current Location",
              addressLine: "Plato 19, Dwarka Sector 5, New Delhi",
              city: "New Delhi",
              lat,
              lng,
            })
          );
        } finally {
          setDetecting(false);
          handleClose();
        }
      },
      (err) => {
        setDetecting(false);
        console.warn("Geolocation error:", err);
        setErrorMsg("Unable to retrieve your current location. Please select a delivery address below.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const filteredHubs = PRESET_HUBS.filter(
    (h) =>
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.addressLine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* ── Modal Header ── */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Change Delivery Location</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your address to view nearby stores & instant delivery products
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* 1. Detect Current Location Button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detecting}
            className="w-full flex items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0C831F] text-white flex items-center justify-center shadow-xs">
                <Navigation className={`w-4 h-4 ${detecting ? "animate-spin" : ""}`} />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 block group-hover:text-emerald-900">
                  {detecting ? "Detecting your street address..." : "Use My Current Location"}
                </span>
                <span className="text-[11px] text-slate-500">
                  Deliver to your current location address
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
              Detect →
            </span>
          </button>

          {errorMsg ? (
            <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{errorMsg}</p>
          ) : null}

          {/* 2. Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search delivery area, city, or sector..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* 3. Preset Verified Delivery Hubs */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Verified Delivery Hubs (with Active Stores)
            </span>

            <div className="space-y-2">
              {filteredHubs.map((hub) => {
                const isSelected =
                  currentAddress.lat === hub.lat && currentAddress.lng === hub.lng;

                return (
                  <div
                    key={hub.name}
                    onClick={() => {
                      dispatch(setAddress(hub));
                      handleClose();
                    }}
                    className={`flex items-start justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                      isSelected
                        ? "bg-emerald-50/60 border-[#0C831F] ring-1 ring-[#0C831F]"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-[#0C831F] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {hub.name}
                          </span>
                          {hub.nearbyStoresCount ? (
                            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Store className="w-2.5 h-2.5" />
                              {hub.nearbyStoresCount} Stores
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {hub.addressLine}
                        </p>
                      </div>
                    </div>

                    {isSelected ? (
                      <Check className="w-4 h-4 text-[#0C831F] shrink-0 mt-1" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            Products shown are fetched from approved vendors operating inside your delivery radius.
          </p>
        </div>
      </div>
    </div>
  );
}
