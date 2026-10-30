import { Marketing2026Shell } from "../Marketing2026Shell";
import { Nav } from "../nav";
import { Faq, FinalCta, Footer } from "../closing";
import { MI_FAQ } from "../mock-interview-faq";
import { MK26_ROUTES } from "../cta";
import {
  MiAfter,
  MiCatches,
  MiHero,
  MiReport,
  MiSkills,
  MiSpotlight,
  MiStickyCta,
  MiThreeScreens,
  MiTicker,
} from "../mock-interview";

export function MockInterviewPage() {
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <MiHero />
        <MiTicker />
        <MiThreeScreens />
        <MiCatches />
        <MiReport />
        <MiSpotlight />
        <MiSkills />
        <MiAfter />
        <Faq items={MI_FAQ} title="Asked before almost every first round." className="border-[#E7E6F2] bg-[#F8F8FB] py-24 md:py-32" />
        <FinalCta primaryHref={MK26_ROUTES.startInterview} secondaryHref={MK26_ROUTES.ats} />
      </main>
      <Footer />
      <MiStickyCta />
    </Marketing2026Shell>
  );
}
