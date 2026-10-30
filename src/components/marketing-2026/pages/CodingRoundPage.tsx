import { Marketing2026Shell } from "../Marketing2026Shell";
import { Nav } from "../nav";
import { Faq, FinalCta, Footer } from "../closing";
import { CR_FAQ } from "../coding-round-faq";
import { MK26_ROUTES } from "../cta";
import {
  CrAfter,
  CrBank,
  CrChecks,
  CrFilm,
  CrHero,
  CrReport,
  CrSkills,
  CrStickyCta,
  CrTicker,
} from "../coding-round";

export function CodingRoundPage() {
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <CrHero />
        <CrTicker />
        <CrFilm />
        <CrChecks />
        <CrBank />
        <CrSkills />
        <CrReport />
        <CrAfter />
        <Faq items={CR_FAQ} title="Before your first submit." className="border-[#E7E6F2] bg-[#F8F8FB] py-24 md:py-32" />
        <FinalCta primary="Start my free coding round" secondary="Check my resume score" primaryHref={MK26_ROUTES.startCoding} secondaryHref={MK26_ROUTES.ats} />
      </main>
      <Footer />
      <CrStickyCta />
    </Marketing2026Shell>
  );
}
