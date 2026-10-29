"use client";

import { PeerHome } from "@/components/dashboard-2026/PeerHome";
import { isDashboard2026Enabled } from "@/components/dashboard-2026/flag";
import LegacyPeerInterviewsLandingPage from "./legacy-page";

export default function PeerInterviewsLandingPage() {
  return isDashboard2026Enabled() ? <PeerHome /> : <LegacyPeerInterviewsLandingPage />;
}
