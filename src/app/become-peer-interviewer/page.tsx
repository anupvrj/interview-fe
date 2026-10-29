import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { faqPageJsonLd } from "@/components/marketing-2026/faq-jsonld";
import { piFaq } from "@/components/marketing-2026/peer-interviewer-faq";
import { getPeerRounds } from "@/components/marketing-2026/peer-rounds";
import { PeerInterviewerPage } from "@/components/marketing-2026/pages/PeerInterviewerPage";
import LegacyPage from "./legacy-page";

export default async function BecomePeerInterviewerPage() {
  if (!isMarketing2026Enabled()) return <LegacyPage />;
  const rounds = await getPeerRounds();
  return (
    <>
      <PeerInterviewerPage rounds={rounds} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(piFaq(rounds))) }} />
    </>
  );
}
