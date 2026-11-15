import { describe, expect, it } from "vitest";
import { locateTextInPdf, type PdfPage } from "../pdf-snapshot";

const page = (items: [string, number, number, number][]): PdfPage => ({
  dataUrl: "",
  aspect: 0.7,
  items: items.map(([text, top, left, width]) => ({ text, top, left, width, height: 0.02 })),
});

describe("locateTextInPdf", () => {
  const pages = [
    page([
      ["• Teaching Assistant for the course, CSXXX : Course Name, supervised the labs for the course, evaluated their lab", 0.8, 0.1, 0.8],
      ["assignments, quizzes and examination papers", 0.82, 0.12, 0.4],
    ]),
    page([["Project Title 1, (CS XXX)", 0.1, 0.1, 0.3]]),
  ];

  it("boxes a quote across the lines it runs over, ignoring punctuation and breaks", () => {
    const hits = locateTextInPdf(pages, "evaluated their lab assignments, quizzes and examination papers");
    expect(hits).toHaveLength(2);
    expect(hits[0].page).toBe(0);
    expect(hits[0].left).toBeGreaterThan(0.6);
    expect(hits[1].left).toBeCloseTo(0.12, 2);
  });

  it("finds text on later pages", () => {
    expect(locateTextInPdf(pages, "Project Title 1")[0].page).toBe(1);
  });

  it("falls back to the opening words when a long quote drifts", () => {
    expect(locateTextInPdf(pages, "Teaching Assistant for the course CSXXX Course Name and then something else entirely")).toHaveLength(1);
  });

  it("returns nothing for text that isn't there", () => {
    expect(locateTextInPdf(pages, "Led a team of twelve engineers")).toEqual([]);
  });
});
