"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  Store,
  User,
} from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import { clearVendorAlerts, registerVendor } from "@/redux/slices/vendorSlice";
import SellerAuthShell, { VendorPortalBadge } from "@/components/vendor/SellerAuthShell";
import {
  sellerErrorBox,
  sellerInput,
  sellerInputIcon,
  sellerInputWithIcon,
  sellerLabel,
  sellerLink,
  sellerPrimaryBtn,
} from "@/components/vendor/sellerUi";
import { MAIN_CATEGORY_NAMES } from "@/lib/constants/categories";

interface FieldProps {
  id: string;
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function Field({ id, label, icon: Icon, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className={sellerLabel}>
        {label}
      </label>
      <div className="relative">
        <Icon className={sellerInputIcon} />
        {children}
      </div>
    </div>
  );
}

export default function SellerRegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vendorState = useVendor();
  const isLoading = vendorState?.isLoading ?? false;
  const error = vendorState?.error ?? null;

  const [form, setForm] = useState({
    storeName: "",
    ownerName: "",
    email: "",
    phone: "",
    category: MAIN_CATEGORY_NAMES[0] || "Grocery & Kitchen",
    address: "",
    city: "",
    state: "",
    pincode: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // A signed-in vendor has nothing to do here
  useEffect(() => {
    if (localStorage.getItem("bhansa_vendor_token")) router.replace("/seller");
  }, [router]);

  useEffect(() => {
    dispatch(clearVendorAlerts());
  }, [dispatch]);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // Same rules as the app's vendorregister.tsx, plus email/phone format checks
  const validate = (): string | null => {
    if (!form.storeName.trim()) return "Please enter your Store / Business Name.";
    if (!form.ownerName.trim()) return "Please enter the Owner / Seller Full Name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      return "Please enter a valid business email address.";
    if (!/^\+?\d{7,15}$/.test(form.phone.replace(/[\s-]/g, "")))
      return "Please enter a valid phone number.";
    if (form.password.length < 6) return "Password must be at least 6 characters long.";
    if (form.password !== form.confirmPassword) return "Passwords do not match. Please re-enter.";
    if (!agreeTerms) return "Please accept the BhansaMart Vendor Terms & Conditions to proceed.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    setLocalError(problem);
    if (problem) return;

    const result = await dispatch(
      registerVendor({
        name: form.ownerName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        storeName: form.storeName.trim(),
        category: form.category,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
      })
    );

    if (registerVendor.fulfilled.match(result)) {
      // New sellers continue straight into store setup
      router.replace("/seller/onboarding");
    }
  };

  const shownError = localError || error;

  return (
    <SellerAuthShell wide subtitle="Create your vendor account to start selling">
      <div className="mb-6">
        <div className="hidden md:block mb-3">
          <VendorPortalBadge />
        </div>
        <h1 className="text-2xl font-extrabold text-vendor-dark tracking-tight">Vendor Onboarding</h1>
        <p className="text-xs text-slate-500 mt-1">
          Create your seller account. You&apos;ll add store, bank and delivery details next.
        </p>
      </div>

      {shownError && (
        <div className={`${sellerErrorBox} mb-4`}>
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-medium">{shownError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="r-store" label="Store / Business Name" icon={Store}>
            <input id="r-store" className={sellerInputWithIcon} placeholder="e.g. Fresh Daily Mart" value={form.storeName} onChange={update("storeName")} autoComplete="organization" />
          </Field>
          <Field id="r-owner" label="Owner / Seller Full Name" icon={User}>
            <input id="r-owner" className={sellerInputWithIcon} placeholder="e.g. Ramesh Sharma" value={form.ownerName} onChange={update("ownerName")} autoComplete="name" />
          </Field>
          <Field id="r-email" label="Business Email" icon={Mail}>
            <input id="r-email" type="email" className={sellerInputWithIcon} placeholder="vendor@store.com" value={form.email} onChange={update("email")} autoComplete="email" />
          </Field>
          <Field id="r-phone" label="Phone Number" icon={Phone}>
            <input id="r-phone" type="tel" className={sellerInputWithIcon} placeholder="10-digit mobile number" value={form.phone} onChange={update("phone")} autoComplete="tel" />
          </Field>
        </div>

        {/* Category chips — app: CATEGORIES chip row */}
        <div>
          <span className={sellerLabel}>Store Category</span>
          <div className="flex flex-wrap gap-2">
            {MAIN_CATEGORY_NAMES.map((c) => {
              const active = form.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setForm((prev) => ({ ...prev, category: c }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    active
                      ? "bg-vendor-dark border-vendor-dark text-white"
                      : "bg-white border-slate-300 text-slate-600 hover:border-vendor-dark hover:text-vendor-dark"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* app: vendorregister.tsx "3. Location & Warehouse" (optional here — the setup wizard asks again) */}
        <fieldset className="space-y-3">
          <legend className={sellerLabel}>
            Location &amp; Warehouse <span className="font-normal text-slate-400">(optional)</span>
          </legend>
          <Field id="r-address" label="Store / Warehouse Address" icon={MapPin}>
            <input id="r-address" className={sellerInputWithIcon} placeholder="Street, ward, area" value={form.address} onChange={update("address")} autoComplete="street-address" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input aria-label="City" className={sellerInput} placeholder="City" value={form.city} onChange={update("city")} autoComplete="address-level2" />
            <input aria-label="State" className={sellerInput} placeholder="State" value={form.state} onChange={update("state")} autoComplete="address-level1" />
            <input aria-label="Pincode / Postal" className={sellerInput} placeholder="Pincode / Postal" inputMode="numeric" value={form.pincode} onChange={update("pincode")} autoComplete="postal-code" />
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="r-pass" label="Create Password" icon={Lock}>
            <input
              id="r-pass"
              type={showPassword ? "text" : "password"}
              className={`${sellerInputWithIcon} pr-10`}
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={update("password")}
              autoComplete="new-password"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </Field>
          <Field id="r-confirm" label="Confirm Password" icon={Lock}>
            <input
              id="r-confirm"
              type={showPassword ? "text" : "password"}
              className={sellerInputWithIcon}
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="flex items-start gap-2 text-xs text-slate-600 pt-1">
          <button
            type="button"
            onClick={() => setAgreeTerms((v) => !v)}
            aria-pressed={agreeTerms}
            aria-label="Accept seller terms"
            className={`mt-0.5 w-4 h-4 rounded border-[1.5px] flex items-center justify-center shrink-0 cursor-pointer ${
              agreeTerms ? "bg-vendor-dark border-vendor-dark" : "bg-white border-slate-400"
            }`}
          >
            {agreeTerms && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </button>
          <span>
            I agree to the BhansaMart{" "}
            <Link href="/terms-and-conditions" className={sellerLink}>
              Vendor Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className={sellerLink}>
              Privacy Policy
            </Link>
            .
          </span>
        </div>

        <button type="submit" disabled={isLoading} className={sellerPrimaryBtn}>
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Create Vendor Account"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-600">
        Already have a vendor account?{" "}
        <Link href="/seller" className="font-bold text-vendor-dark hover:underline">
          Login
        </Link>
      </p>
    </SellerAuthShell>
  );
}
