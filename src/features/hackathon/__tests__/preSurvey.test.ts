import { beforeEach, describe, expect, it, vi } from "vitest";

const preSurvey = vi.fn();
const claimPreSurvey = vi.fn();
vi.mock("../api", () => ({ hackathonApi: { preSurvey: (...a: unknown[]) => preSurvey(...a), claimPreSurvey: (...a: unknown[]) => claimPreSurvey(...a) } }));

// node environment: a minimal window with localStorage and the ad link's query string.
const storage = new Map<string, string>();
Object.assign(globalThis, {
  window: {
    location: { search: "?utm_source=instagram&utm_campaign=hiring-games&fbclid=abc" },
    localStorage: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => void storage.set(k, v),
      removeItem: (k: string) => void storage.delete(k),
    },
  },
});

// eslint-disable-next-line import/first
import { claimSavedPreSurvey, savePreSurveyAnswer } from "../preSurvey";

const getToken = async () => null;
const TOKEN = "t".repeat(43);

describe("pre-sign-up survey (browser side)", () => {
  beforeEach(() => {
    storage.clear();
    preSurvey.mockReset();
    claimPreSurvey.mockReset();
  });

  it("first answer sends only campaign tags from the link (not other params) and keeps the token", async () => {
    preSurvey.mockResolvedValue({ token: TOKEN, linked: false });
    await savePreSurveyAnswer("hg", getToken, { attended: "no" });
    expect(preSurvey).toHaveBeenCalledWith("hg", getToken, { attended: "no", utm: { source: "instagram", campaign: "hiring-games" } });
    expect(storage.get("hk-presurvey:hg")).toBe(TOKEN);
  });

  it("the next answer reuses the token", async () => {
    storage.set("hk-presurvey:hg", TOKEN);
    preSurvey.mockResolvedValue({ token: TOKEN, linked: false });
    await savePreSurveyAnswer("hg", getToken, { ready: "nervous" });
    expect(preSurvey).toHaveBeenCalledWith("hg", getToken, { ready: "nervous", token: TOKEN });
  });

  it("answers linked straight away (signed in) leave nothing behind", async () => {
    preSurvey.mockResolvedValue({ token: null, linked: true });
    await savePreSurveyAnswer("hg", getToken, { attended: "yes" });
    expect(storage.has("hk-presurvey:hg")).toBe(false);
  });

  it("a failed save never throws into the quiz", async () => {
    preSurvey.mockRejectedValue(new Error("network"));
    await expect(savePreSurveyAnswer("hg", getToken, { attended: "yes" })).resolves.toBeUndefined();
  });

  it("after sign-in: links, then forgets the token; a rejected token is dropped, a network error kept", async () => {
    storage.set("hk-presurvey:hg", TOKEN);
    claimPreSurvey.mockResolvedValue({ linked: true });
    await claimSavedPreSurvey("hg", getToken);
    expect(claimPreSurvey).toHaveBeenCalledWith("hg", getToken, TOKEN);
    expect(storage.has("hk-presurvey:hg")).toBe(false);

    storage.set("hk-presurvey:hg", TOKEN);
    claimPreSurvey.mockRejectedValue({ response: { status: 400 } });
    await claimSavedPreSurvey("hg", getToken);
    expect(storage.has("hk-presurvey:hg")).toBe(false);

    storage.set("hk-presurvey:hg", TOKEN);
    claimPreSurvey.mockRejectedValue(new Error("offline"));
    await claimSavedPreSurvey("hg", getToken);
    expect(storage.get("hk-presurvey:hg")).toBe(TOKEN);
  });

  it("does nothing after sign-in when no quiz was answered", async () => {
    await claimSavedPreSurvey("hg", getToken);
    expect(claimPreSurvey).not.toHaveBeenCalled();
  });
});
