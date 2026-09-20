import { describe, expect, it } from "vitest";
import {
  EMPTY_JOB_TRACKER_FILTERS,
  JOB_TRACKER_ACTIVE_STATUSES,
  JOB_TRACKER_STATUS_LABELS,
  hasActiveJobTrackerFilters,
  jobTrackerFilterChips,
  sourceLabel,
} from "@/lib/job-tracker";

describe("job tracker filters", () => {
  it("treats empty filters as inactive", () => {
    expect(hasActiveJobTrackerFilters(EMPTY_JOB_TRACKER_FILTERS)).toBe(false);
  });

  it("flags search, status, and favorite as active", () => {
    expect(
      hasActiveJobTrackerFilters({
        ...EMPTY_JOB_TRACKER_FILTERS,
        q: "Mico",
      }),
    ).toBe(true);
    expect(
      hasActiveJobTrackerFilters({
        ...EMPTY_JOB_TRACKER_FILTERS,
        favorite: true,
      }),
    ).toBe(true);
  });

  it("builds removable chips for applied filters", () => {
    const chips = jobTrackerFilterChips({
      ...EMPTY_JOB_TRACKER_FILTERS,
      q: "Engineer",
      status: "applied",
      favorite: true,
    });
    expect(chips.map((chip) => chip.key)).toEqual(["q", "status", "favorite"]);
    expect(chips[1]?.label).toBe(
      `Status: ${JOB_TRACKER_STATUS_LABELS.applied}`,
    );
  });

  it("keeps archived off the board columns", () => {
    expect(JOB_TRACKER_ACTIVE_STATUSES).not.toContain("archived");
  });

  it("uses a custom source label when provided", () => {
    expect(sourceLabel("other", "AngelList")).toBe("AngelList");
    expect(sourceLabel("linkedin")).toBe("LinkedIn");
  });
});
