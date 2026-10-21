"use client";

import { useEffect, useState } from "react";

/**
 * "This browser has signed in to the hackathon before" — so a signed-out Register skips the
 * pre-questions and goes straight to sign-in.
 *
 * Kept in its own localStorage key on purpose: sign-out only removes the session keys
 * (see UserProvider) and Clerk never touches it, so it survives logout. It holds no personal
 * data (no email or user id), only which events and when.
 */
const KEY = "ix:hackathonMember";
const VERSION = 1;
/** After a year without a visit, treat them as new again. */
const TTL_MS = 365 * 24 * 60 * 60 * 1000;

export type HackathonMember = {
  /** Event slugs this browser has been signed in on. */
  slugs: string[];
  /** Finished registration (profile done) on at least one of them. */
  registered: boolean;
  /** Last time it was confirmed. */
  at: number;
};

export function readHackathonMember(now = Date.now()): HackathonMember | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<HackathonMember> & { v?: number };
    if (parsed.v !== VERSION || !Array.isArray(parsed.slugs) || typeof parsed.at !== "number") return null;
    if (now - parsed.at > TTL_MS) return null;
    return { slugs: parsed.slugs.filter((s) => typeof s === "string"), registered: parsed.registered === true, at: parsed.at };
  } catch {
    return null;
  }
}

/** Call while signed in on a hackathon page. Never downgrades `registered`. */
export function markHackathonMember(slug: string, registered: boolean, now = Date.now()): void {
  if (typeof window === "undefined" || !slug) return;
  try {
    const prev = readHackathonMember(now);
    const next = {
      v: VERSION,
      slugs: prev?.slugs.includes(slug) ? prev.slugs : [...(prev?.slugs ?? []), slug].slice(-10),
      registered: Boolean(prev?.registered || registered),
      at: now,
    };
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / storage full: they just see the questions again */
  }
}

/** Remember this browser while someone is signed in on a hackathon page. */
export function useMarkHackathonMember(slug: string, signedIn: boolean | undefined, registered = false): void {
  useEffect(() => {
    if (signedIn) markHackathonMember(slug, registered);
  }, [slug, signedIn, registered]);
}

/** Read after mount (localStorage isn't there during server render, and this avoids a hydration mismatch). */
export function useHackathonMember(): HackathonMember | null {
  const [member, setMember] = useState<HackathonMember | null>(null);
  useEffect(() => setMember(readHackathonMember()), []);
  return member;
}
