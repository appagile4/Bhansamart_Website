"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Navigation,
  Search,
  X,
  Check,
  Store,
  MapPin,
  Home,
  Building2,
  Plus,
  Phone,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Compass,
  Clock,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setAddress, closeAddressModal } from "@/redux/slices/addressSlice";
import { useToast } from "@/components/Toast";
import { AddressLocation, PRESET_HUBS } from "@/lib/addressHubs";

export type { AddressLocation };
export { PRESET_HUBS };

interface SavedAddressItem {
  _id: string;
  type: string;
  addressLine: string;
  houseNo?: string;
  street?: string;
  landmark?: string;
  city?: string;
  phone?: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}

const CITIES = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "New Delhi", "Delhi", "Meerut"];

export default function AddressModal() {
  const dispatch = useAppDispatch();
  const { currentAddress, isModalOpen } = useAppSelector((state) => state.address);
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"saved" | "hubs" | "add">("saved");
  const [searchTerm, setSearchTerm] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // New Address Form State
  const [newAddr, setNewAddr] = useState({
    type: "Home" as "Home" | "Work" | "Other",
    houseNo: "",
    addressLine: "",
    landmark: "",
    city: "Kathmandu",
    phone: "",
    isDefault: false,
  });
  const [savingAddr, setSavingAddr] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch user's saved addresses when modal opens
  useEffect(() => {
    if (!isModalOpen) return;

    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("bhansa_token") || localStorage.getItem("token") : null);

    if (activeToken) {
      setLoadingSaved(true);
      fetch("/api/address", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && Array.isArray(data.data)) {
            setSavedAddresses(data.data);
            if (data.data.length > 0) {
              setActiveTab("saved");
            } else {
              setActiveTab("hubs");
            }
          } else {
            setActiveTab("hubs");
          }
        })
        .catch(() => {
          setActiveTab("hubs");
        })
        .finally(() => {
          setLoadingSaved(false);
        });
    } else {
      setActiveTab("hubs");
    }
  }, [isModalOpen, token]);

  if (!isModalOpen) return null;

  const handleClose = () => {
    setErrorMsg("");
    setFormError("");
    setSearchTerm("");
    dispatch(closeAddressModal());
  };

  // ── GPS Geolocation with Street Reverse Geocoding ──
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
            const loc: AddressLocation = {
              name: data.locality || "Current Location",
              addressLine: data.addressLine,
              city: data.city || "Kathmandu",
              lat,
              lng,
              nearbyStoresCount: 8,
            };
            dispatch(setAddress(loc));
            toast.success(`Delivery address set to: ${loc.addressLine}`, "Location Detected");
          } else {
            const fallback: AddressLocation = {
              name: "Current Location",
              addressLine: "Kathmandu Central, Bagmati Province, Nepal",
              city: "Kathmandu",
              lat,
              lng,
              nearbyStoresCount: 11,
            };
            dispatch(setAddress(fallback));
            toast.success(`Delivery address set to: ${fallback.addressLine}`, "Location Detected");
          }
        } catch {
          const fallback: AddressLocation = {
            name: "Current Location",
            addressLine: "Kathmandu Central, Bagmati Province, Nepal",
            city: "Kathmandu",
            lat,
            lng,
            nearbyStoresCount: 11,
          };
          dispatch(setAddress(fallback));
          toast.success(`Delivery address set to: ${fallback.addressLine}`, "Location Detected");
        } finally {
          setDetecting(false);
          handleClose();
        }
      },
      (err) => {
        setDetecting(false);
        console.warn("Geolocation error:", err);
        setErrorMsg("Unable to retrieve your current location. Please select a delivery address below or check location permissions.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // ── Select an Existing Saved Address ──
  const handleSelectSaved = (addr: SavedAddressItem) => {
    const loc: AddressLocation = {
      name: addr.type || "Saved Address",
      addressLine: addr.addressLine,
      city: addr.city || "Kathmandu",
      lat: addr.latitude || 27.7172,
      lng: addr.longitude || 85.324,
      nearbyStoresCount: 8,
    };
    dispatch(setAddress(loc));
    toast.success(`Delivery location updated to: ${addr.addressLine}`, "Address Selected");
    handleClose();
  };

  // ── Select a Verified Hub ──
  const handleSelectHub = (hub: AddressLocation) => {
    dispatch(setAddress(hub));
    toast.success(`Delivery location set to: ${hub.name}`, "Hub Selected");
    handleClose();
  };

  // ── Create & Save a New Address ──
  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newAddr.addressLine.trim()) {
      setFormError("Please enter your street address or area name.");
      return;
    }
    const cleanPhone = newAddr.phone.replace(/[\s-]/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      setFormError("Please enter a valid receiver phone number (e.g. 9801234567).");
      return;
    }

    const constructedAddressLine = `${newAddr.houseNo ? newAddr.houseNo.trim() + ", " : ""}${newAddr.addressLine.trim()}${
      newAddr.landmark ? ", near " + newAddr.landmark.trim() : ""
    }${newAddr.city ? ", " + newAddr.city : ""}`;

    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("bhansa_token") || localStorage.getItem("token") : null);

    setSavingAddr(true);
    try {
      if (activeToken) {
        const res = await fetch("/api/address", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({
            type: newAddr.type,
            addressLine: constructedAddressLine,
            houseNo: newAddr.houseNo.trim(),
            landmark: newAddr.landmark.trim(),
            city: newAddr.city,
            phone: cleanPhone,
            isDefault: newAddr.isDefault,
          }),
        });
        const data = await res.json();
        if (data && data.success && data.data) {
          setSavedAddresses((prev) => [data.data, ...prev]);
        }
      }

      // Set as active address in Redux
      const selectedLoc: AddressLocation = {
        name: newAddr.type,
        addressLine: constructedAddressLine,
        city: newAddr.city,
        lat: 27.7172,
        lng: 85.324,
        nearbyStoresCount: 8,
      };
      dispatch(setAddress(selectedLoc));
      toast.success("New address saved and selected for delivery!", "Address Added");
      handleClose();
    } catch {
      setFormError("Network error saving address. Please try again.");
    } finally {
      setSavingAddr(false);
    }
  };

  // Filter hubs and saved addresses by search query
  const filteredHubs = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return PRESET_HUBS;
    return PRESET_HUBS.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.addressLine.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  const filteredSaved = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return savedAddresses;
    return savedAddresses.filter(
      (a) =>
        a.addressLine.toLowerCase().includes(q) ||
        (a.city && a.city.toLowerCase().includes(q)) ||
        (a.type && a.type.toLowerCase().includes(q)) ||
        (a.landmark && a.landmark.toLowerCase().includes(q))
    );
  }, [savedAddresses, searchTerm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* ── Modal Header ── */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/80 shadow-xs">
              <MapPin className="w-4 h-4 text-[#0C831F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Delivery Location
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Clock className="w-2.5 h-2.5" />
                  15-25 Mins
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Choose where you want your groceries delivered
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Active Delivery Address Pill ── */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0C831F]"></span>
            </span>
            <span className="text-slate-500 font-semibold shrink-0">Active:</span>
            <span className="font-bold text-slate-800 truncate" title={currentAddress.addressLine}>
              {currentAddress.addressLine}
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0 border border-emerald-200/60">
            Live Express
          </span>
        </div>

        {/* ── Search Bar & Detect Current Location ── */}
        <div className="p-4 sm:p-5 pb-2 shrink-0 space-y-3">
          {/* GPS Quick Button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detecting}
            className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50/60 hover:from-emerald-100/80 hover:to-teal-100/80 border border-emerald-200/90 rounded-2xl transition cursor-pointer group shadow-xs select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#0C831F] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Navigation className={`w-4 h-4 ${detecting ? "animate-spin" : ""}`} />
              </div>
              <div className="text-left min-w-0">
                <span className="text-xs sm:text-sm font-black text-slate-900 block truncate group-hover:text-emerald-900">
                  {detecting ? "Detecting exact street location..." : "Use Current Location"}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block truncate">
                  Using device GPS for precise 15-25 min delivery
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 group-hover:translate-x-1 transition-transform shrink-0 pl-2">
              <span>Detect</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {errorMsg && (
            <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search area, landmark, street, or hub..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/10 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "saved"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Saved</span>
              {savedAddresses.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
                  {savedAddresses.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("hubs")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "hubs"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Express Hubs</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("add")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "add"
                  ? "bg-white text-[#0C831F] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New</span>
            </button>
          </div>
        </div>

        {/* ── Modal Scrollable Body ── */}
        <div className="p-4 sm:p-5 pt-1 overflow-y-auto space-y-4 flex-1">
          {/* ═════════ TAB 1: SAVED ADDRESSES ═════════ */}
          {activeTab === "saved" && (
            <div className="space-y-2.5">
              {!isAuthenticated && savedAddresses.length === 0 ? (
                <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#0C831F] mx-auto flex items-center justify-center">
                    <Home className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                    Save your Home &amp; Office addresses
                  </h3>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Log in to quickly switch between your saved delivery addresses or click "+ Add New" above.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("add")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0C831F] hover:bg-[#096417] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Delivery Address</span>
                  </button>
                </div>
              ) : loadingSaved ? (
                <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Loading your address book...</span>
                </div>
              ) : filteredSaved.length === 0 ? (
                <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-slate-700">No saved addresses found</p>
                  <p className="text-[11px] text-slate-500">
                    {searchTerm ? "No addresses match your search." : "You haven't saved any addresses yet."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("add")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0C831F] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Address Now</span>
                  </button>
                </div>
              ) : (
                filteredSaved.map((addr) => {
                  const isSelected =
                    currentAddress.addressLine.toLowerCase().trim() ===
                    addr.addressLine.toLowerCase().trim();

                  const IconComponent =
                    addr.type === "Work" ? Building2 : addr.type === "Home" ? Home : MapPin;

                  return (
                    <div
                      key={addr._id}
                      onClick={() => handleSelectSaved(addr)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer select-none relative group ${
                        isSelected
                          ? "bg-emerald-50/80 border-[#0C831F] ring-2 ring-[#0C831F]/30 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? "bg-[#0C831F] text-white"
                                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-slate-900">
                                {addr.type || "Saved Address"}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                                  Default
                                </span>
                              )}
                              {isSelected && (
                                <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                                  Selected
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                              {addr.addressLine}
                            </p>

                            {addr.phone && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3" />
                                <span>{addr.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-[#0C831F] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="text-[11px] font-bold text-[#0C831F] group-hover:underline shrink-0 mt-1 cursor-pointer"
                          >
                            Deliver Here →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ═════════ TAB 2: EXPRESS HUBS ═════════ */}
          {activeTab === "hubs" && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Verified Delivery Zones (Active Live Stores)
              </span>

              {filteredHubs.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  No delivery hubs match &ldquo;{searchTerm}&rdquo;
                </div>
              ) : (
                filteredHubs.map((hub) => {
                  const isSelected =
                    currentAddress.lat === hub.lat && currentAddress.lng === hub.lng;

                  return (
                    <div
                      key={hub.name}
                      onClick={() => handleSelectHub(hub)}
                      className={`flex items-start justify-between p-3.5 rounded-2xl border transition cursor-pointer select-none group ${
                        isSelected
                          ? "bg-emerald-50/80 border-[#0C831F] ring-2 ring-[#0C831F]/30 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? "bg-[#0C831F] text-white"
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                          }`}
                        >
                          <MapPin className="w-4 h-4" />
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              {hub.name}
                            </span>
                            {hub.nearbyStoresCount ? (
                              <span className="text-[10px] font-bold bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Store className="w-2.5 h-2.5" />
                                {hub.nearbyStoresCount} Live Stores
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{hub.addressLine}</p>
                          <span className="text-[10px] font-semibold text-slate-400 block">
                            City: {hub.city}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#0C831F] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-[#0C831F] group-hover:underline shrink-0 mt-1">
                          Select →
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ═════════ TAB 3: ADD NEW ADDRESS ═════════ */}
          {activeTab === "add" && (
            <form onSubmit={handleSaveNewAddress} className="space-y-3.5 pt-1">
              {formError && (
                <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Address Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Save Address As
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Home", "Work", "Other"] as const).map((t) => {
                    const active = newAddr.type === t;
                    const Icon = t === "Home" ? Home : t === "Work" ? Building2 : MapPin;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewAddr({ ...newAddr, type: t })}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          active
                            ? "bg-[#0C831F] text-white border-[#0C831F] shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flat / House No */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  House / Flat / Block No.
                </label>
                <input
                  type="text"
                  value={newAddr.houseNo}
                  onChange={(e) => setNewAddr({ ...newAddr, houseNo: e.target.value })}
                  placeholder="e.g. Flat 302, Green Valley Apartments"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0C831F]"
                />
              </div>

              {/* Street Address / Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street Address &amp; Area <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAddr.addressLine}
                  onChange={(e) => setNewAddr({ ...newAddr, addressLine: e.target.value })}
                  placeholder="e.g. New Baneshwor Chowk, Ward 10"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0C831F]"
                />
              </div>

              {/* Landmark & City Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    value={newAddr.landmark}
                    onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                    placeholder="e.g. Near Apex College"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0C831F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <select
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0C831F] cursor-pointer"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Receiver Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0C831F]"
                  />
                </div>
              </div>

              {/* Set as Default */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAddr.isDefault}
                  onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                  className="w-4 h-4 text-[#0C831F] rounded border-slate-300 focus:ring-[#0C831F]"
                />
                <span className="text-xs font-medium text-slate-700">
                  Set as my primary delivery address
                </span>
              </label>

              {/* Submit Button */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("saved")}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddr}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#0C831F] hover:bg-[#096417] text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {savingAddr ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <span>Save &amp; Deliver Here</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Express 15-25 min delivery
          </span>
          <span className="text-slate-400">BhansaMart Verified Hubs</span>
        </div>
      </div>
    </div>
  );
}
