// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlaceholderDataDialog } from "../PlaceholderDataDialog";
import { button, cleanup, click, render, text } from "@/test-utils/render";

afterEach(cleanup);

const issues = [
  { field: "projects.0.name", message: "Project 1: title is a placeholder “Sample Project”" },
  { field: "personalInfo.fullName", message: "Name is a placeholder: “Your Name”" },
];

function dialog(props: Partial<Parameters<typeof PlaceholderDataDialog>[0]> = {}) {
  const h = { onOpenChange: vi.fn(), onEdit: vi.fn(), onRemoveSamples: vi.fn() };
  render(<PlaceholderDataDialog open issues={issues} removeAndContinueLabel="Remove samples & submit" {...h} {...props} />);
  return h;
}

describe("PlaceholderDataDialog quick fix", () => {
  it("while the cleanup is being worked out, says so", () => {
    dialog({ cleanup: undefined });
    expect(text()).toContain("Checking what we can clean up for you");
  });

  it("when only removable samples are left: one tap removes and continues", () => {
    const h = dialog({ cleanup: { removed: ["Project 1", "2 sample skills"], remaining: [] } });
    expect(text()).toContain("Quick fix");
    expect(text()).toContain("Project 1, 2 sample skills");
    click(button("Remove samples & submit"));
    expect(h.onRemoveSamples).toHaveBeenCalled();
    click(button("Fix it myself"));
    expect(h.onEdit).toHaveBeenCalled();
  });

  it("when the name is still sample text: removes what it can and says what to type", () => {
    dialog({ cleanup: { removed: ["Project 1"], remaining: [issues[1]] } });
    expect(text()).toContain("You'll still need to type your own name.");
    expect(button("Remove sample entries")).toBeTruthy();
  });

  it("nothing to remove automatically: just Fix my resume", () => {
    dialog({ cleanup: { removed: [], remaining: [issues[1]] } });
    expect(text()).not.toContain("Quick fix");
    expect(button("Fix my resume")).toBeTruthy();
  });
});
