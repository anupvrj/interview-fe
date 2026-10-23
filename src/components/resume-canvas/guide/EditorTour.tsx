"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Volume2, VolumeX, X } from "lucide-react";
import { boxOf, type GuideStep } from "./guideTargets";
import { cardPosition } from "./guideLayout";
import { playClick, setSoundMuted, soundMuted, unlockSound } from "./guideSound";

type Box = { left: number; top: number; width: number; height: number };
const PAD = 6;

function useBox(find: (() => HTMLElement | null) | null, reveal: boolean | undefined) {
  const [box, setBox] = useState<Box | null>(null);
  useEffect(() => {
    if (!find) {
      setBox(null);
      return;
    }
    const first = find();
    if (first && reveal) first.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    const read = () => {
      const el = find();
      const next = el ? boxOf(el) : null;
      setBox((prev) =>
        prev && next && Math.abs(prev.left - next.left) < 1 && Math.abs(prev.top - next.top) < 1 && Math.abs(prev.width - next.width) < 1 && Math.abs(prev.height - next.height) < 1
          ? prev
          : next,
      );
    };
    read();
    const timer = window.setInterval(read, 250);
    window.addEventListener("resize", read);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", read);
    };
  }, [find, reveal]);
  return box;
}

function confetti() {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:90";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    canvas.remove();
    return;
  }
  const colors = ["#7c5cf6", "#9b7bff", "#22c55e", "#f59e0b", "#ec4899", "#38bdf8"];
  const parts = Array.from({ length: 140 }, () => ({
    x: canvas.width / 2, y: canvas.height * 0.42, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 13 - 4,
    s: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[(Math.random() * colors.length) | 0],
  }));
  let t = 0;
  const frame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - t / 130);
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    }
    if (++t < 140) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

export type TourEnd = "done" | "skipped";

/**
 * The spotlight tour. `welcome` shows the "Hi …" card first (first visit); a replay starts
 * straight at step 1. `flyTo` is where the "all set" card tucks away (the checklist pill).
 */
