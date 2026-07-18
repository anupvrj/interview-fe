"use client";

import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MousePointer2,
  Sparkles,
  Star,
  UsersRound,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_INTERVIEWERS = [
  {
    name: "Priya S.",
    company: "Google",
    role: "Senior SWE",
    rating: 4.9,
    slots: 3,
    initial: "P",
    accent: "from-violet-500/20 to-[#7367F0]/30",
  },
  {
    name: "Rahul M.",
    company: "Amazon",
    role: "Staff Engineer",
    rating: 4.8,
    slots: 5,
    initial: "R",
    accent: "from-sky-500/15 to-cyan-500/20",
  },
  {
    name: "Ananya K.",
    company: "Microsoft",
    role: "Engineering Manager",
    rating: 5.0,
    slots: 2,
    initial: "A",
    accent: "from-emerald-500/15 to-teal-500/20",
  },
] as const;

const ROUND_TAGS = ["DSA", "System design", "HR rounds"] as const;

const MOCK_SLOTS = [
  { day: "Wed", time: "6:30 PM", round: "DSA" },
  { day: "Thu", time: "7:00 PM", round: "System design" },
  { day: "Sat", time: "11:00 AM", round: "HR round" },
] as const;

const STEPS = [
  { label: "Browse", detail: "Verified engineers" },
  { label: "Select", detail: "Pick your interviewer" },
  { label: "Schedule", detail: "Choose a slot" },
  { label: "Booked", detail: "You're all set" },
] as const;

type Phase = "list" | "select" | "slot" | "booked";

const STAGGER_MS = 380;
const SELECT_MS = 2000;
const SLOT_MS = 2400;
const BOOKED_MS = 2600;
const LOOP_GAP_MS = 900;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function StepPills({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {STEPS.map((step, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        return (
          <div
            key={step.label}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold transition-all duration-500 sm:text-[10px]",
              isActive &&
                "bg-[#7367F0] text-white shadow-md shadow-[#7367F0]/25",
              isDone && "bg-emerald-500/15 text-emerald-700",
              !isActive && !isDone && "bg-muted/80 text-muted-foreground",
            )}
          >
            {isDone ? (
              <CheckCircle2 className="h-2.5 w-2.5 shrink-0" aria-hidden />
            ) : (
              <span
                className={cn(
                  "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px]",
                  isActive ? "bg-white/20" : "bg-[#7367F0]/10 text-[#7367F0]",
                )}
              >
                {index + 1}
              </span>
            )}
            {step.label}
          </div>
        );
      })}
    </div>
  );
}

function VerifiedCallout({ floating = false }: { floating?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#7367F0]/15 bg-card px-2.5 py-2 shadow-md sm:px-3 sm:py-2",
        floating && "peer-hero-float-a absolute left-0 top-0 z-20",
      )}
    >
      <div className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600 sm:text-[10px]">
        Verified
      </div>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-800 sm:text-xs">
        <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
        Top-company engineers
      </div>
    </div>
  );
}

function LiveMockCallout({ floating = false }: { floating?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#7367F0]/15 bg-card px-2.5 py-2 shadow-md sm:px-3 sm:py-2",
        floating && "peer-hero-float-b absolute right-0 top-0 z-20",
      )}
    >
      <div className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7367F0] sm:text-[10px]">
        Live session
      </div>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-800 sm:text-xs">
        <Video className="h-3.5 w-3.5 text-[#7367F0]" aria-hidden />
        Mock + feedback
      </div>
    </div>
  );
}

