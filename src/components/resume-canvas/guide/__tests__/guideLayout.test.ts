import { describe, expect, it } from "vitest";
import { CARD_W, cardPosition } from "../guideLayout";

const phone = { width: 390, height: 844 };
const desktop = { width: 1440, height: 900 };

describe("step card placement", () => {
  it("phones: full-width card above a target in the bottom half (tab bar)", () => {
    expect(cardPosition({ left: 76, top: 785, width: 64, height: 53 }, true, 180, phone)).toEqual({ left: 12, width: 366, bottom: 75 });
  });

  it("phones: below a target in the top half, never off the bottom", () => {
    expect(cardPosition({ left: 346, top: 8, width: 36, height: 32 }, true, 180, phone)).toEqual({ left: 12, width: 366, top: 56 });
    // A tall target (the page): clamped so the card stays on screen.
    expect(cardPosition({ left: 6, top: 58, width: 357, height: 505 }, true, 300, phone).top).toBe(532);
  });

  it("desktop: the page gets the card in its top-right corner", () => {
    const pos = cardPosition({ left: 347, top: 93, width: 794, height: 791 }, false, 180, desktop);
    expect(pos).toEqual({ left: 347 + 794 - CARD_W - 24, top: 125, width: CARD_W });
  });

  it("desktop: right of a left-rail button, below a top-right button", () => {
    expect(cardPosition({ left: 8, top: 123, width: 75, height: 68 }, false, 180, desktop)).toMatchObject({ left: 101, top: 115 });
    expect(cardPosition({ left: 1328, top: 10, width: 96, height: 32 }, false, 180, desktop)).toMatchObject({ left: 1424 - CARD_W, top: 56 });
  });
});
