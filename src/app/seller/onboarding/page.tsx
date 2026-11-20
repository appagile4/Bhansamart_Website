"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ALLOWED_IMAGE_LABEL, IMAGE_ACCEPT, MAX_IMAGE_LABEL, validateImageFile } from "@/lib/imageUpload";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Crosshair,
  LogOut,
  Pencil,
  Shield,
  Sparkles,
  Truck,
  Upload,
  User,
  XCircle,
} from "lucide-react";
import {
  sellerErrorBox,
  sellerHelper,
  sellerInput,
  sellerLabel,
  sellerOutlineBtn,
  sellerPrimaryBtn,
} from "@/components/vendor/sellerUi";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import {
  fetchMyVendorProfile,
  logoutVendor,
  saveVendorSection,
  updateDeliveryRadius,
  uploadVendorLogo,
  VendorProfile,
  VendorSectionName,
  VendorUser,
} from "@/redux/slices/vendorSlice";
import { MAIN_CATEGORY_NAMES } from "@/lib/constants/categories";
import { canAccessSellerDashboard, getVendorStatus } from "@/lib/sellerStatus";

// Same option lists as the app's registration steps (registrationProcess/business-details.tsx)
const BUSINESS_TYPES = ["Proprietorship", "Partnership", "Pvt. Ltd.", "LLP", "Individual"];
const RETAIL_CHANNELS = ["Online Only", "Physical Retail Store", "Both Online & Retail"];
const BRAND_TYPES = ["Own Brand", "Reseller / Distributor", "Local Store"];

// Titles & icons follow the app's ONBOARDING_STEPS (briefcase, user, credit-card, truck, shield, check-circle)
const STEPS = [
  { id: 1, title: "Business Info", shortTitle: "Business", icon: Briefcase },
  { id: 2, title: "Seller Contact", shortTitle: "Seller", icon: User },
  { id: 3, title: "Bank Details", shortTitle: "Bank", icon: CreditCard },
  { id: 4, title: "Shipping & Warehouse", shortTitle: "Shipping", icon: Truck },
  { id: 5, title: "Brand", shortTitle: "Brand", icon: Shield },
  { id: 6, title: "Review & Submit", shortTitle: "Review", icon: CheckCircle2 },
];

const inputClass = sellerInput;

// ─── Small form primitives ───────────────────────────────────────────────

