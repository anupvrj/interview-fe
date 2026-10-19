import { beforeEach, describe, expect, it, vi } from "vitest";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => Array.from(data.keys())[i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

const gtag = vi.fn();
const fbq = vi.fn();

async function loadFresh() {
  vi.resetModules();
  gtag.mockClear();
  fbq.mockClear();
  vi.stubGlobal("window", { gtag, fbq });
  vi.stubGlobal("localStorage", memoryStorage());
  vi.stubGlobal("sessionStorage", memoryStorage());
  return import("../analytics");
}

const sent = () => gtag.mock.calls.map(([, name, params]) => ({ name, params }));
const sentMeta = () => fbq.mock.calls.map(([, name, params]) => ({ name, params }));

describe("hackathon analytics", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends Meta CompleteRegistration once per account alongside the GA event", async () => {
    let a = await loadFresh();
    a.trackRegistrationSuccessOnce({ userKey: "user_m", source: "profile" });
    a.trackRegistrationSuccessOnce({ userKey: "user_m", source: "profile" });
    expect(sentMeta()).toEqual([
      { name: "CompleteRegistration", params: { content_name: "hiring_games_2026", status: true } },
    ]);

    const storage = localStorage;
    vi.resetModules();
    fbq.mockClear();
    vi.stubGlobal("localStorage", storage);
    a = await import("../analytics");
    a.trackRegistrationSuccessOnce({ userKey: "user_m", source: "profile" });
    expect(sentMeta()).toHaveLength(0);
  });

  it("sends Meta Lead once, only when the ATS score reaches the target", async () => {
    const a = await loadFresh();
    a.trackAtsQualifiedOnce({ userKey: "u", atsScore: 74, target: 75 });
    a.trackAtsQualifiedOnce({ userKey: "u", atsScore: null, target: 75 });
    a.trackAtsQualifiedOnce({ userKey: null, atsScore: 90, target: 75 });
    expect(sentMeta()).toHaveLength(0);

    a.trackAtsQualifiedOnce({ userKey: "u", atsScore: 75, target: 75 });
    a.trackAtsQualifiedOnce({ userKey: "u", atsScore: 88, target: 75 });
    expect(sentMeta()).toEqual([
      { name: "Lead", params: { content_name: "hiring_games_2026", content_category: "ats_qualified" } },
    ]);
    expect(sent()).toHaveLength(0);
  });

  it("counts a confirmed registration once per account, even across reloads", async () => {
    let a = await loadFresh();
    a.trackRegistrationSuccessOnce({ userKey: "user_1", source: "profile", userType: "student" });
    a.trackRegistrationSuccessOnce({ userKey: "user_1", source: "profile", userType: "student" });
    expect(sent().filter((e) => e.name === "hackathon_registration_success")).toHaveLength(1);

    // Simulated reload: module state resets, localStorage survives.
    const storage = localStorage;
    vi.resetModules();
    gtag.mockClear();
    vi.stubGlobal("localStorage", storage);
    a = await import("../analytics");
    a.trackRegistrationSuccessOnce({ userKey: "user_1", source: "profile" });
    expect(sent()).toHaveLength(0);
  });

  it("carries the Register button placement through to registration success", async () => {
    const a = await loadFresh();
    a.trackRegisterClick({ ctaLocation: "hero", ctaState: "register", signedIn: false, destination: "sign_up" });
    a.trackRegistrationSuccessOnce({ userKey: "user_2", source: "profile" });
    const names = sent().map((e) => e.name);
    expect(names).toEqual([
      "hackathon_engaged",
      "hackathon_register_click",
      "hackathon_signup_redirect",
      "hackathon_registration_success",
    ]);
    expect(sent()[3].params).toMatchObject({ cta_location: "hero", source: "profile" });
  });

  it("maps failures to coarse categories, never raw messages", async () => {
    const a = await loadFresh();
    expect(a.classifyError({ code: "ERR_NETWORK", message: "Network Error" })).toBe("network_error");
    expect(a.classifyError({ response: { status: 401 } })).toBe("authentication_error");
    expect(a.classifyError({ response: { status: 422 } })).toBe("validation_error");
    expect(a.classifyError({ response: { status: 503 } })).toBe("server_error");
    expect(a.classifyError(new Error("boom"))).toBe("unknown_error");
  });

  it("uses the first dashboard snapshot as a silent baseline, then reports transitions", async () => {
    const a = await loadFresh();
    const base = [
      { challengeId: "resume", kind: "resume", state: "completed" },
      { challengeId: "screening", kind: "screening", state: "available" },
    ];
    a.trackParticipationProgress({ userKey: "u", challenges: base, completed: false });
    expect(sent()).toHaveLength(0);

    a.trackParticipationProgress({
      userKey: "u",
      challenges: [base[0], { ...base[1], state: "in_progress" }],
      completed: false,
    });
    a.trackParticipationProgress({
      userKey: "u",
      challenges: [base[0], { ...base[1], state: "completed" }],
      completed: true,
    });
    expect(sent().map((e) => e.name)).toEqual([
      "hackathon_challenge_started",
      "hackathon_challenge_completed",
      "hackathon_submission_completed",
    ]);
    expect(sent()[0].params).toMatchObject({ challenge_kind: "screening", challenge_index: 2 });
  });

  it("drops empty params and never sends undefined values", async () => {
    const a = await loadFresh();
    a.trackHackathon(a.HK_EVENTS.signupView, { signup_page_type: "sign_up", cta_location: undefined });
    expect(sent()[0].params).toEqual({ hackathon_id: "hiring_games_2026", signup_page_type: "sign_up" });
  });
});
