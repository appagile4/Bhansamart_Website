import type { Metadata } from "next";

// The super admin console is reached only by typing /admin — keep it out of search engines.
export const metadata: Metadata = {
  title: "BhansaMart Super Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
