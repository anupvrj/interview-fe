import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { faqPageJsonLd } from "@/components/marketing-2026/faq-jsonld";
import { MI_FAQ } from "@/components/marketing-2026/mock-interview-faq";
import { MockInterviewPage } from "@/components/marketing-2026/pages/MockInterviewPage";
import LegacyPage from "./legacy-page";

export default function InterviewCoachPage() {
  if (!isMarketing2026Enabled()) return <LegacyPage />;
  return (
    <>
      <MockInterviewPage />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(MI_FAQ)) }} />
    </>
  );
}
