"use client";

import { SystemDesignHome } from "@/components/dashboard-2026/SystemDesignHome";
import { isDashboard2026Enabled } from "@/components/dashboard-2026/flag";
import LegacySystemDesignDashboardPage from "./legacy-page";

export default function SystemDesignDashboardPage() {
  return isDashboard2026Enabled() ? <SystemDesignHome /> : <LegacySystemDesignDashboardPage />;
}
