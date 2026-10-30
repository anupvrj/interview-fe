import { describe, expect, it } from "vitest";
import { faqPageJsonLd } from "../faq-jsonld";
import { MI_FAQ } from "../mock-interview-faq";
import { HOME_FAQ } from "../home-faq";

describe("faqPageJsonLd", () => {
  it("matches visible FAQ pairs", () => {
    const ld = faqPageJsonLd(MI_FAQ);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(MI_FAQ.length);
    expect(ld.mainEntity[0]).toEqual({
      "@type": "Question",
      name: MI_FAQ[0][0],
      acceptedAnswer: { "@type": "Answer", text: MI_FAQ[0][1] },
    });
  });

  it("keeps home FAQ in sync with JSON-LD", () => {
    expect(faqPageJsonLd(HOME_FAQ).mainEntity.map((e) => e.name)).toEqual(HOME_FAQ.map(([q]) => q));
  });
});
