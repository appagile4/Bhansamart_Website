import type { AdminVendor } from "./types";

/** Vendor KYC status pill (active is treated as approved, as in the backend) */
export const vendorStatusBadge = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "approved" || s === "active") return { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (s === "rejected") return { label: "Rejected", cls: "bg-red-50 text-red-700 border-red-200" };
  return { label: "Pending KYC", cls: "bg-amber-50 text-amber-700 border-amber-200" };
};

export const storeName = (v: Pick<AdminVendor, "businessDetails" | "userId"> | null | undefined) =>
  v?.businessDetails?.businessName || (v?.userId && typeof v.userId === "object" ? `${v.userId.name}'s Store` : "Store");
