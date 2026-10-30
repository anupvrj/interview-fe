import { Marketing2026Shell } from "../Marketing2026Shell";
import { Nav } from "../nav";
import { Footer } from "../closing";
import { LegalPage } from "../legal";
import { PRIVACY_SECTIONS, PRIVACY_UPDATED } from "../legal/privacy-content";

export function PrivacyPage() {
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <LegalPage kind="shield" label="Privacy Policy" title="Your data," accent="handled with care." updated={PRIVACY_UPDATED}
          intro="What information we collect, how we use it, and the choices you have." sections={PRIVACY_SECTIONS} />
      </main>
      <Footer />
    </Marketing2026Shell>
  );
}
