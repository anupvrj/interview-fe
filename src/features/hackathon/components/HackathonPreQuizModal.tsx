"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Bot, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { hackathonDisplay, hackathonMono, hackathonSans } from "@/lib/fonts/hackathon-reel";
import { persistPostAuthReturnPath } from "@/lib/post-sign-in-redirect";
import { cn } from "@/lib/utils";
import { HK_EVENTS, trackHackathon } from "../analytics";

/** Where Google sends the browser back to; finishes sign-in or sign-up (see app/(auth)/sso-callback). */
export const HACKATHON_SSO_CALLBACK = "/sso-callback";

type Step = "hold" | "attended" | "ready" | "onTheWay" | "google";
const QUESTION_STEPS: Step[] = ["hold", "attended", "ready", "onTheWay"];

/** The hackathon's primary button (matches .hk-btn, whose CSS only loads on hackathon pages). */
const PRIMARY_BTN =
  "group relative isolate inline-flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-[#3aa0ff] bg-[linear-gradient(135deg,#1273f5_0%,#1f95ff_55%,#35b1ff_100%)] px-6 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[0_14px_36px_rgba(20,130,255,0.42),inset_0_1px_0_rgba(255,255,255,0.25)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0";

const display = { fontFamily: "var(--font-hk-display), 'Arial Black', sans-serif" };
const mono = { fontFamily: "var(--font-hk-mono), ui-monospace, monospace" };

function RadioCard({
  name,
  value,
  label,
  hint,
  checked,
  onSelect,
}: Readonly<{ name: string; value: string; label: string; hint?: string; checked: boolean; onSelect: () => void }>) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all",
        "focus-within:ring-2 focus-within:ring-[#3aa6ff]/60",
        checked
          ? "border-[#3aa6ff] bg-[#0d2550] shadow-[0_0_0_1px_rgba(58,166,255,0.5),0_8px_28px_rgba(30,120,255,0.25)]"
          : "border-[#27547d]/80 bg-[#081a33] hover:border-[#3aa6ff]/60 hover:bg-[#0b2142]",
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="sr-only" />
      <span
        aria-hidden
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
          checked ? "border-[#3aa6ff]" : "border-[#4b6f96] group-hover:border-[#6fc0ff]",
        )}
      >
        <span className={cn("size-2.5 rounded-full bg-[#3aa6ff] transition-transform", checked ? "scale-100" : "scale-0")} />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-white">{label}</span>
        {hint ? <span className="block text-xs text-[#8fa6c2]">{hint}</span> : null}
      </span>
    </label>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/**
 * Signed-out "Register" on the hackathon: three quick questions to build excitement, then a
 * single "Continue with Google" (no form). New Google users are signed up on the way back.
 */
