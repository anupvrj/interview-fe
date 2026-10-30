"use client";

import { AnalyticsHome } from "@/components/dashboard-2026/AnalyticsHome";
import { isDashboard2026Enabled } from "@/components/dashboard-2026/flag";
import LegacyAnalyticsPage from "./legacy-page";

export default function AnalyticsPage() {
  return isDashboard2026Enabled() ? <AnalyticsHome /> : <LegacyAnalyticsPage />;
}
