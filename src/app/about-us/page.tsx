import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { AboutPage } from "@/components/marketing-2026/pages/AboutPage";
import LegacyPage from "./legacy-page";

export default function AboutUs() {
  if (!isMarketing2026Enabled()) return <LegacyPage />;
  return <AboutPage />;
}
