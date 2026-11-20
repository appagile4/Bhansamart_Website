"use client";

import React from "react";
import StaffAlerts from "@/components/admin/StaffAlerts";
import { PageHeader } from "@/components/admin/ui";

// app: staffadminScreens/NotificationsScreen.tsx — operational alerts for the assigned stores
export default function StaffNotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" subtitle="Operational alerts from your assigned stores" />
      <StaffAlerts />
    </>
  );
}
