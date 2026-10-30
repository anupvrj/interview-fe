import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { faqPageJsonLd } from "@/components/marketing-2026/faq-jsonld";
import { RB_FAQ } from "@/components/marketing-2026/resume-builder-faq";
import { ResumeBuilderPage } from "@/components/marketing-2026/pages/ResumeBuilderPage";
import LegacyPage from "./legacy-page";

export default function ResumeBuilderRoutePage() {
  if (!isMarketing2026Enabled()) return <LegacyPage />;
  return (
    <>
      <ResumeBuilderPage />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(RB_FAQ)) }} />
    </>
  );
}
