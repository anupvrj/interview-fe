"use client";

import { InterviewsHome } from "@/components/dashboard-2026/InterviewsHome";
import { isDashboard2026Enabled } from "@/components/dashboard-2026/flag";
import LegacyInterviewsPage from "./legacy-page";

export default function InterviewsPage() {
  return isDashboard2026Enabled() ? <InterviewsHome /> : <LegacyInterviewsPage />;
}
