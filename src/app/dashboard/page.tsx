"use client";

import { CandidateHome } from "@/components/dashboard-2026/CandidateHome";
import { isDashboard2026Enabled } from "@/components/dashboard-2026/flag";
import LegacyDashboardPage from "./legacy-page";

export default function DashboardPage() {
  return isDashboard2026Enabled() ? <CandidateHome /> : <LegacyDashboardPage />;
}
