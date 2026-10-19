import { describe, expect, it } from "vitest";
import { AI_INTERVIEWER_PERSONAS } from "@/lib/aiPersonas";
import { selectInterviewerPersona } from "@/lib/aiInterviewers";
import type { PublicInterviewerCatalog } from "@/lib/aiInterviewers";

const personas: PublicInterviewerCatalog["personas"] = [
  {
    id: "p1",
    displayName: "Daniel Reed",
    title: "Technical interviewer",
    geminiVoice: "Charon",
    openaiVoice: "ash",
    sarvamVoice: "aditya",
    imageSrc: "/personas/persona-1.jpg",
    enabled: true,
  },
  {
    id: "p2",
    displayName: "Rachel Kim",
    title: "Hiring manager",
    geminiVoice: "Kore",
    openaiVoice: "coral",
    sarvamVoice: "priya",
    imageSrc: "/personas/persona-2.jpg",
    enabled: true,
  },
  {
    id: "p3",
    displayName: "Marcus Webb",
    title: "Senior interviewer",
    geminiVoice: "Fenrir",
    openaiVoice: "verse",
    sarvamVoice: "rahul",
    imageSrc: "/personas/persona-3.jpg",
    enabled: false,
  },
];

describe("selectInterviewerPersona", () => {
  it("uses the pinned character and skips a disabled pin", () => {
    expect(
      selectInterviewerPersona({
        selectionMode: "fixed",
        fixedPersonaId: "p2",
        personas,
      }).id,
    ).toBe("p2");

    expect(
      selectInterviewerPersona(
        {
          selectionMode: "fixed",
          fixedPersonaId: "p3",
          personas,
        },
        () => 0,
      ).id,
    ).toBe("p1");
  });

  it("picks only among enabled characters when selection is random", () => {
    const first = selectInterviewerPersona(
      { selectionMode: "random", fixedPersonaId: null, personas },
      () => 0,
    );
    const last = selectInterviewerPersona(
      { selectionMode: "random", fixedPersonaId: null, personas },
      () => 0.99,
    );
    expect(first.id).toBe("p1");
    expect(last.id).toBe("p2");
  });

  describe("negative cases", () => {
    it("does not use a missing, blank, or disabled pin", () => {
      expect(
        selectInterviewerPersona(
          { selectionMode: "fixed", fixedPersonaId: "missing", personas },
          () => 0,
        ).id,
      ).toBe("p1");
      expect(
        selectInterviewerPersona(
          { selectionMode: "fixed", fixedPersonaId: "", personas },
          () => 0.99,
        ).id,
      ).toBe("p2");
      expect(
        selectInterviewerPersona(
          { selectionMode: "fixed", fixedPersonaId: "p3", personas },
          () => 0.99,
        ).id,
      ).not.toBe("p3");
    });

    it("does not throw on an empty catalog, a bad random value, or no catalog", () => {
      const names = new Set(AI_INTERVIEWER_PERSONAS.map((persona) => persona.displayName));
      expect(names.has(selectInterviewerPersona(undefined).displayName)).toBe(true);
      expect(
        names.has(
          selectInterviewerPersona({
            selectionMode: "fixed",
            fixedPersonaId: "p1",
            personas: personas.map((persona) => ({ ...persona, enabled: false })),
          }).displayName,
        ),
      ).toBe(true);
      expect(
        selectInterviewerPersona(
          { selectionMode: "random", fixedPersonaId: null, personas },
          () => Number.NaN,
        ).id,
      ).toBe("p1");
      expect(
        selectInterviewerPersona(
          { selectionMode: "random", fixedPersonaId: null, personas },
          () => -5,
        ).id,
      ).toBe("p1");
    });
  });

  it("falls back to a built-in character when the catalog is missing or empty", () => {
    const names = new Set(AI_INTERVIEWER_PERSONAS.map((persona) => persona.displayName));
    expect(names.has(selectInterviewerPersona(null).displayName)).toBe(true);
    expect(
      names.has(
        selectInterviewerPersona({
          selectionMode: "random",
          fixedPersonaId: null,
          personas: [],
        }).displayName,
      ),
    ).toBe(true);
  });
});
