import { describe, expect, it } from "vitest";
import { roleForQuote } from "@/lib/aiBuildMetaApply";

const content = {
  experience: [
    { position: "Assistant Controller / Accounts Payable Manager", company: "Advantage Health Services", description: "<ul><li>Cut costs by 25% through vendor management.</li></ul>" },
    {
      position: "Independent Accounting Contractor",
      company: "Greenland Chemical Company and Soho, LLC",
      description: "<ul><li>Researched and selected vendors for special projects.</li><li>Established reporting to State of New York.</li></ul>",
    },
  ],
  projects: [{ name: "Vendor Portal", description: "Built a portal." }],
} as never;

describe("roleForQuote", () => {
  it("finds the role a finding names by its heading ('Title at Company')", () => {
    const r = roleForQuote(content, "Independent Accounting Contractor at Greenland Chemical Company and Soho, LLC");
    expect(r).toMatchObject({ section: "experience", index: 1, title: "Independent Accounting Contractor" });
    expect(r?.lines).toHaveLength(2);
    expect(roleForQuote(content, "Independent Accounting Contractor")?.index).toBe(1);
    expect(roleForQuote(content, "Vendor Portal")).toMatchObject({ section: "projects", index: 0 });
  });

  it("leaves findings about a line, or other text, alone", () => {
    expect(roleForQuote(content, "Researched and selected vendors for special projects.")).toBeNull();
    expect(roleForQuote(content, "Cut costs by 25% through vendor management")).toBeNull();
    expect(roleForQuote(content, "Independent Accounting Contractor who closed a business with government entities")).toBeNull();
  });
});
