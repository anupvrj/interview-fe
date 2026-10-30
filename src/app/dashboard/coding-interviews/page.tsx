"use client";

import { CodingHome } from "@/components/dashboard-2026/CodingHome";
import { isDashboard2026Enabled } from "@/components/dashboard-2026/flag";
import LegacyCodingInterviewsPage from "./legacy-page";

export default function CodingInterviewsPage() {
  return isDashboard2026Enabled() ? <CodingHome /> : <LegacyCodingInterviewsPage />;
}
