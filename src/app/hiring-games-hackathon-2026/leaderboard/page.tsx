import { redirect } from "next/navigation";
import { HACKATHON_SLUG, hackathonLeaderboardPath } from "@/features/hackathon/config";

export default function Hackathon2026LeaderboardAlias() {
  redirect(hackathonLeaderboardPath(HACKATHON_SLUG));
}
