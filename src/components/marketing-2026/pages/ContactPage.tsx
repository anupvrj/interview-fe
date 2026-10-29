import { Marketing2026Shell } from "../Marketing2026Shell";
import { Nav } from "../nav";
import { Faq, FinalCta, Footer } from "../closing";
import { MK26_ROUTES } from "../cta";
import { CONTACT_FAQ, CtFacts, CtHero } from "../contact";

export function ContactPage() {
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <CtHero />
        <CtFacts />
        <Faq items={CONTACT_FAQ} title="Before you write in." className="border-[#E7E6F2] bg-[#F8F8FB] py-24 md:py-32" />
        <FinalCta primary="View pricing plans" secondary="Start my free mock interview" primaryHref={MK26_ROUTES.pricing} secondaryHref={MK26_ROUTES.startInterview} />
      </main>
      <Footer />
    </Marketing2026Shell>
  );
}
