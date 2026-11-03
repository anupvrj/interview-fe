import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { faqPageJsonLd } from "@/components/marketing-2026/faq-jsonld";
import { RB_FAQ } from "@/components/marketing-2026/resume-builder-faq";
import { ResumeBuilderPage } from "@/components/marketing-2026/pages/ResumeBuilderPage";
import { fetchResumeTemplateAvailabilityOnServer } from "@/lib/resume-template-availability.server";
import LegacyPage from "./legacy-page";

export default async function ResumeBuilderRoutePage() {
  if (!isMarketing2026Enabled()) return <LegacyPage />;
  const templateAvailability = await fetchResumeTemplateAvailabilityOnServer();
  return (
    <>
      <ResumeBuilderPage templateAvailability={templateAvailability} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(RB_FAQ)) }} />
    </>
  );
}
