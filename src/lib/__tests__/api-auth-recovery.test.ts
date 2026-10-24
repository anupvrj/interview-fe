// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { AUTH_LOST_EVENT, apiClient } from "../api";

/** Answers requests in turn; records what was asked. */
function scriptedAdapter(replies: Array<{ status: number; data: unknown }>) {
  const calls: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config);
    const reply = replies.shift() ?? { status: 200, data: {} };
    const response = { data: reply.data, status: reply.status, statusText: "", headers: {}, config };
    if (reply.status >= 400) {
      const err = Object.assign(new Error(`HTTP ${reply.status}`), { isAxiosError: true, config, response });
      throw err;
    }
    return response;
  };
  return { adapter, calls };
}

describe("401 on the resume editor never navigates away", () => {
  const original = apiClient.defaults.adapter;
  let href: string;

  beforeEach(() => {
    window.history.replaceState({}, "", "/dashboard/resumes/res_1/edit");
    href = window.location.href;
    (window as unknown as { Clerk: unknown }).Clerk = {
      session: { getToken: vi.fn().mockResolvedValue("fresh-token") },
      user: { id: "user_new", fullName: "Ann", primaryEmailAddress: { emailAddress: "ann@example.com" } },
    };
  });
  afterEach(() => {
    apiClient.defaults.adapter = original;
    delete (window as unknown as { Clerk?: unknown }).Clerk;
  });

  it("re-links the account and retries the request once", async () => {
    const { adapter, calls } = scriptedAdapter([
      { status: 401, data: { message: "User not found. Please complete sign-up." } },
      { status: 201, data: {} },
      { status: 200, data: { ok: true } },
    ]);
    apiClient.defaults.adapter = adapter;
    const res = await apiClient.get("/resumes/res_1");
    expect(res.data).toEqual({ ok: true });
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(["get /resumes/res_1", "post /users", "get /resumes/res_1"]);
    expect(JSON.parse(String(calls[1].data))).toMatchObject({ clerkId: "user_new", email: "ann@example.com" });
    expect(window.location.href).toBe(href);
  });

  it("still signed out: reports it and stays on the page", async () => {
    await new Promise((r) => setTimeout(r, 1100)); // let the shared recovery from the last test expire
    const { adapter } = scriptedAdapter([
      { status: 401, data: { message: "Invalid token" } },
      { status: 401, data: { message: "Invalid token" } },
    ]);
    apiClient.defaults.adapter = adapter;
    const lost = vi.fn();
    window.addEventListener(AUTH_LOST_EVENT, lost);
    await expect(apiClient.get("/resumes/res_1")).rejects.toBeTruthy();
    window.removeEventListener(AUTH_LOST_EVENT, lost);
    expect(lost).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe(href);
  });
});
