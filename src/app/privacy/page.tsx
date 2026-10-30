import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { PrivacyPage } from "@/components/marketing-2026/pages/PrivacyPage";
import LegacyPage from "./legacy-page";

export default function Privacy() {
  if (!isMarketing2026Enabled()) return <LegacyPage />;
  return <PrivacyPage />;
}
