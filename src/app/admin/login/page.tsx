"use client";

import ConsoleLogin from "@/components/admin/ConsoleLogin";

/** Super Admin login — reached only by typing /admin. */
export default function AdminLoginPage() {
  return (
    <ConsoleLogin
      cfg={{
        role: "superadmin",
        dashboardHref: "/admin/dashboard",
        badge: "SUPER ADMIN",
        heading: "Super Admin Console",
        blurb: "Vendors & KYC, catalog moderation, payouts, refunds, delivery fleet and platform configuration — in one place.",
        wrongRoleMessage: "This login is for super admins only. Staff admin accounts sign in through the staff admin console.",
      }}
    />
  );
}
