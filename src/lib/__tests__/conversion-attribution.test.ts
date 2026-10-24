import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clientIdFromGaCookie,
  collectConversionAttribution,
  readCookie,
  sessionIdFromStreamCookie,
} from "@/lib/analytics/attribution";

describe("conversion attribution", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses GA and Meta cookies", () => {
    const cookies = "foo=1; _ga=GA1.1.123456789.1729500000; _ga_P12J6RSLEQ=GS2.1.s1729591200$o3$g1; _fbp=fb.1.1729500000000.42";
    expect(readCookie("_fbp", cookies)).toBe("fb.1.1729500000000.42");
    expect(readCookie("_fbc", cookies)).toBeUndefined();
    expect(clientIdFromGaCookie(readCookie("_ga", cookies))).toBe("123456789.1729500000");
    expect(sessionIdFromStreamCookie(readCookie("_ga_P12J6RSLEQ", cookies))).toBe("1729591200");
    expect(sessionIdFromStreamCookie("GS1.1.1729591200.3.1.1729591300.0.0.0")).toBe("1729591200");
    expect(clientIdFromGaCookie("garbage")).toBeUndefined();
  });

  it("prefers gtag values and drops the query string from the page URL", async () => {
    const gtag = vi.fn((_cmd: string, _id: string, field: string, cb: (v: string) => void) =>
      cb(field === "client_id" ? "111.222" : "333"),
    );
    vi.stubGlobal("window", { gtag, location: { origin: "https://interviewtrix.com", pathname: "/hackathon/profile" } });
    vi.stubGlobal("document", { cookie: "_ga=GA1.1.999.888; _fbc=fb.1.1729500000000.IwAR1" });
    await expect(collectConversionAttribution()).resolves.toEqual({
      gaClientId: "111.222",
      gaSessionId: "333",
      fbc: "fb.1.1729500000000.IwAR1",
      pageUrl: "https://interviewtrix.com/hackathon/profile",
    });
  });

  it("falls back to cookies when gtag is blocked", async () => {
    vi.stubGlobal("window", { location: { origin: "https://interviewtrix.com", pathname: "/hackathon" } });
    vi.stubGlobal("document", { cookie: "_ga=GA1.1.999.888; _ga_P12J6RSLEQ=GS1.1.555.1.1.1.0.0.0" });
    await expect(collectConversionAttribution()).resolves.toEqual({
      gaClientId: "999.888",
      gaSessionId: "555",
      pageUrl: "https://interviewtrix.com/hackathon",
    });
  });
});
