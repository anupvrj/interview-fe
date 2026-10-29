import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { ContactPage } from "@/components/marketing-2026/pages/ContactPage";
import LegacyPage from "./legacy-page";

export default function Contact() {
  if (!isMarketing2026Enabled()) return <LegacyPage />;
  return <ContactPage />;
}
