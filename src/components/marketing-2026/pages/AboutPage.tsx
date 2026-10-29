import { Marketing2026Shell } from "../Marketing2026Shell";
import { Nav } from "../nav";
import { Faq, FinalCta, Footer } from "../closing";
import { AB_FAQ } from "../about-faq";
import { MK26_ROUTES } from "../cta";
import { AbAgents, AbHero, AbPlace, AbProof, AbStickyCta, AbWhy } from "../about";

/** The product's own loop, told as a story: one place → agents → proof → why it compounds. */
export function AboutPage() {
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <AbHero />
        <AbPlace />
        <AbAgents />
        <AbProof />
        <AbWhy />
        <Faq items={AB_FAQ} title="About InterviewTrix, briefly." className="border-[#E7E6F2] bg-[#F8F8FB] py-24 md:py-32" />
        <FinalCta primary="Start my free mock interview" secondary="Check my resume score" primaryHref={MK26_ROUTES.startInterview} secondaryHref={MK26_ROUTES.ats} />
      </main>
      <Footer />
      <AbStickyCta />
    </Marketing2026Shell>
  );
}
