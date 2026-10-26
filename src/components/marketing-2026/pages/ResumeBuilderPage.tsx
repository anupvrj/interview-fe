import { Marketing2026Shell } from "../Marketing2026Shell";
import { Nav } from "../nav";
import { Faq, FinalCta, Footer } from "../closing";
import { RB_FAQ } from "../resume-builder-faq";
import { MK26_ROUTES } from "../cta";
import {
  RbAfter,
  RbAts,
  RbAva,
  RbHero,
  RbRewrite,
  RbStickyCta,
  RbSteps,
  RbTemplates,
  RbTicker,
} from "../resume-builder";

export function ResumeBuilderPage() {
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <RbHero />
        <RbTicker />
        <RbSteps />
        <RbRewrite />
        <RbTemplates />
        <RbAva />
        <RbAts />
        <RbAfter />
        <Faq items={RB_FAQ} title="Resume builder, answered." className="border-[#E7E6F2] bg-[#F8F8FB] py-24 md:py-32" />
        <FinalCta primary="Build my resume, free" secondary="Check my ATS score" primaryHref={MK26_ROUTES.startResume} secondaryHref={MK26_ROUTES.ats} />
      </main>
      <Footer />
      <RbStickyCta />
    </Marketing2026Shell>
  );
}
