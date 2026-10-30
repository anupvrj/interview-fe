import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { RefundPage } from "@/components/marketing-2026/pages/RefundPage";
import LegacyPage from "./legacy-page";

export default function Refund() {
  if (!isMarketing2026Enabled()) return <LegacyPage />;
  return <RefundPage />;
}
