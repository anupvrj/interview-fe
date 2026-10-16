import { describe, expect, it } from "vitest";
import { HACKATHON_CHALLENGE_SUCCESS_COPY } from "../celebrationCopy";

describe("HACKATHON_CHALLENGE_SUCCESS_COPY", () => {
  it("includes celebration headline and WhatsApp guidance", () => {
    expect(HACKATHON_CHALLENGE_SUCCESS_COPY.title).toBe("Woohooo!!");
    expect(HACKATHON_CHALLENGE_SUCCESS_COPY.body).toMatch(/WhatsApp Community/i);
    expect(HACKATHON_CHALLENGE_SUCCESS_COPY.body).toMatch(/email/i);
    expect(HACKATHON_CHALLENGE_SUCCESS_COPY.whyJoinTitle).toMatch(/Why should I join/i);
    expect(HACKATHON_CHALLENGE_SUCCESS_COPY.whyJoinBody).toMatch(/live event/i);
  });
});
