import { Marketing2026Shell } from "../Marketing2026Shell";
import { Nav } from "../nav";
import { Faq, FinalCta, Footer } from "../closing";
import { pxFaq } from "../peer-interviews-faq";
import { PeerRoundsProvider } from "../PeerRoundsProvider";
import type { PeerRound } from "../peer-rounds";
import { MK26_ROUTES } from "../cta";
import { PxHero, PxMemory, PxRounds, PxSession, PxStickyCta, PxTicker, PxWhy } from "../peer-interviews";

/** Candidate side, one story: find someone who's sat on the panel → why a person → a peer round, start to finish → rounds & prices → one memory. */
export function PeerInterviewsPage({ rounds }: { rounds: PeerRound[] }) {
  return (
    <PeerRoundsProvider rounds={rounds}>
    <Marketing2026Shell>
      <Nav />
      <main>
        <PxHero />
        <PxTicker />
        <PxWhy />
        <PxSession />
        <PxRounds />
        <PxMemory />
        <Faq items={pxFaq(rounds)} title="Before you book." className="border-[#E7E6F2] bg-[#F8F8FB] py-24 md:py-32" />
        <FinalCta primary="Find an interviewer" secondary="Become an interviewer" primaryHref={MK26_ROUTES.startPeerBooking} secondaryHref={MK26_ROUTES.peer} />
      </main>
      <Footer />
      <PxStickyCta />
    </Marketing2026Shell>
    </PeerRoundsProvider>
  );
}
