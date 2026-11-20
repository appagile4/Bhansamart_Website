"use client";

import ConsoleLogin from "@/components/admin/ConsoleLogin";

/** Staff Admin login — app: (auth)/admin-login.tsx → StaffAdminMain. Reached only by typing /staff_admin. */
export default function StaffAdminLoginPage() {
  return (
    <ConsoleLogin
      cfg={{
        role: "admin",
        dashboardHref: "/staff_admin/dashboard",
        badge: "STAFF ADMIN",
        heading: "Staff Admin Console",
        blurb: "Operations for your assigned stores — orders, products, returns, brand reviews, withdrawals, tickets and the delivery fleet.",
        wrongRoleMessage: "This login is for staff admins only. Super admin accounts sign in through the super admin console.",
      }}
    />
  );
}
