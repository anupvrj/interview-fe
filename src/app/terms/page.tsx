import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { TermsPage } from "@/components/marketing-2026/pages/TermsPage";
import LegacyPage from "./legacy-page";

export default function Terms() {
  if (!isMarketing2026Enabled()) return <LegacyPage />;
  return <TermsPage />;
}
