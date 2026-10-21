import { HackathonPageLoader } from "@/features/hackathon/components/HackathonPageLoader";

/** While a hackathon page's code loads (e.g. sign-in → profile → dashboard): the same loader, not a blank page. */
export default function HackathonLoading() {
  return <HackathonPageLoader />;
}