export function EditorTour({
  steps,
  isMobile,
  firstName,
  welcome,
  welcomeTitle,
  welcomeBody = "A quick 30-second tour of the tools that matter.",
  mini = false,
  flyTo,
  onStep,
  onEnd,
}: Readonly<{
  steps: GuideStep[];
  isMobile: boolean;
  firstName: string | null;
  welcome: boolean;
  /** Welcome card text (defaults: "Hi <name>! Let's make your resume shine"). */
  welcomeTitle?: string;
  welcomeBody?: string;
  /** One "Show me" pointer from the checklist: "Got it" ends it, no celebration. */
  mini?: boolean;
  flyTo: () => { x: number; y: number } | null;
  onStep: (index: number, step: GuideStep) => void;
  onEnd: (how: TourEnd) => void;
}>) {
  const [phase, setPhase] = useState<"welcome" | "steps" | "finish">(welcome ? "welcome" : "steps");
  const [index, setIndex] = useState(0);
  const [entered, setEntered] = useState(false);
  const finishRef = useRef<HTMLDivElement>(null);
  const [fly, setFly] = useState<{ left: number; top: number; width: number; scale: number; opacity: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(180);
  const [muted, setMuted] = useState(() => soundMuted());

  // Skip steps whose button isn't on screen (e.g. a narrow tablet hides one).
  const [list] = useState(() => {
    const found = steps.filter((s) => s.find());
    return found.length ? found : steps;
  });
  const step = phase === "steps" ? list[Math.min(index, list.length - 1)] : null;
  const box = useBox(step ? step.find : null, step?.reveal);

  useEffect(() => {
    if (step) onStep(index, step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index]);

  // One "tick" per step, in time with the cursor's first press.
  useEffect(() => {
    if (phase !== "steps") return;
    const t = window.setTimeout(playClick, 1510);
    return () => window.clearTimeout(t);
  }, [phase, index]);

  // Re-run the entry animation for each card.
  useEffect(() => {
    setEntered(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(id);
  }, [phase, index]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [phase, index, entered]);

  const next = useCallback(() => {
    unlockSound();
    if (phase === "welcome") return setPhase("steps");
    if (index < list.length - 1) return setIndex((i) => i + 1);
    if (mini) return onEnd("done");
    setPhase("finish");
  }, [phase, index, list.length, mini, onEnd]);
  const back = useCallback(() => {
    unlockSound();
    setIndex((i) => Math.max(0, i - 1));
  }, []);
  const skip = useCallback(() => onEnd("skipped"), [onEnd]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
      else if (phase === "steps" && e.key === "ArrowRight") next();
      else if (phase === "steps" && e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, next, back, skip]);

  // Finish: confetti, "all set", then it tucks into the checklist pill.
  useEffect(() => {
    if (phase !== "finish") return;
    confetti();
    let t2 = 0;
    const t1 = window.setTimeout(() => {
      const card = finishRef.current?.getBoundingClientRect();
      const target = flyTo() ?? { x: window.innerWidth - 80, y: window.innerHeight - 80 };
      if (!card) return;
      // Pin it where it is, then send it to the pill (left/top/scale transition).
      setFly({ left: card.left, top: card.top, width: card.width, scale: 1, opacity: 1 });
      t2 = window.setTimeout(
        () => setFly({ left: target.x - card.width / 2, top: target.y - card.height / 2, width: card.width, scale: 0.12, opacity: 0 }),
        40,
      );
    }, 1800);
    const t3 = window.setTimeout(() => onEnd("done"), 2650);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [phase, flyTo, onEnd]);

  if (typeof document === "undefined") return null;
  const on = entered ? " eg-on" : "";

  return createPortal(
    <div className="eg-root eg-layer" role="dialog" aria-modal="true" aria-label="Editor tour">
      {phase === "welcome" ? (
        <>
          <div className={`eg-scrim${on}`} />
          <div className="fixed inset-0 grid place-items-center px-4">
            <div ref={cardRef} className={`eg-pop${on} relative w-full max-w-[340px] rounded-[22px] bg-background p-6 text-center shadow-2xl`}>
              <span className="eg-sparkle" style={{ left: 28, top: 22 }} aria-hidden>✨</span>
              <span className="eg-sparkle" style={{ right: 32, top: 38, animationDelay: "0.5s" }} aria-hidden>⭐</span>
              <div className="eg-wave" aria-hidden>👋</div>
              <h3 className="mt-2 text-xl font-bold text-foreground">
                {firstName ? `Hi ${firstName}! ` : "Hi! "}
                {welcomeTitle ?? "Let\u2019s make your resume shine"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{welcomeBody}</p>
              <div className="mt-5 flex justify-center gap-2">
                <button type="button" className="eg-ghost" onClick={skip}>Later</button>
                <button type="button" className="eg-primary" onClick={next} autoFocus>Start the tour →</button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {phase === "steps" && step ? (
        <>
          {box ? (
            <div
              className="eg-spot eg-on"
              style={{ left: box.left - PAD, top: box.top - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 }}
            >
              <i className="eg-ring" />
              <i className="eg-ring eg-r2" />
            </div>
          ) : (
            <div className="eg-scrim eg-on" />
          )}
          {box ? (
            <>
              {/* Cursor glides to the target and "clicks": press + zooming circles from its tip. */}
              <div
                className="eg-click eg-on"
                key={`click-${index}`}
                aria-hidden
                style={{ left: box.left + Math.min(box.width / 2, 120), top: box.top + Math.min(box.height / 2, 160) }}
              >
                <i />
                <i />
              </div>
              <div
                className="eg-cursor eg-on"
                aria-hidden
                style={{ left: box.left + Math.min(box.width / 2, 120) - 3, top: box.top + Math.min(box.height / 2, 160) - 3 }}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M3 2.5l15.5 9.2-6.7 1.6 3.9 7.3-2.9 1.5-3.9-7.3-4.9 4.6z" fill="#fff" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </div>
            </>
          ) : null}
          <div
            ref={cardRef}
            key={`card-${index}`}
            className={`eg-card${on}`}
            style={box ? cardPosition(box, isMobile, cardH) : { left: 12, right: 12, bottom: 24 }}
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-2 text-[15px] font-semibold">
                <span className="eg-emoji" aria-hidden>{step.emoji}</span>
                {step.title}
              </p>
              <div className="-mr-1 -mt-1 flex items-center">
                <button
                  type="button"
                  aria-label={muted ? "Turn click sound on" : "Turn click sound off"}
                  title={muted ? "Sound off" : "Sound on"}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const next = !muted;
                    setMuted(next);
                    setSoundMuted(next);
                    if (!next) {
                      unlockSound();
                      playClick();
                    }
                  }}
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button type="button" aria-label="Close tour" className="rounded-full p-1 text-muted-foreground hover:text-foreground" onClick={skip}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            <div className="mt-3.5 flex items-center justify-between">
              <div className="eg-dots" aria-hidden>
                {mini ? null : list.map((s, i) => <i key={s.id} className={i === index ? "eg-cur" : ""} />)}
              </div>
              <div className="flex items-center gap-1">
                {mini ? null : index > 0 ? (
                  <button type="button" className="eg-ghost" onClick={back}>Back</button>
                ) : (
                  <button type="button" className="eg-ghost" onClick={skip}>Skip</button>
                )}
                <button type="button" className="eg-primary" onClick={next} autoFocus>
                  {mini ? "Got it" : index === list.length - 1 ? "Finish 🎉" : `Next · ${index + 1}/${list.length}`}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {phase === "finish" ? (
        <div className="fixed inset-0 grid place-items-center px-4">
          <div
            ref={finishRef}
            className={`eg-pop${on} eg-fly w-full max-w-[300px] rounded-[22px] bg-background p-6 text-center shadow-2xl`}
            style={
              fly
                ? { position: "fixed", left: fly.left, top: fly.top, width: fly.width, transform: `scale(${fly.scale})`, opacity: fly.opacity, animation: "none" }
                : undefined
            }
          >
            <div className="eg-bounce text-[46px]" aria-hidden>🎉</div>
            <h3 className="mt-1 text-xl font-bold text-foreground">You&apos;re all set!</h3>
            <p className="text-sm text-muted-foreground">Your setup checklist is in the corner.</p>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
