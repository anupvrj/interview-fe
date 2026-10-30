import { Marketing2026Shell } from "../Marketing2026Shell";
import { Nav } from "../nav";
import { Footer } from "../closing";
import { LegalPage } from "../legal";
import { REFUND_SECTIONS, REFUND_UPDATED } from "../legal/refund-content";

export function RefundPage() {
  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <LegalPage kind="refund" label="Refund Policy" title="Refunds," accent="clearly explained." updated={REFUND_UPDATED}
          intro="When a payment can be refunded, what can't be, and how to ask for one." sections={REFUND_SECTIONS} />
      </main>
      <Footer />
    </Marketing2026Shell>
  );
}
