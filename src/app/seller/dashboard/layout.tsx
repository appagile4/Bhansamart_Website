import VendorLayout from "@/components/vendor/VendorLayout";

/** Persistent Seller Hub shell (sidebar, header, live socket) for every /seller/dashboard page. */
export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  return <VendorLayout>{children}</VendorLayout>;
}
