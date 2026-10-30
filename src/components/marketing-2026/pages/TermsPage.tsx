import { Marketing2026Shell } from "../Marketing2026Shell";
import { Nav } from "../nav";
import { Footer } from "../closing";
import { LegalPage } from "../legal";
import { TERMS_SECTIONS, TERMS_UPDATED } from "../legal/terms-content";

export function TermsPage() {
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <LegalPage kind="scroll" label="Terms of Service" title="The ground rules," accent="in plain view." updated={TERMS_UPDATED}
          intro="The terms that govern your access to and use of Interview Trix." sections={TERMS_SECTIONS} />
      </main>
      <Footer />
    </Marketing2026Shell>
  );
}
