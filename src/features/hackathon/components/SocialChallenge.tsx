"use client";

import { useState } from "react";
import { AlertCircle, Check, Copy, ExternalLink, Instagram, Linkedin, Loader2 } from "lucide-react";
import { toHackathonError, type HackathonMe } from "../api";
import { useSubmitHackathonSocial } from "../hooks";
import { hkInputClass, hkSecondaryButton } from "./ResumeChallenge";

const SUGGESTED_CAPTION =
  "I just took two AI mock interviews in the InterviewTrix Hackathon 2026 — Navigating Careers in 2027! 🚀 #InterviewTrix #InterviewTrixHackathon";

const LINKEDIN_RE = /^https:\/\/([a-z]+\.)?linkedin\.com\/(posts\/|feed\/update\/urn:li:(activity|share|ugcPost):)/i;
const INSTAGRAM_RE = /^https:\/\/(www\.|m\.)?instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]{5,}/i;

export function SocialChallenge({ me }: Readonly<{ me: HackathonMe }>) {
  const state = me.progress.social.state;
  const editable = me.hackathon.phase === "live" && !me.progress.completed;
  const submitted = me.social && me.social.reviewStatus !== "rejected";
  const [editing, setEditing] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState(me.social?.linkedinUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(me.social?.instagramUrl ?? "");
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const submit = useSubmitHackathonSocial();
  const serverError = submit.error ? toHackathonError(submit.error).message : null;

  const showForm = (state === "available" && !submitted) || (editing && editable);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    const li = linkedinUrl.trim();
    const ig = instagramUrl.trim();
    if (!LINKEDIN_RE.test(li)) {
      setLocalError("Paste the link to your LinkedIn post (it should start with https://www.linkedin.com/posts/).");
      return;
    }
    if (!INSTAGRAM_RE.test(ig)) {
      setLocalError("Paste the link to your Instagram post (it should start with https://www.instagram.com/p/).");
      return;
    }
    submit.mutate({ linkedinUrl: li, instagramUrl: ig }, { onSuccess: () => setEditing(false) });
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(SUGGESTED_CAPTION);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  if (state === "locked" && !me.social) return null;

  return (
    <div className="space-y-5">
      {me.social?.reviewStatus === "rejected" ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-[#8a3560]/70 bg-[#2e1330]/50 px-4 py-3 text-sm text-[#ffb3cb]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Your links were not accepted{me.social.reviewNote ? `: ${me.social.reviewNote}` : "."} Please share new posts
            and submit the links again.
          </span>
        </p>
      ) : null}

      {submitted && !editing ? (
        <div className="space-y-3">
          {[
            { icon: Linkedin, label: "LinkedIn post", url: me.social!.linkedinUrl },
            { icon: Instagram, label: "Instagram post", url: me.social!.instagramUrl },
          ].map(({ icon: Icon, label, url }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-[#1f8a82]/60 bg-[#0c3238]/40 px-4 py-3 text-sm text-[#dbe9f8] hover:text-white"
            >
              <Icon className="size-4 shrink-0 text-[#4ee6cf]" aria-hidden />
              <span className="font-semibold">{label}</span>
              <span className="min-w-0 flex-1 truncate text-[#9eb2ca]">{url}</span>
              <ExternalLink className="size-4 shrink-0" aria-hidden />
            </a>
          ))}
          <p className="text-xs text-[#7189a6]">
            {me.social!.reviewStatus === "approved"
              ? "Verified by the InterviewTrix team."
              : "Our team will check these links during judging."}
          </p>
          {editable ? (
            <button type="button" className={hkSecondaryButton} onClick={() => setEditing(true)}>
              Edit links
            </button>
          ) : null}
        </div>
      ) : null}

      {showForm ? (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="rounded-2xl border border-[#27547d]/80 bg-[#071426]/60 p-4">
            <p className="text-sm text-[#cfdbe8]">
              Share a post about your mock interview on <strong className="text-white">LinkedIn</strong> and{" "}
              <strong className="text-white">Instagram</strong>, then paste both post links below. Posts must be public.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="min-w-0 flex-1 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-[#9eb2ca]">{SUGGESTED_CAPTION}</p>
              <button type="button" onClick={() => void copyCaption()} className={hkSecondaryButton}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy caption"}
              </button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="hk-linkedin" className="flex items-center gap-2 text-sm font-semibold text-[#dbe9f8]">
                <Linkedin className="size-4 text-[#6fc0ff]" aria-hidden /> LinkedIn post URL
              </label>
              <input
                id="hk-linkedin"
                type="url"
                inputMode="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://www.linkedin.com/posts/…"
                className={hkInputClass}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="hk-instagram" className="flex items-center gap-2 text-sm font-semibold text-[#dbe9f8]">
                <Instagram className="size-4 text-[#ff5f97]" aria-hidden /> Instagram post URL
              </label>
              <input
                id="hk-instagram"
                type="url"
                inputMode="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://www.instagram.com/p/…"
                className={hkInputClass}
              />
            </div>
          </div>
          {localError || serverError ? (
            <p role="alert" className="flex items-start gap-2 text-sm text-[#ff6f9f]">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {localError ?? serverError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={submit.isPending} className="hk-btn h-12 w-full px-6 text-sm disabled:pointer-events-none disabled:opacity-60 sm:w-auto">
              {submit.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Submitting…
                </>
              ) : (
                "Submit links"
              )}
            </button>
            {editing ? (
              <button type="button" className={hkSecondaryButton} onClick={() => setEditing(false)}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
