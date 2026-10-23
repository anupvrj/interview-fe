"use client";

import "./editor-guide.css";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { trackEvent } from "@/lib/analytics/gtag";
import type { CanvasPanel } from "../CanvasChrome";
import { EditorTour, type TourEnd } from "./EditorTour";
import { SetupChecklist, type ChecklistItem } from "./SetupChecklist";
import { readGuide, writeGuide, type GuideState } from "./guideStorage";
import { exportButton, hackathonSubmitButton, resumePage, studioButton, tourSteps, type GuideStep } from "./guideTargets";

export type EditorGuideHandle = {
  /** "?" → Replay tour. */
  startTour: () => void;
  /** Something the checklist can't read from the resume happened ("fixed", "exported"). */
  milestone: (name: "fixed" | "exported") => void;
};

/** Tools that get a pulsing dot until they've been opened once. */
const BEACONS: Array<{ panel: CanvasPanel; label: string }> = [
  { panel: "fix", label: "ATS score" },
  { panel: "tailor", label: "Job match" },
  { panel: "ai", label: "AI Coach" },
];

const dialogOpen = () => Boolean(document.querySelector('[role="dialog"]:not([aria-label="Editor tour"]), [role="alertdialog"]'));

/**
 * First-run guide for the canvas editor: a spotlight tour, a "Resume setup" checklist and
 * beacons on tools not tried yet. Remembered per user in this browser (see guideStorage).
 * It reads the editor from the outside (button labels, props) and never changes the resume.
 */
