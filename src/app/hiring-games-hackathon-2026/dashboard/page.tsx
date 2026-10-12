import { redirect } from "next/navigation";
import { hackathonDashboardPath, HACKATHON_SLUG } from "@/features/hackathon/config";

export default function Hackathon2026DashboardAlias() {
  redirect(hackathonDashboardPath(HACKATHON_SLUG));
}
