// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

const mutate = vi.fn();
let me: Record<string, unknown> | undefined;
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ userId: "u1" }) }));
vi.mock("../hooks", () => ({
  useHackathonMe: () => ({ data: me }),
  useRegisterForHackathon: () => ({ mutate, isPending: false }),
}));
vi.mock("../analytics", () => ({
  HK_EVENTS: { signupError: "x" },
  classifyError: () => "x",
  trackHackathon: vi.fn(),
  trackRegistrationSuccessOnce: vi.fn(),
}));

import { useHackathonRegistrationGate } from "../useHackathonRegistrationGate";
import { cleanup, render } from "@/test-utils/render";

afterEach(() => {
  cleanup();
  mutate.mockClear();
});

function Gate() {
  useHackathonRegistrationGate({ source: "profile", autoRegister: true });
  return null;
}

const state = (complete: boolean, registered = false) => ({
  registered,
  profile: { complete, userType: "student" },
  hackathon: { phase: "live", isFull: false },
});

describe("hackathon registration", () => {
  it("does not register someone who only signed in (profile not finished)", () => {
    me = state(false);
    render(<Gate />);
    expect(mutate).not.toHaveBeenCalled();
  });

  it("registers once the signup form is finished", () => {
    me = state(true);
    render(<Gate />);
    expect(mutate).toHaveBeenCalledWith("profile", expect.any(Object));
  });

  it("never registers twice or after the event is full", () => {
    me = state(true, true);
    render(<Gate />);
    me = { ...state(true), hackathon: { phase: "live", isFull: true } };
    render(<Gate />);
    expect(mutate).not.toHaveBeenCalled();
  });
});