export const EditorGuide = forwardRef<EditorGuideHandle, {
  userId: string | null;
  firstName: string | null;
  isMobile: boolean;
  /** Canvas editor on screen, resume loaded, nothing else taking over the page. */
  active: boolean;
  /** Made in the last day: start the tour by itself. Older resumes get a one-time prompt. */
  resumeIsNew: boolean;
  hackathon: boolean;
  hasContact: boolean;
  hasContent: boolean;
  atsChecked: boolean;
  openPanel: CanvasPanel | null;
  onOpenPanel: (panel: CanvasPanel) => void;
}>(function EditorGuide(props, ref) {
  const { userId, isMobile, active, resumeIsNew, hackathon, openPanel, onOpenPanel } = props;
  const [state, setState] = useState<GuideState | null>(null);
  const [tour, setTour] = useState<{ steps: GuideStep[]; welcome: boolean; mini: boolean; key: number } | null>(null);
  const [prompt, setPrompt] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [beacons, setBeacons] = useState<Array<{ panel: CanvasPanel; x: number; y: number }>>([]);
  const started = useRef(false);
  /** The first-visit decision (tour / prompt / nothing) is made; until then the pill waits. */
  const [settled, setSettled] = useState(false);

  const update = useCallback(
    (fn: (s: GuideState) => GuideState) => {
      setState((prev) => {
        if (!prev || !userId) return prev;
        const next = fn(prev);
        writeGuide(userId, next);
        return next;
      });
    },
    [userId],
  );

  useEffect(() => {
    if (userId) setState(readGuide(userId));
  }, [userId]);

  const startTour = useCallback(
    (welcome: boolean) => {
      setPrompt(false);
      setTour({ steps: tourSteps(isMobile, hackathon), welcome, mini: false, key: Date.now() });
      trackEvent("editor_guide_tour_start", { welcome, device: isMobile ? "phone" : "desktop" });
    },
    [isMobile, hackathon],
  );

  // First visit: start on its own (new resume) or offer it once (existing users).
  useEffect(() => {
    if (!active || !state || started.current) return;
    if (state.tour) {
      setSettled(true);
      return;
    }
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (tries > 20) {
        setSettled(true);
        return window.clearInterval(timer);
      }
      if (!resumePage() || dialogOpen()) return; // wait for the page, and for any dialog to close
      window.clearInterval(timer);
      started.current = true;
      setSettled(true);
      if (resumeIsNew) startTour(true);
      else if (!state.prompted) {
        setPrompt(true);
        update((s) => ({ ...s, prompted: true }));
        trackEvent("editor_guide_prompt_shown", {});
      }
    }, 600);
    return () => window.clearInterval(timer);
  }, [active, state, resumeIsNew, startTour, update]);

  // Tools opened count as explored (their beacon stops).
  useEffect(() => {
    if (!openPanel) return;
    update((s) => (s.explored.includes(openPanel) ? s : { ...s, explored: [...s.explored, openPanel] }));
  }, [openPanel, update]);

  // Phones: keep the pill out of the way while the keyboard is up.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || !isMobile) return;
    const read = () => setKeyboard(vv.height < window.innerHeight * 0.75);
    read();
    vv.addEventListener("resize", read);
    return () => vv.removeEventListener("resize", read);
  }, [isMobile]);

  const endTour = useCallback(
    (how: TourEnd) => {
      const wasMini = tour?.mini;
      setTour(null);
      // The tour scrolled the phone tab bar sideways; put it back.
      document.querySelector<HTMLElement>('nav[aria-label="Resume studio"]')?.scrollTo({ left: 0, behavior: "smooth" });
      if (wasMini) return;
      update((s) => ({ ...s, tour: s.tour === "done" ? "done" : how }));
      trackEvent(how === "done" ? "editor_guide_tour_complete" : "editor_guide_tour_skip", { device: isMobile ? "phone" : "desktop" });
    },
    [tour?.mini, update, isMobile],
  );

  useImperativeHandle(
    ref,
    () => ({
      startTour: () => startTour(false),
      milestone: (name) => update((s) => (s.milestones.includes(name) ? s : { ...s, milestones: [...s.milestones, name] })),
    }),
    [startTour, update],
  );

  const items = useMemo<ChecklistItem[]>(() => {
    const explored = state?.explored ?? [];
    const milestones = state?.milestones ?? [];
    return [
      { id: "contact", label: "Add your name & contact", done: props.hasContact },
      { id: "content", label: "Add experience or a project", done: props.hasContent },
      { id: "ats", label: "Check your ATS score", done: props.atsChecked || explored.includes("fix") },
      { id: "fix", label: "Fix one issue", done: milestones.includes("fixed") },
      { id: "export", label: hackathon ? "Submit to Hackathon" : "Download your resume", done: milestones.includes("exported") },
    ];
  }, [state, props.hasContact, props.hasContent, props.atsChecked, hackathon]);

  const lastDone = useRef<string>("");
  useEffect(() => {
    const done = items.filter((i) => i.done).map((i) => i.id).join(",");
    if (lastDone.current && done !== lastDone.current) trackEvent("editor_guide_checklist_progress", { done: items.filter((i) => i.done).length });
    lastDone.current = done;
  }, [items]);

  const showMe = useCallback(
    (id: string) => {
      trackEvent("editor_guide_show_me", { item: id });
      if (id === "ats" || id === "fix") return onOpenPanel("fix");
      const tap = isMobile ? "Tap" : "Click";
      const one: GuideStep | null =
        id === "contact"
          ? { id, emoji: "👤", title: "Your name & contact", body: `${tap} your name at the top of the page to edit it, then add your email and phone.`, find: resumePage }
          : id === "content"
            ? { id, emoji: "➕", title: "Add your experience", body: `${tap} here to add Experience or Projects.`, find: () => studioButton(isMobile ? "Section" : "Insert section"), reveal: true }
            : id === "export"
              ? hackathon
                ? { id, emoji: "🏁", title: "Submit when ready", body: `${tap} Submit to Hackathon — you can update it later.`, find: () => hackathonSubmitButton() ?? exportButton() }
                : { id, emoji: "📄", title: "Download your resume", body: `${tap} here for a recruiter-ready PDF.`, find: exportButton }
              : null;
      if (one) setTour({ steps: [one], welcome: false, mini: true, key: Date.now() });
    },
    [isMobile, hackathon, onOpenPanel],
  );

  // Beacons on tools not opened yet, once the tour has been seen.
  const tourSeen = Boolean(state?.tour);
  useEffect(() => {
    if (!active || !tourSeen || tour || prompt) {
      setBeacons([]);
      return;
    }
    const read = () => {
      const explored = state?.explored ?? [];
      const next: Array<{ panel: CanvasPanel; x: number; y: number }> = [];
      for (const b of BEACONS) {
        if (explored.includes(b.panel) || openPanel === b.panel) continue;
        const el = studioButton(b.label);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.right < 0 || r.left > window.innerWidth) continue;
        next.push({ panel: b.panel, x: r.right - 14, y: r.top + 4 });
      }
      setBeacons((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    read();
    const t = window.setInterval(read, 500);
    return () => window.clearInterval(t);
  }, [active, tourSeen, tour, prompt, state?.explored, openPanel]);

  if (!active || !state || typeof document === "undefined") return null;

  const checklistVisible = !state.checklistClosed && (resumeIsNew || state.tour === "done");
  const pillHidden = !settled || Boolean(tour) || prompt || keyboard || (isMobile && Boolean(openPanel));

  return (
    <>
      {tour ? (
        <EditorTour
          key={tour.key}
          steps={tour.steps}
          isMobile={isMobile}
          firstName={props.firstName}
          welcome={tour.welcome}
          mini={tour.mini}
          flyTo={() => {
            const pill = document.getElementById("eg-pill")?.getBoundingClientRect();
            if (pill) return { x: pill.left + pill.width / 2, y: pill.top + pill.height / 2 };
            return isMobile ? { x: window.innerWidth - 90, y: window.innerHeight - 110 } : { x: window.innerWidth - 110, y: window.innerHeight - 40 };
          }}
          onStep={(i, s) => trackEvent("editor_guide_tour_step", { step: i + 1, id: s.id })}
          onEnd={endTour}
        />
      ) : null}

      {prompt
        ? createPortal(
            <div className="eg-root fixed inset-x-0 z-40 flex justify-center px-3" style={{ bottom: isMobile ? 84 : 24 }}>
              <div className="eg-pop eg-on flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-background p-3 pl-4 shadow-2xl">
                <span className="eg-wave text-2xl" aria-hidden>👋</span>
                <p className="min-w-0 flex-1 text-sm">
                  <span className="block font-semibold text-foreground">New: a 30-second tour</span>
                  <span className="text-muted-foreground">See the tools that get your resume past screening.</span>
                </p>
                <button
                  type="button"
                  className="eg-ghost"
                  onClick={() => {
                    setPrompt(false);
                    update((s) => ({ ...s, tour: "skipped" }));
                    trackEvent("editor_guide_prompt_dismiss", {});
                  }}
                >
                  No thanks
                </button>
                <button type="button" className="eg-primary" onClick={() => startTour(false)}>
                  Show me
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {checklistVisible ? (
        <SetupChecklist
          items={items}
          isMobile={isMobile}
          hidden={pillHidden}
          onShowMe={showMe}
          onReplayTour={() => startTour(false)}
          onDismiss={() => {
            update((s) => ({ ...s, checklistClosed: true }));
            trackEvent("editor_guide_checklist_dismiss", {});
          }}
          onAllDone={() => {
            update((s) => ({ ...s, checklistClosed: true }));
            trackEvent("editor_guide_checklist_complete", {});
          }}
        />
      ) : null}

      {beacons.length
        ? createPortal(
            <>
              {beacons.map((b) => (
                <span key={b.panel} className="eg-beacon" style={{ left: b.x, top: b.y }} aria-hidden />
              ))}
            </>,
            document.body,
          )
        : null}
    </>
  );
});
