import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { faqPageJsonLd } from "@/components/marketing-2026/faq-jsonld";
import { HOME_FAQ } from "@/components/marketing-2026/home-faq";
import { HomePage } from "@/components/marketing-2026/pages/HomePage";
import LegacyHomePage from "./legacy-home-page";

export default function RootPage() {
  if (!isMarketing2026Enabled()) return <LegacyHomePage />;
  return (
    <>
      <HomePage />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(HOME_FAQ)) }} />
    </>
  );
}
