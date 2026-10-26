import { HACKATHON_ADMIN_PATH } from "../config";

export type HackathonAdminTab = "overview" | "submissions" | "launch_event" | "edit";

export function hackathonAdminTabHref(hackathonId: string, tab: HackathonAdminTab): string {
  const base = `${HACKATHON_ADMIN_PATH}/${hackathonId}`;
  if (tab === "submissions") return `${base}/submissions`;
  if (tab === "launch_event") return `${base}/launch-event`;
  if (tab === "edit") return `${base}/edit`;
  return base;
}

export const HACKATHON_ADMIN_TABS: Array<{ tab: HackathonAdminTab; label: string }> = [
  { tab: "overview", label: "Overview" },
  { tab: "submissions", label: "Submissions" },
  { tab: "launch_event", label: "Launch event" },
  { tab: "edit", label: "Edit" },
];
