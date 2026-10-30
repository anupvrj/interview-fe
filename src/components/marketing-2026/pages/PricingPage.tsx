import { Marketing2026Shell } from "../Marketing2026Shell";
import { Nav } from "../nav";
import { Faq, FinalCta, Footer } from "../closing";
import { MK26_ROUTES } from "../cta";
import { PricingBody, PrStickyCta } from "../pricing";
import { PRICING_FAQ } from "@/lib/pricingPageContent";

export const PRICING_FAQ_ITEMS: [string, string][] = PRICING_FAQ.map((f) => [f.question, f.answer]);

/** Plans and the comparison load from the backend; billing FAQ is the same content as the legacy page. */
export function PricingPage() {
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <PricingBody />
        <Faq items={PRICING_FAQ_ITEMS} title="Subscription & billing, answered." className="border-[#E7E6F2] bg-[#F8F8FB] py-24 md:py-32" />
        <FinalCta primary="Start my free mock interview" secondary="Check my resume score" primaryHref={MK26_ROUTES.startInterview} secondaryHref={MK26_ROUTES.ats} />
      </main>
      <Footer />
      <PrStickyCta />
    </Marketing2026Shell>
  );
}
