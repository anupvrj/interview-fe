import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { faqPageJsonLd } from "@/components/marketing-2026/faq-jsonld";
import { CR_FAQ } from "@/components/marketing-2026/coding-round-faq";
import { CodingRoundPage } from "@/components/marketing-2026/pages/CodingRoundPage";
import LegacyPage from "./legacy-page";

export default function AiCodingPracticePage() {
  if (!isMarketing2026Enabled()) return <LegacyPage />;
  return (
    <>
      <CodingRoundPage />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(CR_FAQ)) }} />
    </>
  );
}
