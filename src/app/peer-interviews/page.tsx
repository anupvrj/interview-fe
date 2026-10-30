import { notFound } from "next/navigation";
import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { faqPageJsonLd } from "@/components/marketing-2026/faq-jsonld";
import { pxFaq } from "@/components/marketing-2026/peer-interviews-faq";
import { getPeerRounds } from "@/components/marketing-2026/peer-rounds";
import { PeerInterviewsPage } from "@/components/marketing-2026/pages/PeerInterviewsPage";

/** New with the 2026 design: there is no legacy version, so the route only exists while the flag is on. */
export default async function PeerInterviewsRoute() {
  if (!isMarketing2026Enabled()) notFound();
  const rounds = await getPeerRounds();
  return (
    <>
      <PeerInterviewsPage rounds={rounds} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(pxFaq(rounds))) }} />
    </>
  );
}
