"use client";

import { IxReportHome } from "@/components/dashboard-2026/IxReportHome";
import { isDashboard2026Enabled } from "@/components/dashboard-2026/flag";
import LegacyIxReportPage from "./legacy-page";

export default function IxReportPage() {
  return isDashboard2026Enabled() ? <IxReportHome /> : <LegacyIxReportPage />;
}
