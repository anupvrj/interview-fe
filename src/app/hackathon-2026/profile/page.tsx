import { redirect, notFound } from "next/navigation";
import { hackathonProfilePath, HACKATHON_SLUG, isHackathonEnabled } from "@/features/hackathon/config";

export default function Hackathon2026ProfileAlias() {
  if (!isHackathonEnabled()) notFound();
  redirect(hackathonProfilePath(HACKATHON_SLUG));
}
