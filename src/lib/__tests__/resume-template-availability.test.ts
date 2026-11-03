import { afterEach, describe, expect, it, vi } from "vitest";

const getResumeTemplateAvailability = vi.fn();
vi.mock("@/lib/api", () => ({
  configApi: { getResumeTemplateAvailability: () => getResumeTemplateAvailability() },
}));

// eslint-disable-next-line import/first
import {
  arrangeResumeTemplates,
  fetchDisabledResumeTemplateIds,
  fetchResumeTemplateAvailability,
  filterSelectableTemplates,
  forgetResumeTemplateAvailability,
  orderResumeTemplates,
} from "../resume-template-availability";

const list = (...ids: string[]) => ids.map((id) => ({ id }));
const ids = (items: { id: string }[]) => items.map((t) => t.id);

afterEach(() => {
  forgetResumeTemplateAvailability();
  getResumeTemplateAvailability.mockReset();
});

describe("orderResumeTemplates", () => {
  it("keeps the page's own order when no order is saved", () => {
    expect(ids(orderResumeTemplates(list("meridian", "classic", "harvard"), []))).toEqual(["meridian", "classic", "harvard"]);
  });

  it("follows the saved order; ids it doesn't know stay last, in their own order", () => {
    const order = ["harvard", "classic", "meridian"];
    expect(ids(orderResumeTemplates(list("meridian", "new-one", "classic", "harvard", "other"), order))).toEqual([
      "harvard",
      "classic",
      "meridian",
      "new-one",
      "other",
    ]);
  });
});

describe("arrangeResumeTemplates", () => {
  const all = list("meridian", "classic", "harvard", "mercury");

  it("hides disabled templates and sorts the rest", () => {
    const shown = arrangeResumeTemplates(all, { disabledTemplateIds: ["classic"], templateOrder: ["mercury", "harvard", "classic", "meridian"] });
    expect(ids(shown)).toEqual(["mercury", "harvard", "meridian"]);
  });

  it("keeps the resume's own template even when it's disabled", () => {
    const shown = arrangeResumeTemplates(all, { disabledTemplateIds: ["classic"], templateOrder: [] }, "classic");
    expect(ids(shown)).toEqual(["meridian", "classic", "harvard", "mercury"]);
    expect(ids(filterSelectableTemplates(all, ["classic"]))).toEqual(["meridian", "harvard", "mercury"]);
  });

  it("shows Super Admin's names and categories", () => {
    const items = [{ id: "classic", name: "Classic", category: "simple" }, { id: "harvard", name: "Harvard", category: "simple" }];
    const shown = arrangeResumeTemplates(items, {
      disabledTemplateIds: [],
      templateOrder: [],
      overrides: { classic: { revision: 2, name: "Classic Pro", category: "modern" } },
    });
    expect(shown).toEqual([{ id: "classic", name: "Classic Pro", category: "modern" }, { id: "harvard", name: "Harvard", category: "simple" }]);
  });

  it("leaves the list alone without settings", () => {
    expect(arrangeResumeTemplates(all, null)).toBe(all);
  });
});

describe("fetchResumeTemplateAvailability", () => {
  it("returns the settings and caches them", async () => {
    getResumeTemplateAvailability.mockResolvedValue({ disabledTemplateIds: ["mercury"], templateOrder: ["harvard"], overrides: {} });
    expect(await fetchResumeTemplateAvailability()).toEqual({ disabledTemplateIds: ["mercury"], templateOrder: ["harvard"], overrides: {} });
    expect(await fetchDisabledResumeTemplateIds()).toEqual(["mercury"]);
    expect(getResumeTemplateAvailability).toHaveBeenCalledTimes(1);
  });

  it("hides and reorders nothing when the lookup fails", async () => {
    getResumeTemplateAvailability.mockRejectedValue(new Error("offline"));
    expect(await fetchResumeTemplateAvailability()).toEqual({ disabledTemplateIds: [], templateOrder: [], overrides: {} });
  });
});