export function HackathonPreQuizModal({
  open,
  onOpenChange,
  returnTo,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where they land after Google (the hackathon profile/registration step). */
  returnTo: string;
}>) {
  const { signIn, isLoaded } = useSignIn();
  const [step, setStep] = useState<Step>("hold");
  const [attended, setAttended] = useState<"yes" | "no" | null>(null);
  const [ready, setReady] = useState<"yes" | "nervous" | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("hold");
    setAttended(null);
    setReady(null);
    setRedirecting(false);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (open) trackHackathon(HK_EVENTS.preQuizStep, { step });
  }, [open, step]);

  // Answer, then move on by itself — fewer taps.
  const answer = <T,>(set: (v: T) => void, value: T, next: Step, event: Record<string, string>) => {
    set(value);
    trackHackathon(HK_EVENTS.preQuizStep, { step, ...event });
    window.setTimeout(() => setStep(next), 280);
  };

  const continueWithGoogle = async () => {
    if (!isLoaded || !signIn) return;
    setError(null);
    setRedirecting(true);
    trackHackathon(HK_EVENTS.signupMethod, { method: "google", source: "pre_quiz" });
    persistPostAuthReturnPath(returnTo);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: HACKATHON_SSO_CALLBACK,
        redirectUrlComplete: returnTo,
      });
    } catch {
      setRedirecting(false);
      setError("Couldn't open Google sign-in. Try again, or use another way below.");
    }
  };

  const stepIndex = QUESTION_STEPS.indexOf(step === "google" ? "onTheWay" : step);
  const back: Partial<Record<Step, Step>> = { attended: "hold", ready: "attended", onTheWay: "ready", google: "onTheWay" };

  return (
    <Dialog open={open} onOpenChange={(next) => !redirecting && onOpenChange(next)}>
      <DialogContent
        overlayClassName="bg-[#020810]/80 backdrop-blur-sm"
        className={cn(
          hackathonDisplay.variable,
          hackathonMono.variable,
          hackathonSans.variable,
          "w-[calc(100%-1.5rem)] max-w-[26rem] gap-0 overflow-hidden rounded-[22px] border border-[#2a64b0]/70 bg-[#06142c] p-0 text-[#dbe9f8] shadow-none [&>button]:hidden",
        )}
      >
        {/* Header: progress + close */}
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-1.5" aria-hidden>
            {QUESTION_STEPS.map((s, i) => (
              <span
                key={s}
                className={cn("h-1.5 rounded-full transition-all", i <= stepIndex ? "w-7 bg-[#3aa6ff]" : "w-4 bg-[#1b3c62]")}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={redirecting}
            onClick={() => onOpenChange(false)}
            className="grid size-8 place-items-center rounded-full text-[#8fa6c2] hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <X className="size-4" />
          </button>
        </div>

        <div key={step} className="animate-in fade-in slide-in-from-right-4 px-6 pb-6 pt-4 duration-300">
          {step === "hold" ? (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6fc0ff]" style={mono}>
                Hold on a sec!
              </p>
              <DialogTitle className="mt-3 text-[1.35rem] font-extrabold leading-tight text-white" style={display}>
                Your next interviewer might be an <span className="text-[#3aa6ff]">AI</span>
              </DialogTitle>
              <DialogDescription className="mt-3 text-[15px] leading-relaxed text-[#b4c6db]">
                Companies are moving their screening rounds to AI. The Hiring Games lets you face one before it counts.
              </DialogDescription>
              <div className="mt-6 grid size-14 place-items-center rounded-2xl border border-[#3aa6ff]/40 bg-[#0d2550]">
                <Bot className="size-7 text-[#6fc0ff]" aria-hidden />
              </div>
              <button type="button" onClick={() => setStep("attended")} className={cn(PRIMARY_BTN, "mt-6")} style={mono}>
                Tell me more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </button>
            </>
          ) : step === "attended" ? (
            <fieldset>
              <legend className="contents">
                <DialogTitle className="text-[1.3rem] font-extrabold leading-tight text-white" style={display}>
                  Have you attended an AI interview recently?
                </DialogTitle>
              </legend>
              <DialogDescription className="sr-only">Choose yes or no.</DialogDescription>
              <div className="mt-5 space-y-3">
                <RadioCard name="attended" value="yes" label="Yes, I have" hint="Then you know how different it feels" checked={attended === "yes"} onSelect={() => answer(setAttended, "yes", "ready", { attended: "yes" })} />
                <RadioCard name="attended" value="no" label="Not yet" hint="Better to try one here first" checked={attended === "no"} onSelect={() => answer(setAttended, "no", "ready", { attended: "no" })} />
              </div>
            </fieldset>
          ) : step === "ready" ? (
            <fieldset>
              <legend className="contents">
                <DialogTitle className="text-[1.3rem] font-extrabold leading-tight text-white" style={display}>
                  Ready to take on an AI interview and build your confidence?
                </DialogTitle>
              </legend>
              <DialogDescription className="sr-only">Choose an answer.</DialogDescription>
              <div className="mt-5 space-y-3">
                <RadioCard name="ready" value="yes" label="Yes, bring it on" checked={ready === "yes"} onSelect={() => answer(setReady, "yes", "onTheWay", { ready: "yes" })} />
                <RadioCard name="ready" value="nervous" label="A little nervous" hint="That's exactly what practice is for" checked={ready === "nervous"} onSelect={() => answer(setReady, "nervous", "onTheWay", { ready: "nervous" })} />
              </div>
            </fieldset>
          ) : step === "onTheWay" ? (
            <div className="text-center">
              <div className="relative mx-auto grid size-20 place-items-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#3aa6ff]/20" aria-hidden />
                <span className="relative grid size-16 place-items-center rounded-full border-2 border-[#3aa6ff]/60 bg-[#0d2550]">
                  <Bot className="size-8 text-[#6fc0ff]" aria-hidden />
                </span>
              </div>
              <DialogTitle className="mt-5 text-[1.35rem] font-extrabold leading-tight text-white" style={display}>
                Your AI interviewer is on the way
              </DialogTitle>
              <DialogDescription className="mt-2 text-[15px] text-[#b4c6db]">
                One tap to join, and your first challenge is waiting.
              </DialogDescription>
              <button type="button" onClick={() => setStep("google")} className={cn(PRIMARY_BTN, "mt-6")} style={mono}>
                Join The Hiring Games <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <DialogTitle className="text-[1.3rem] font-extrabold leading-tight text-white" style={display}>
                Join in one tap
              </DialogTitle>
              <DialogDescription className="mt-2 text-[15px] text-[#b4c6db]">
                Sign in with Google — no forms, no passwords.
              </DialogDescription>
              <button
                type="button"
                onClick={() => void continueWithGoogle()}
                disabled={!isLoaded || redirecting}
                className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white px-5 text-[15px] font-semibold text-[#1f2937] shadow-lg transition hover:bg-[#f1f5f9] disabled:opacity-70"
              >
                {redirecting ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <GoogleMark />}
                {redirecting ? "Opening Google…" : "Continue with Google"}
              </button>
              {error ? <p className="mt-3 text-sm text-[#ff8a8a]" role="alert">{error}</p> : null}
              <p className="mt-4 text-xs text-[#7189a6]">
                No Google account?{" "}
                <Link href={`/sign-up?redirect_url=${encodeURIComponent(returnTo)}`} className="font-semibold text-[#6fc0ff] hover:underline">
                  Sign up with email
                </Link>
              </p>
            </div>
          )}

          {back[step] && !redirecting ? (
            <button
              type="button"
              onClick={() => setStep(back[step]!)}
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#7189a6] hover:text-[#b4c6db]"
            >
              <ArrowLeft className="size-3.5" aria-hidden /> Back
            </button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
