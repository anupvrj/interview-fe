import { describe, expect, it } from "vitest";
import { AUDIENCE_OPTIONS, BROADCAST_PRESETS, toInput, usesEventVariables } from "../presets";

const eventPresets = ["launch-event-reminder", "launch-we-are-live"].map((key) => BROADCAST_PRESETS.find((p) => p.key === key)!);

describe("live event broadcast templates", () => {
  it("fill title, time and links from the event fields, not the hackathon or server defaults", () => {
    for (const preset of eventPresets) {
      const text = JSON.stringify([preset.input.subject, preset.input.preheader, preset.input.content]);
      expect(text).not.toMatch(/hackathon_title|launch_join_url|add_to_calendar_url|launch_date|launch_time/);
      expect(text).toContain("{{event_title}}");
      expect(preset.input.content.ctaUrl).toMatch(/^\{\{event_(join|calendar)_url\}\}$/);
      expect(usesEventVariables(preset.input)).toBe(true);
      expect(preset.input.event.title).not.toBe("");
      expect(preset.input.event.joinUrl).toBe(""); // the admin pastes the real link
    }
  });

  it("go to the new warm audience by default", () => {
    expect(AUDIENCE_OPTIONS.some((o) => o.value === "engaged_or_launch_registered")).toBe(true);
    for (const preset of eventPresets) expect(preset.input.audience.type).toBe("engaged_or_launch_registered");
  });

  it("keeps older broadcasts (no event saved) editable", () => {
    const old = { ...eventPresets[0].input } as Partial<typeof eventPresets[0]["input"]>;
    delete old.event;
    expect(toInput(old as never).event).toEqual({ title: "", startsAt: null, durationMinutes: 60, joinUrl: "" });
  });
});