function DirectoryWindow({
  visibleCount,
  selectedIndex,
  phase,
  compact = false,
}: {
  visibleCount: number;
  selectedIndex: number;
  phase: Phase;
  compact?: boolean;
}) {
  const showCursor = phase === "select";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[#7367F0]/15 bg-card shadow-md",
        compact
          ? "relative"
          : "absolute inset-x-1 bottom-1 top-8 sm:inset-x-2 sm:bottom-1.5 sm:top-9",
      )}
    >
      <div className="flex h-7 items-center gap-2 border-b border-border/60 bg-[#7367F0]/[0.04] px-2.5 sm:h-8 sm:px-3">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#7367F0]">
          <UsersRound className="h-3 w-3 text-white" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-slate-900 sm:text-[11px]">
            Find your interviewer
          </p>
          <p className="truncate text-[9px] text-slate-500 sm:text-[10px]">
            DSA · System design · HR rounds
          </p>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          {ROUND_TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#7367F0]/10 px-1.5 py-0.5 text-[8px] font-semibold text-[#7367F0]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <ul className={cn("relative divide-y divide-border/60 p-1 sm:p-1.5", compact && "min-h-[195px]")}>
        {MOCK_INTERVIEWERS.map((person, index) => {
          const isVisible = index < visibleCount;
          const isSelected = selectedIndex === index && phase !== "list";
          return (
            <li
              key={person.name}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-all duration-500 sm:gap-2.5 sm:px-2 sm:py-2",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                isSelected &&
                  "bg-[#7367F0]/10 ring-2 ring-[#7367F0]/35 shadow-sm",
              )}
              style={{
                transitionDelay: isVisible ? `${index * 80}ms` : "0ms",
              }}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-[#7367F0] sm:h-9 sm:w-9",
                  person.accent,
                )}
              >
                {person.initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-slate-900 sm:text-xs">
                  {person.name}
                </p>
                <p className="truncate text-[9px] text-slate-500 sm:text-[10px]">
                  {person.role} · {person.company}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 sm:text-[11px]">
                  <Star
                    className="h-2.5 w-2.5 fill-amber-400 text-amber-400 sm:h-3 sm:w-3"
                    aria-hidden
                  />
                  {person.rating}
                </p>
                <p className="text-[8px] text-slate-500 sm:text-[9px]">
                  {person.slots} open slots
                </p>
              </div>

              {showCursor && isSelected ? (
                <div className="peer-hero-cursor pointer-events-none absolute left-[42%] top-[72%] z-10 text-[#7367F0] drop-shadow-md">
                  <MousePointer2 className="h-4 w-4 fill-[#7367F0] sm:h-[18px] sm:w-[18px]" />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SlotPickerCard({
  activeSlot,
  visible,
  floating = false,
}: {
  activeSlot: number;
  visible: boolean;
  floating?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#7367F0]/15 bg-card p-2.5 shadow-md transition-all duration-500 sm:p-3",
        floating
          ? "peer-hero-float-c absolute bottom-1.5 left-1/2 z-30 w-[calc(100%-1rem)] max-w-[280px] -translate-x-1/2 sm:bottom-2 sm:max-w-[300px]"
          : "relative w-full",
        visible
          ? "translate-y-0 opacity-100"
          : floating
            ? "pointer-events-none translate-y-4 opacity-0"
            : "opacity-100",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <CalendarCheck className="h-3.5 w-3.5 text-[#7367F0]" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7367F0] sm:text-[11px]">
          Pick a slot
        </span>
      </div>
      <p className="mb-2 text-[10px] text-muted-foreground sm:text-[11px]">
        Priya S. · DSA mock interview
      </p>
      <div className="space-y-1">
        {MOCK_SLOTS.map((slot, index) => {
          const isActive = index === activeSlot;
          return (
            <div
              key={`${slot.day}-${slot.time}`}
              className={cn(
                "flex items-center justify-between rounded-lg border px-2 py-1.5 text-[10px] transition-all duration-300 sm:text-[11px]",
                isActive
                  ? "border-[#7367F0]/40 bg-[#7367F0]/10 font-semibold text-[#7367F0]"
                  : "border-slate-200 bg-slate-50 text-slate-600",
              )}
            >
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                {slot.day} · {slot.time}
              </span>
              <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-medium">
                {slot.round}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookedConfirmation({
  visible,
  floating = false,
}: {
  visible: boolean;
  floating?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-emerald-200/80 bg-emerald-50/95 p-2.5 shadow-md transition-all duration-500 sm:p-3",
        floating
          ? "peer-hero-float-c absolute bottom-1.5 left-1/2 z-30 w-[calc(100%-1rem)] max-w-[280px] -translate-x-1/2 sm:bottom-2 sm:max-w-[300px]"
          : "relative w-full",
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : floating
            ? "pointer-events-none translate-y-4 scale-95 opacity-0"
            : "opacity-100",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/25">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-emerald-800 sm:text-xs">
            Mock interview booked!
          </p>
          <p className="mt-0.5 text-[10px] text-emerald-700/90 sm:text-[11px]">
            Wed · 6:30 PM · DSA with Priya S.
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600 sm:text-[10px]">
            <Sparkles className="h-3 w-3" aria-hidden />
            Pay after interviewer accepts
          </p>
        </div>
      </div>
    </div>
  );
}

function phaseToStepIndex(phase: Phase): number {
  switch (phase) {
    case "list":
      return 0;
    case "select":
      return 1;
    case "slot":
      return 2;
    case "booked":
      return 3;
    default:
      return 0;
  }
}

export function PeerInterviewsHeroPreview({ className }: { className?: string }) {
  const cancelled = useRef(false);
  const [phase, setPhase] = useState<Phase>("list");
  const [visibleCount, setVisibleCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeSlot, setActiveSlot] = useState(0);

  useEffect(() => {
    cancelled.current = false;

    const loop = async () => {
      while (!cancelled.current) {
        setPhase("list");
        setVisibleCount(0);
        setSelectedIndex(0);
        setActiveSlot(0);

        for (let i = 1; i <= MOCK_INTERVIEWERS.length; i++) {
          if (cancelled.current) return;
          setVisibleCount(i);
          await sleep(STAGGER_MS);
        }

        if (cancelled.current) return;
        await sleep(500);
        if (cancelled.current) return;

        setPhase("select");
        await sleep(SELECT_MS);
        if (cancelled.current) return;

        setPhase("slot");
        for (let s = 0; s < MOCK_SLOTS.length; s++) {
          if (cancelled.current) return;
          setActiveSlot(s);
          await sleep(SLOT_MS / MOCK_SLOTS.length);
        }
        if (cancelled.current) return;
        await sleep(400);

        setPhase("booked");
        await sleep(BOOKED_MS);
        if (cancelled.current) return;
        await sleep(LOOP_GAP_MS);
      }
    };

    void loop();
    return () => {
      cancelled.current = true;
    };
  }, []);

  const stepIndex = phaseToStepIndex(phase);
  const showSlotCard = phase === "slot";
  const showBookedCard = phase === "booked";

  return (
    <div className={cn("relative mx-auto w-full max-w-[480px]", className)}>
      <div
        className="pointer-events-none absolute -inset-2 rounded-2xl bg-[#7367F0]/8 blur-xl sm:-inset-3"
        aria-hidden="true"
      />

      <div className="peer-hero-shell relative overflow-hidden rounded-xl border border-[#7367F0]/15 bg-card/90 p-2.5 shadow-lg sm:p-3">
        <div className="relative mb-2 px-0.5 sm:mb-2.5">
          <StepPills activeIndex={stepIndex} />
          <p className="mt-1.5 text-[10px] text-muted-foreground sm:text-[11px]">
            {STEPS[stepIndex].detail}
          </p>
        </div>

        {/* Mobile: stacked layout */}
        <div className="relative flex flex-col gap-2 sm:hidden">
          <div className="flex items-start justify-between gap-2">
            <VerifiedCallout />
            <LiveMockCallout />
          </div>

          <DirectoryWindow
            visibleCount={visibleCount}
            selectedIndex={selectedIndex}
            phase={phase}
            compact
          />

          {showSlotCard ? (
            <SlotPickerCard activeSlot={activeSlot} visible />
          ) : null}
          {showBookedCard ? <BookedConfirmation visible /> : null}
        </div>

        {/* Desktop: layered floating layout */}
        <div className="relative hidden h-[300px] sm:block">
          <DirectoryWindow
            visibleCount={visibleCount}
            selectedIndex={selectedIndex}
            phase={phase}
          />

          <VerifiedCallout floating />
          <LiveMockCallout floating />

          <SlotPickerCard
            activeSlot={activeSlot}
            visible={showSlotCard}
            floating
          />
          <BookedConfirmation visible={showBookedCard} floating />
        </div>
      </div>

      <style jsx global>{`
        @keyframes peer-hero-float-a {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        @keyframes peer-hero-float-b {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes peer-hero-float-c {
          0%,
          100% {
            transform: translate(-50%, 0);
          }
          50% {
            transform: translate(-50%, -5px);
          }
        }
        @keyframes peer-hero-cursor {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(4px, 3px);
          }
        }
        .peer-hero-float-a {
          animation: peer-hero-float-a 4.5s ease-in-out infinite;
        }
        .peer-hero-float-b {
          animation: peer-hero-float-b 5s ease-in-out infinite 0.4s;
        }
        .peer-hero-float-c {
          animation: peer-hero-float-c 4.8s ease-in-out infinite 0.2s;
        }
        .peer-hero-cursor {
          animation: peer-hero-cursor 2.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .peer-hero-float-a,
          .peer-hero-float-b,
          .peer-hero-float-c,
          .peer-hero-cursor {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
