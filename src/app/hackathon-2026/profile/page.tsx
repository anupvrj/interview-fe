import { redirect } from "next/navigation";
import { hackathonProfilePath, HACKATHON_SLUG } from "@/features/hackathon/config";

export default function Hackathon2026ProfileAlias() {
  redirect(hackathonProfilePath(HACKATHON_SLUG));
}
