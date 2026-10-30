"use client";

import { ResumesHome } from "@/components/dashboard-2026/ResumesHome";
import { isDashboard2026Enabled } from "@/components/dashboard-2026/flag";
import LegacyResumesPage from "./legacy-page";

export default function ResumesPage() {
  return isDashboard2026Enabled() ? <ResumesHome /> : <LegacyResumesPage />;
}
