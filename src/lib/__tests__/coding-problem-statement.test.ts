import { describe, expect, it } from "vitest";
import {
  insertStatementImage,
  parseCodingProblemStatement,
} from "@/lib/coding-problem-statement";

describe("parseCodingProblemStatement", () => {
  it("parses [image: url] lines into image blocks", () => {
    const statement =
      "Example 1:\n\n[image: https://assets.leetcode.com/uploads/search1.jpg]\n\nInput: board = []";
    expect(parseCodingProblemStatement(statement)).toEqual([
      { type: "text", content: "Example 1:\n" },
      {
        type: "image",
        url: "https://assets.leetcode.com/uploads/search1.jpg",
      },
      { type: "text", content: "\nInput: board = []" },
    ]);
  });

  it("parses markdown image syntax", () => {
    expect(
      parseCodingProblemStatement("![diagram](https://cdn.example.com/a.png)"),
    ).toEqual([
      {
        type: "image",
        url: "https://cdn.example.com/a.png",
        alt: "diagram",
      },
    ]);
  });
});

describe("insertStatementImage", () => {
  it("appends an image marker when no cursor is provided", () => {
    const { value } = insertStatementImage("Example 1:", "https://x/img.png");
    expect(value).toContain("[image: https://x/img.png]");
  });
});