function TextField({
  label,
  value,
  onChange,
  required,
  hint,
  className = "",
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div>
      <label className={sellerLabel}>
        {label}
        {required && <span className="text-red-500"> *</span>}
        <input
          className={`${inputClass} mt-1.5 font-normal ${className}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
      </label>
      {hint && <p className={sellerHelper}>{hint}</p>}
    </div>
  );
}

function Chips({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <span className={sellerLabel}>{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              aria-pressed={active}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                active
                  ? "bg-vendor-dark border-vendor-dark text-white"
                  : "bg-white border-slate-300 text-slate-600 hover:border-vendor-dark hover:text-vendor-dark"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Form state shape ────────────────────────────────────────────────────

interface OnboardingForm {
  business: {
    businessName: string;
    businessType: string;
    gstNumber: string;
    panNumber: string;
    yearEstablished: string;
    numberOfEmployees: string;
    categories: string[];
    retailChannel: string;
  };
  seller: {
    sellerName: string;
    sellerEmail: string;
    sellerPhone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  bank: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    confirmAccountNumber: string;
    ifscCode: string;
    branch: string;
  };
  shipping: {
    warehouseAddress: string;
    city: string;
    state: string;
    pincode: string;
    latitude: string;
    longitude: string;
    deliveryRadiusKm: string;
  };
  brand: {
    brandName: string;
    brandType: string;
    trademarkNumber: string;
    brandWebsite: string;
    brandLogo: string;
  };
}

const noopSubscribe = () => () => {};

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

const formFromProfile = (p: VendorProfile | null, user: VendorUser | null): OnboardingForm => ({
  business: {
    businessName: str(p?.businessDetails?.businessName),
    businessType: str(p?.businessDetails?.businessType) || "Proprietorship",
    gstNumber: str(p?.businessDetails?.gstNumber),
    panNumber: str(p?.businessDetails?.panNumber),
    yearEstablished: str(p?.businessDetails?.yearEstablished),
    numberOfEmployees: str(p?.businessDetails?.numberOfEmployees),
    categories: p?.businessDetails?.categories?.length ? p.businessDetails.categories : [],
    retailChannel: str(p?.businessDetails?.retailChannel) || "Both Online & Retail",
  },
  seller: {
    sellerName: str(p?.sellerDetails?.sellerName || user?.name),
    sellerEmail: str(p?.sellerDetails?.sellerEmail || user?.email),
    sellerPhone: str(p?.sellerDetails?.sellerPhone || user?.phone),
    address: str(p?.sellerDetails?.address),
    city: str(p?.sellerDetails?.city),
    state: str(p?.sellerDetails?.state),
    pincode: str(p?.sellerDetails?.pincode),
  },
  bank: {
    accountHolderName: str(p?.bankDetails?.accountHolderName || p?.sellerDetails?.sellerName),
    bankName: str(p?.bankDetails?.bankName),
    accountNumber: str(p?.bankDetails?.accountNumber),
    confirmAccountNumber: str(p?.bankDetails?.accountNumber),
    ifscCode: str(p?.bankDetails?.ifscCode),
    branch: str(p?.bankDetails?.branch),
  },
  shipping: {
    warehouseAddress: str(p?.shippingLocations?.warehouseAddress || p?.sellerDetails?.address),
    city: str(p?.shippingLocations?.city || p?.sellerDetails?.city),
    state: str(p?.shippingLocations?.state || p?.sellerDetails?.state),
    pincode: str(p?.shippingLocations?.pincode || p?.sellerDetails?.pincode),
    latitude: str(p?.shippingLocations?.latitude),
    longitude: str(p?.shippingLocations?.longitude),
    deliveryRadiusKm: str(p?.deliveryRadiusKm ?? 5),
  },
  brand: {
    brandName: str(p?.brandDetails?.brandName || p?.businessDetails?.businessName),
    brandType: str(p?.brandDetails?.brandType) || "Local Store",
    trademarkNumber: str(p?.brandDetails?.trademarkNumber),
    brandWebsite: str(p?.brandDetails?.brandWebsite),
    brandLogo: str(p?.brandDetails?.brandLogo),
  },
});

// ─── Page ────────────────────────────────────────────────────────────────

export default function SellerOnboardingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vendorState = useVendor();
  const profile = vendorState?.vendorProfile ?? null;
  const vendorUser = vendorState?.vendorUser ?? null;

  // null during SSR / first paint, then whether a vendor session exists in this browser
  const hasToken = useSyncExternalStore(
    noopSubscribe,
    () => Boolean(localStorage.getItem("bhansa_vendor_token")),
    () => null
  );
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OnboardingForm>(() => formFromProfile(null, null));
  const [saving, setSaving] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const hydrated = useRef(false);

  // Auth guard + load the latest vendor document
  useEffect(() => {
    if (hasToken === null) return;
    if (!hasToken) {
      router.replace("/seller");
      return;
    }
    dispatch(fetchMyVendorProfile());
  }, [hasToken, dispatch, router]);

  // Prefill once the profile is available (from cache or the fetch above)
  useEffect(() => {
    if (hydrated.current || !profile) return;
    hydrated.current = true;
    setForm(formFromProfile(profile, vendorUser));
  }, [profile, vendorUser]);

  const set = <S extends keyof OnboardingForm>(section: S, key: keyof OnboardingForm[S]) =>
    (value: OnboardingForm[S][typeof key]) =>
      setForm((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));

  const toggleCategory = (cat: string) =>
    setForm((prev) => {
      const cur = prev.business.categories;
      return {
        ...prev,
        business: {
          ...prev.business,
          categories: cur.includes(cat) ? cur.filter((c) => c !== cat) : [...cur, cat],
        },
      };
    });

  // ── Per-step validation + payload for PUT /vendor/update-section ──
  const buildStep = (): { error?: string; section?: VendorSectionName; data?: Record<string, unknown> } => {
    const { business: b, seller: s, bank: k, shipping: sh, brand: br } = form;
    switch (step) {
      case 1:
        if (!b.businessName.trim()) return { error: "Business name is required." };
        if (!b.categories.length) return { error: "Select at least one category you sell in." };
        return {
          section: "businessDetails",
          data: {
            businessName: b.businessName.trim(),
            businessType: b.businessType,
            gstNumber: b.gstNumber.trim().toUpperCase(),
            panNumber: b.panNumber.trim().toUpperCase(),
            yearEstablished: b.yearEstablished ? Number(b.yearEstablished) : null,
            numberOfEmployees: b.numberOfEmployees ? Number(b.numberOfEmployees) : null,
            categories: b.categories,
            retailChannel: b.retailChannel,
          },
        };
      case 2:
        if (!s.sellerName.trim()) return { error: "Seller name is required." };
        if (!s.sellerPhone.trim()) return { error: "Seller phone is required." };
        if (!s.address.trim() || !s.city.trim() || !s.pincode.trim())
          return { error: "Address, city and pincode are required." };
        return {
          section: "sellerDetails",
          data: {
            sellerName: s.sellerName.trim(),
            sellerEmail: s.sellerEmail.trim(),
            sellerPhone: s.sellerPhone.trim(),
            address: s.address.trim(),
            city: s.city.trim(),
            state: s.state.trim(),
            pincode: s.pincode.trim(),
          },
        };
      case 3:
        if (!k.accountHolderName.trim() || !k.bankName.trim())
          return { error: "Account holder and bank name are required." };
        if (!/^\d{6,20}$/.test(k.accountNumber.trim()))
          return { error: "Enter a valid account number (digits only)." };
        if (k.accountNumber.trim() !== k.confirmAccountNumber.trim())
          return { error: "Account numbers do not match." };
        if (!k.ifscCode.trim()) return { error: "IFSC code is required." };
        return {
          section: "bankDetails",
          data: {
            accountHolderName: k.accountHolderName.trim(),
            bankName: k.bankName.trim(),
            accountNumber: k.accountNumber.trim(),
            ifscCode: k.ifscCode.trim().toUpperCase(),
            branch: k.branch.trim(),
          },
        };
      case 4: {
        if (!sh.warehouseAddress.trim() || !sh.city.trim() || !sh.pincode.trim())
          return { error: "Store address, city and pincode are required." };
        const lat = Number(sh.latitude);
        const lng = Number(sh.longitude);
        if (!sh.latitude || !sh.longitude || isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
          return { error: "Store coordinates are needed so nearby customers can find you. Use “Detect my location”." };
        const radius = Number(sh.deliveryRadiusKm);
        if (isNaN(radius) || radius < 1 || radius > 50)
          return { error: "Delivery radius must be between 1 and 50 km." };
        return {
          section: "shippingLocations",
          data: {
            warehouseAddress: sh.warehouseAddress.trim(),
            city: sh.city.trim(),
            state: sh.state.trim(),
            pincode: sh.pincode.trim(),
            latitude: lat,
            longitude: lng,
          },
        };
      }
      case 5:
        if (!br.brandName.trim()) return { error: "Brand / display name is required." };
        return {
          section: "brandDetails",
          data: {
            brandName: br.brandName.trim(),
            brandType: br.brandType,
            trademarkNumber: br.trademarkNumber.trim(),
            brandWebsite: br.brandWebsite.trim(),
          },
        };
      default:
        return {};
    }
  };

  const handleNext = async () => {
    setStepError(null);
    const { error, section, data } = buildStep();
    if (error) return setStepError(error);
    if (!section || !data) return;

    setSaving(true);
    const result = await dispatch(saveVendorSection({ section, data }));
    if (saveVendorSection.rejected.match(result)) {
      setSaving(false);
      return setStepError((result.payload as string) || "Could not save details.");
    }
    if (step === 4) {
      const radius = await dispatch(updateDeliveryRadius(Number(form.shipping.deliveryRadiusKm)));
      if (updateDeliveryRadius.rejected.match(radius)) {
        setSaving(false);
        return setStepError((radius.payload as string) || "Could not save delivery radius.");
      }
    }
    setSaving(false);
    setStep((s) => Math.min(6, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setStepError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const detectLocation = () => {
    setStepError(null);
    if (!navigator.geolocation) return setStepError("Location is not supported by this browser.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = coords.latitude.toFixed(6);
        const lng = coords.longitude.toFixed(6);
        setForm((prev) => ({ ...prev, shipping: { ...prev.shipping, latitude: lat, longitude: lng } }));
        try {
          const res = await fetch(`/api/address/reverse-geocode?lat=${lat}&lng=${lng}`);
          const geo = await res.json();
          if (geo?.success) {
            setForm((prev) => ({
              ...prev,
              shipping: {
                ...prev.shipping,
                warehouseAddress: prev.shipping.warehouseAddress || geo.addressLine || "",
                city: prev.shipping.city || geo.city || "",
              },
            }));
          }
        } catch {
          /* coordinates are what matter; address can be typed */
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setStepError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow it in your browser or enter coordinates manually."
            : "Could not detect your location. Please try again or enter coordinates manually."
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleLogoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const invalid = validateImageFile(file);
    if (invalid) return setStepError(invalid);
    setStepError(null);
    setLogoUploading(true);
    const result = await dispatch(uploadVendorLogo(file));
    setLogoUploading(false);
    if (uploadVendorLogo.fulfilled.match(result)) {
      set("brand", "brandLogo")(result.payload?.brandDetails?.brandLogo || "");
    } else {
      setStepError((result.payload as string) || "Logo upload failed.");
    }
  };

  const handleLogout = () => {
    dispatch(logoutVendor());
    router.replace("/seller");
  };

  if (!hasToken) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-vendor border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const status = getVendorStatus(profile, vendorUser);
  const dashboardAllowed = canAccessSellerDashboard(profile, vendorUser);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900 flex flex-col">
      {/* Header — app: "Seller Registration Process" top nav with red logout pill */}
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-10">
        <Link href="/" className="relative block w-[132px] h-[40px] overflow-hidden" aria-label="BhansaMart home">
          <Image
            src="/images/seller/vendor-banner-logo.png"
            alt="BhansaMart"
            fill
            sizes="132px"
            className="object-cover"
            priority
          />
        </Link>
        <p className="hidden md:block text-sm font-extrabold text-vendor-dark">Seller Registration Process</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 w-full px-4 md:px-8 lg:px-12 py-6 md:py-10">
        {/* Progress — app: registrationProcess/components/ProgressBar.tsx */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="px-2.5 py-1 rounded-md bg-vendor-soft text-vendor-dark text-[11px] font-extrabold tracking-wide">
              STEP {step} OF {STEPS.length}
            </span>
            <span className="text-[11px] font-bold text-vendor-teal tracking-wide">
              {Math.round((step / STEPS.length) * 100)}% COMPLETED
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mb-4">
            <div
              className="h-full bg-vendor-dark rounded-full transition-all duration-300"
              style={{ width: `${Math.round((step / STEPS.length) * 100)}%` }}
            />
          </div>
          <ol className="grid grid-cols-6 gap-1">
            {STEPS.map(({ id, title, shortTitle, icon: Icon }) => {
              const done = id < step;
              const current = id === step;
              return (
                <li key={id}>
                  <button
                    type="button"
                    disabled={id > step}
                    onClick={() => {
                      setStepError(null);
                      setStep(id);
                    }}
                    title={title}
                    aria-current={current ? "step" : undefined}
                    className="w-full flex flex-col items-center gap-1.5 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span
                      className={`w-8 h-8 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${
                        done
                          ? "bg-vendor-done border-vendor-done text-white"
                          : current
                            ? "bg-vendor-dark border-vendor-dark text-white"
                            : "bg-slate-100 border-slate-300 text-slate-400"
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" strokeWidth={3} /> : <Icon className="w-3.5 h-3.5" />}
                    </span>
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold truncate max-w-full ${
                        current ? "text-vendor-dark" : done ? "text-vendor-done" : "text-slate-400"
                      }`}
                    >
                      <span className="sm:hidden">{shortTitle}</span>
                      <span className="hidden sm:inline">{title}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-8">
          {stepError && (
            <div className={`${sellerErrorBox} mb-5`}>
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{stepError}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <StepHeading title="Business details" subtitle="Tell us about the business behind your store." />
              <TextField label="Business name" required value={form.business.businessName} onChange={set("business", "businessName")} />
              <Chips
                label="Business type"
                options={BUSINESS_TYPES}
                selected={[form.business.businessType]}
                onToggle={set("business", "businessType")}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="GST number" value={form.business.gstNumber} onChange={set("business", "gstNumber")} placeholder="Optional" />
                <TextField label="PAN number" value={form.business.panNumber} onChange={set("business", "panNumber")} placeholder="Optional" />
                <TextField label="Year established" type="number" min={1900} max={2100} value={form.business.yearEstablished} onChange={set("business", "yearEstablished")} />
                <TextField label="Number of employees" type="number" min={0} value={form.business.numberOfEmployees} onChange={set("business", "numberOfEmployees")} />
              </div>
              <Chips label="Categories you sell *" options={MAIN_CATEGORY_NAMES} selected={form.business.categories} onToggle={toggleCategory} />
              <Chips
                label="Retail channel"
                options={RETAIL_CHANNELS}
                selected={[form.business.retailChannel]}
                onToggle={set("business", "retailChannel")}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <StepHeading title="Seller details" subtitle="Who should we contact about this store?" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="Full name" required value={form.seller.sellerName} onChange={set("seller", "sellerName")} autoComplete="name" />
                <TextField label="Phone" required type="tel" value={form.seller.sellerPhone} onChange={set("seller", "sellerPhone")} autoComplete="tel" />
              </div>
              <TextField label="Email" type="email" value={form.seller.sellerEmail} onChange={set("seller", "sellerEmail")} autoComplete="email" />
              <TextField label="Address" required value={form.seller.address} onChange={set("seller", "address")} autoComplete="street-address" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <TextField label="City" required value={form.seller.city} onChange={set("seller", "city")} />
                <TextField label="State" value={form.seller.state} onChange={set("seller", "state")} />
                <TextField label="Pincode" required inputMode="numeric" value={form.seller.pincode} onChange={set("seller", "pincode")} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <StepHeading title="Bank account" subtitle="Your settlements and withdrawals are paid to this account." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="Account holder name" required value={form.bank.accountHolderName} onChange={set("bank", "accountHolderName")} />
                <TextField label="Bank name" required value={form.bank.bankName} onChange={set("bank", "bankName")} />
                <TextField label="Account number" required inputMode="numeric" autoComplete="off" value={form.bank.accountNumber} onChange={(v) => set("bank", "accountNumber")(v.replace(/\D/g, ""))} />
                <TextField label="Confirm account number" required inputMode="numeric" autoComplete="off" value={form.bank.confirmAccountNumber} onChange={(v) => set("bank", "confirmAccountNumber")(v.replace(/\D/g, ""))} onPaste={(e) => e.preventDefault()} hint="Type it again — pasting is disabled" />
                <TextField label="IFSC code" required value={form.bank.ifscCode} onChange={set("bank", "ifscCode")} className="uppercase" />
                <TextField label="Branch" value={form.bank.branch} onChange={set("bank", "branch")} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <StepHeading
                title="Store location & delivery"
                subtitle="Customers within your delivery radius of this location will see your products."
              />
              <div className="w-full sm:w-60">
                <button type="button" onClick={detectLocation} disabled={locating} className={`${sellerOutlineBtn} disabled:opacity-60`}>
                  <Crosshair className={`w-4 h-4 ${locating ? "animate-spin" : ""}`} />
                  {locating ? "Detecting..." : "Detect my location"}
                </button>
              </div>
              <TextField label="Store / warehouse address" required value={form.shipping.warehouseAddress} onChange={set("shipping", "warehouseAddress")} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <TextField label="City" required value={form.shipping.city} onChange={set("shipping", "city")} />
                <TextField label="State" value={form.shipping.state} onChange={set("shipping", "state")} />
                <TextField label="Pincode" required inputMode="numeric" value={form.shipping.pincode} onChange={set("shipping", "pincode")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <TextField label="Latitude" required inputMode="decimal" value={form.shipping.latitude} onChange={set("shipping", "latitude")} />
                <TextField label="Longitude" required inputMode="decimal" value={form.shipping.longitude} onChange={set("shipping", "longitude")} />
                <TextField label="Delivery radius (km)" required type="number" min={1} max={50} value={form.shipping.deliveryRadiusKm} onChange={set("shipping", "deliveryRadiusKm")} hint="Between 1 and 50 km" />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <StepHeading title="Brand" subtitle="How your store appears to customers." />
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border border-slate-300 bg-[#F8FAFC] overflow-hidden flex items-center justify-center shrink-0">
                  {form.brand.brandLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.brand.brandLogo} alt="Store logo" className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="w-48">
                  <label className={sellerOutlineBtn}>
                    <Upload className="w-4 h-4" />
                    {logoUploading ? "Uploading..." : form.brand.brandLogo ? "Change logo" : "Upload logo"}
                    <input type="file" accept={IMAGE_ACCEPT} className="sr-only" disabled={logoUploading} onChange={handleLogoPick} />
                  </label>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {ALLOWED_IMAGE_LABEL} · max {MAX_IMAGE_LABEL}
                  </p>
                </div>
              </div>
              <TextField label="Brand / display name" required value={form.brand.brandName} onChange={set("brand", "brandName")} />
              <Chips label="Brand type" options={BRAND_TYPES} selected={[form.brand.brandType]} onToggle={set("brand", "brandType")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="Trademark number" value={form.brand.trademarkNumber} onChange={set("brand", "trademarkNumber")} placeholder="Optional" />
                <TextField label="Website" type="url" value={form.brand.brandWebsite} onChange={set("brand", "brandWebsite")} placeholder="https://" />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <StatusBanner status={status} remark={profile?.adminRemark} />
              <ReviewBlock title="Business" onEdit={() => setStep(1)} rows={[
                ["Name", form.business.businessName],
                ["Type", form.business.businessType],
                ["GST / PAN", [form.business.gstNumber, form.business.panNumber].filter(Boolean).join(" / ")],
                ["Categories", form.business.categories.join(", ")],
              ]} />
              <ReviewBlock title="Seller" onEdit={() => setStep(2)} rows={[
                ["Name", form.seller.sellerName],
                ["Phone", form.seller.sellerPhone],
                ["Address", [form.seller.address, form.seller.city, form.seller.state, form.seller.pincode].filter(Boolean).join(", ")],
              ]} />
              <ReviewBlock title="Bank" onEdit={() => setStep(3)} rows={[
                ["Account holder", form.bank.accountHolderName],
                ["Bank", [form.bank.bankName, form.bank.branch].filter(Boolean).join(", ")],
                ["Account", form.bank.accountNumber ? `•••• ${form.bank.accountNumber.slice(-4)}` : ""],
                ["IFSC", form.bank.ifscCode],
              ]} />
              <ReviewBlock title="Store location" onEdit={() => setStep(4)} rows={[
                ["Address", [form.shipping.warehouseAddress, form.shipping.city, form.shipping.pincode].filter(Boolean).join(", ")],
                ["Coordinates", form.shipping.latitude ? `${form.shipping.latitude}, ${form.shipping.longitude}` : ""],
                ["Delivery radius", form.shipping.deliveryRadiusKm ? `${form.shipping.deliveryRadiusKm} km` : ""],
              ]} />
              <ReviewBlock title="Brand" onEdit={() => setStep(5)} rows={[
                ["Display name", form.brand.brandName],
                ["Type", form.brand.brandType],
                ["Logo", form.brand.brandLogo ? "Uploaded" : "Not uploaded"],
              ]} />
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="w-28">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1 || saving}
                className={`${sellerOutlineBtn} h-[46px] disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </div>

            {step < 6 ? (
              <div className="w-full max-w-[240px]">
                <button type="button" onClick={handleNext} disabled={saving || logoUploading} className={sellerPrimaryBtn}>
                  {saving ? "Saving..." : "Save & Continue"}
                  {!saving && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            ) : dashboardAllowed ? (
              <div className="w-full max-w-[260px]">
                <button type="button" onClick={() => router.replace("/seller/dashboard")} className={sellerPrimaryBtn}>
                  Go to Seller Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="text-xs font-semibold text-slate-500">
                Dashboard unlocks once your store is approved.
              </span>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── Presentational helpers ──────────────────────────────────────────────

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-extrabold tracking-tight text-vendor-dark">{title}</h2>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

function ReviewBlock({
  title,
  rows,
  onEdit,
}: {
  title: string;
  rows: [string, string][];
  onEdit: () => void;
}) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-extrabold text-vendor-dark">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-bold text-vendor-teal hover:underline cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 text-xs">
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-gray-500 font-semibold">{k}</dt>
            <dd className={`break-words ${v ? "text-gray-900" : "text-gray-400 italic"}`}>{v || "Not provided"}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}

function StatusBanner({ status, remark }: { status: string; remark?: string }) {
  const config =
    status === "approved" || status === "active"
      ? {
          icon: CheckCircle2,
          cls: "bg-green-50 border-green-200 text-green-800",
          title: "Your store is live",
          text: "You can start adding products and accepting orders from your Seller Dashboard.",
        }
      : status === "rejected"
        ? {
            icon: XCircle,
            cls: "bg-red-50 border-red-200 text-red-800",
            title: "Application needs changes",
            text: remark || "Our onboarding team could not verify some details. Please update them and contact support.",
          }
        : {
            icon: Clock,
            cls: "bg-amber-50 border-amber-200 text-amber-800",
            title: "Application under review",
            text: "Our onboarding team is verifying your details. You'll get access to the dashboard once approved.",
          };
  const Icon = config.icon;
  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${config.cls}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-extrabold">{config.title}</p>
        <p className="text-xs mt-0.5 leading-relaxed">{config.text}</p>
      </div>
    </div>
  );
}
