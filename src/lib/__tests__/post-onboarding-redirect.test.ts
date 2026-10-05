import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST_SIGN_IN_RETURN_URL_KEY } from "@/lib/post-sign-in-redirect";
import {
  leaveOnboarding,
  ONBOARDING_LEAVE_RETRY_MS,
  resolveCompletedOnboardingPath,
} from "@/lib/post-onboarding-redirect";

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.get(key) ?? null;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
  };
}

describe("resolveCompletedOnboardingPath", () => {
  beforeEach(() => {
    const session = createMemoryStorage();
    const local = createMemoryStorage();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { sessionStorage: session, localStorage: local },
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: session,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: local,
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("sends a finished signup to role selection", () => {
    expect(resolveCompletedOnboardingPath()).toBe("/select-role");
  });

  it("does not send the user back to onboarding", () => {
    localStorage.setItem(POST_SIGN_IN_RETURN_URL_KEY, "/onboarding");
    expect(resolveCompletedOnboardingPath()).toBe("/select-role");
    expect(localStorage.getItem(POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
  });

  it("keeps an explicit in-app return path", () => {
    localStorage.setItem(
      POST_SIGN_IN_RETURN_URL_KEY,
      "/dashboard/resumes/new",
    );
    expect(resolveCompletedOnboardingPath()).toBe("/dashboard/resumes/new");
  });

  it("sends a pending paid plan to checkout", () => {
    localStorage.setItem("pendingPlan", "tech_pro");
    expect(resolveCompletedOnboardingPath()).toBe(
      "/checkout?plan=tech_pro&cycle=monthly",
    );
    expect(localStorage.getItem("pendingPlan")).toBeNull();
  });
});

describe("leaveOnboarding", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("retries the destination, then the dashboard, if still on onboarding", () => {
    const replace = vi.fn();
    const assign = vi.fn();
    vi.stubGlobal("window", {
      location: { pathname: "/onboarding", replace, assign },
      setTimeout: globalThis.setTimeout,
    });

    leaveOnboarding("/select-role");

    expect(replace).toHaveBeenCalledWith("/select-role");
    expect(assign).not.toHaveBeenCalled();

    vi.advanceTimersByTime(ONBOARDING_LEAVE_RETRY_MS);
    expect(assign).toHaveBeenCalledWith("/select-role");

    vi.advanceTimersByTime(ONBOARDING_LEAVE_RETRY_MS);
    expect(assign).toHaveBeenCalledWith("/dashboard");
  });

  it("does not retry after the page has left onboarding", () => {
    const replace = vi.fn();
    const assign = vi.fn();
    const location = { pathname: "/onboarding", replace, assign };
    vi.stubGlobal("window", {
      location,
      setTimeout: globalThis.setTimeout,
    });

    leaveOnboarding("/select-role");
    location.pathname = "/select-role";
    vi.advanceTimersByTime(ONBOARDING_LEAVE_RETRY_MS * 2);

    expect(assign).not.toHaveBeenCalled();
  });
});
