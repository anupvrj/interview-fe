import { redirect } from "next/navigation";
import { hackathonDashboardPath, HACKATHON_SLUG, isHackathonEnabled } from "@/features/hackathon/config";
import { notFound } from "next/navigation";

export default function Hackathon2026DashboardAlias() {
  if (!isHackathonEnabled()) notFound();
  redirect(hackathonDashboardPath(HACKATHON_SLUG));
}
