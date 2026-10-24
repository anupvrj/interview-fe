import { afterEach, describe, expect, it } from "vitest";
import {
  formatExperienceDateRange,
  formatExperienceDateRangeAbbreviated,
  formatResumeDateForDisplay,
  setResumeDateFormat,
} from "../resume-date-utils";

describe("date style picked in the Style panel", () => {
  afterEach(() => setResumeDateFormat("auto"));

  it("auto keeps each design's own style", () => {
    setResumeDateFormat(undefined);
    expect(formatResumeDateForDisplay("2024-03")).toBe("03/2024");
    expect(formatExperienceDateRangeAbbreviated({ startDate: "2024-03", current: true })).toBe("Mar 2024 - Present");
  });

  it("applies one style to every date, whatever the design uses", () => {
    setResumeDateFormat("Month YYYY");
    expect(formatExperienceDateRange({ startDate: "2020-03", endDate: "2022-11" })).toBe("March 2020 - November 2022");
    expect(formatExperienceDateRangeAbbreviated({ startDate: "2020-03", endDate: "2022-11" })).toBe("March 2020 - November 2022");
    setResumeDateFormat("Mon YYYY");
    expect(formatResumeDateForDisplay("03/2021")).toBe("Mar 2021");
    setResumeDateFormat("YYYY");
    expect(formatExperienceDateRange({ startDate: "2020-03", current: true })).toBe("2020 - Present");
    setResumeDateFormat("MM/YYYY");
    expect(formatResumeDateForDisplay("2019-7")).toBe("07/2019");
  });

  it("year-only and free-text dates stay readable", () => {
    setResumeDateFormat("Month YYYY");
    expect(formatResumeDateForDisplay("2018")).toBe("2018");
    expect(formatResumeDateForDisplay("Expected 2026")).toBe("Expected 2026");
    setResumeDateFormat("bogus");
    expect(formatResumeDateForDisplay("2024-03")).toBe("03/2024");
  });
});
