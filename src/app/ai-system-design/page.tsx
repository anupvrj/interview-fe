import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { faqPageJsonLd } from "@/components/marketing-2026/faq-jsonld";
import { SD_FAQ } from "@/components/marketing-2026/system-design-faq";
import { SystemDesignPage } from "@/components/marketing-2026/pages/SystemDesignPage";
import LegacyPage from "./legacy-page";

export default function AiSystemDesignPage() {
  if (!isMarketing2026Enabled()) return <LegacyPage />;
  return (
    <>
      <SystemDesignPage />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(SD_FAQ)) }} />
    </>
  );
}
