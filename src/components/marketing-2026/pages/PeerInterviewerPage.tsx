import { Marketing2026Shell } from "../Marketing2026Shell";
import { Nav } from "../nav";
import { Faq, FinalCta, Footer } from "../closing";
import { piFaq } from "../peer-interviewer-faq";
import { PeerRoundsProvider } from "../PeerRoundsProvider";
import type { PeerRound } from "../peer-rounds";
import { MK26_ROUTES } from "../cta";
import { PeerApplyDialogHost } from "../PeerApplyDialogHost";
import { PiEarnings, PiHero, PiProfile, PiSession, PiSteps, PiStickyCta, PiTicker } from "../peer-interviewer";

/** Supply side, one story: you've sat on the panel → how it works → a session → what it's worth → candidates find you. */
export function PeerInterviewerPage({ rounds }: { rounds: PeerRound[] }) {
  return (
    <PeerRoundsProvider rounds={rounds}>
    <Marketing2026Shell>
      <Nav />
      <main>
        <PiHero />
        <PiTicker />
        <PiSteps />
        <PiSession />
        <PiEarnings />
        <PiProfile />
        <Faq items={piFaq(rounds)} title="Before you apply." className="border-[#E7E6F2] bg-[#F8F8FB] py-24 md:py-32" />
        <FinalCta primary="Apply to interview" secondary="Interviewer dashboard" primaryHref={MK26_ROUTES.peerApply} secondaryHref={MK26_ROUTES.peerDashboard} />
      </main>
      <Footer />
      <PiStickyCta />
      <PeerApplyDialogHost />
    </Marketing2026Shell>
    </PeerRoundsProvider>
  );
}
