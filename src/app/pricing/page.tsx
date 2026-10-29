import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { faqPageJsonLd } from "@/components/marketing-2026/faq-jsonld";
import { PricingPage, PRICING_FAQ_ITEMS } from "@/components/marketing-2026/pages/PricingPage";
import LegacyPage from "./legacy-page";

export default function Pricing() {
  if (!isMarketing2026Enabled()) return <LegacyPage />;
  return (
    <>
      <PricingPage />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(PRICING_FAQ_ITEMS)) }} />
    </>
  );
}
