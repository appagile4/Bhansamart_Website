import type { Metadata } from "next";

// The staff admin console is reached only by typing /staff_admin — keep it out of search engines.
export const metadata: Metadata = {
  title: "BhansaMart Staff Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function StaffAdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
