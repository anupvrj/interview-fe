// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { ATSStepRail } from "../ATSProcessingView";
import { cleanup, render } from "@/test-utils/render";

vi.mock("@/components/marketing-2026/fonts", () => ({ geist: { variable: "" }, geistMono: { variable: "" }, caveat: { variable: "" } }));

afterEach(cleanup);

describe("ATSStepRail", () => {
  it("ticks finished steps and marks the current one", () => {
    const view = render(<ATSStepRail steps={["One", "Two", "Three"]} current={1} />);
    const items = [...view.container.querySelectorAll("li")];
    expect(items[0].querySelector("svg.lucide-check")).not.toBeNull();
    expect(items[1].getAttribute("aria-current")).toBe("step");
    expect(items[2].textContent).toContain("3");
  });
});
