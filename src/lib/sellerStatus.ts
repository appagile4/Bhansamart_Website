import type { VendorProfile, VendorUser } from "@/redux/slices/vendorSlice";

/** Vendor statuses that may use the seller dashboard (mirrors app routing in Bhansamart_frontend/src/app/index.tsx). */
const DASHBOARD_STATUSES = ["approved", "active"];

export const getVendorStatus = (
  profile?: VendorProfile | null,
  user?: VendorUser | null
): string => (profile?.status || user?.status || "pending").toLowerCase();

export const canAccessSellerDashboard = (
  profile?: VendorProfile | null,
  user?: VendorUser | null
): boolean => DASHBOARD_STATUSES.includes(getVendorStatus(profile, user));

/** Where a freshly authenticated vendor should land. */
export const getSellerHomeRoute = (
  profile?: VendorProfile | null,
  user?: VendorUser | null
): string =>
  canAccessSellerDashboard(profile, user) ? "/seller/dashboard" : "/seller/onboarding";
