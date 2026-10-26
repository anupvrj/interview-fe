import { Marketing2026Shell } from "../Marketing2026Shell";
import { Nav } from "../nav";
import { Faq, FinalCta, Footer } from "../closing";
import { SD_FAQ } from "../system-design-faq";
import { MK26_ROUTES } from "../cta";
import {
  SdAfter,
  SdFeatures,
  SdFilm,
  SdHero,
  SdReport,
  SdSkills,
  SdStickyCta,
  SdSystems,
  SdTicker,
} from "../system-design";

export function SystemDesignPage() {
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <SdHero />
        <SdTicker />
        <SdFilm />
        <SdFeatures />
        <SdSystems />
        <SdSkills />
        <SdReport />
        <SdAfter />
        <Faq items={SD_FAQ} title="Before you pick up the marker." className="border-[#E7E6F2] bg-[#F8F8FB] py-24 md:py-32" />
        <FinalCta primary="Start my free system design round" secondary="Check my resume score" primaryHref={MK26_ROUTES.startSystemDesign} secondaryHref={MK26_ROUTES.ats} />
      </main>
      <Footer />
      <SdStickyCta />
    </Marketing2026Shell>
  );
}
