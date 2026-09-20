"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Clock3,
  Mic,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveIntegrityStatus } from "@/lib/integrity/resolveIntegrityStatus";
import type {
  IntegrityEventType,
  IntegrityReport,
  IntegrityViolation,
} from "@/lib/integrity/types";
import { useIntegrityConfig } from "@/hooks/useIntegrityConfig";
import { cn } from "@/lib/utils";
import {
  appBadgeDanger,
  appBadgeSuccess,
  appCard,
  appPrimaryButton,
} from "@/lib/app-theme";

type CheckStatus = "pass" | "flagged" | "review" | "skipped";
type FilterId = "all" | "passed" | "flagged" | "skipped";

const MATCHING_CHECK_IDS = new Set(["voice", "identity", "speech"]);

const CHECK_SETTING: Record<
  string,
  | "clipboardLock"
  | "tabBlur"
  | "facePresence"
  | "camera"
  | "voiceprint"
  | "faceIdentity"
  | "liveSpeech"
  | "turnLatency"
> = {
  clipboard: "clipboardLock",
  tab: "tabBlur",
  face: "facePresence",
  camera: "camera",
  voice: "voiceprint",
  identity: "faceIdentity",
  speech: "liveSpeech",
  latency: "turnLatency",
};

const CHECKS: Array<{
  id: string;
  label: string;
  passLabel: string;
  failLabel: string;
  skipLabel?: string;
  icon: LucideIcon;
  types: IntegrityEventType[];
}> = [
  {
    id: "clipboard",
    label: "Clipboard",
    passLabel: "No external paste or injection",
    failLabel: "Clipboard or burst typing was flagged",
    icon: Clipboard,
    types: ["CLIPBOARD_ATTEMPT", "BURST_KEYSTROKE_INJECTION"],
  },
  {
    id: "tab",
    label: "Tab focus",
    passLabel: "Stayed on the interview tab",
    failLabel: "Left the interview tab",
    icon: Clock3,
    types: ["TAB_BLUR"],
  },
  {
    id: "face",
    label: "Face presence",
    passLabel: "One person stayed in camera",
    failLabel: "Absence or extra face was flagged",
    icon: ScanFace,
    types: ["CANDIDATE_ABSENT", "MULTIPLE_FACES_DETECTED"],
  },
  {
    id: "camera",
    label: "Camera",
    passLabel: "Camera stayed available",
    failLabel: "Camera was unavailable",
    icon: Camera,
    types: ["CAMERA_UNAVAILABLE"],
  },
  {
    id: "voice",
    label: "Voiceprint",
    passLabel: "No voice mismatch on the mic",
    failLabel: "Mic voice did not match enrollment",
    skipLabel: "Voice matching did not run",
    icon: Mic,
    types: ["VOICEPRINT_MISMATCH"],
  },
  {
    id: "identity",
    label: "Face identity",
    passLabel: "Face matched the stored credential",
    failLabel: "Face did not match the stored credential",
    skipLabel: "Face matching did not run",
    icon: UserRound,
    types: ["FACE_IDENTITY_MISMATCH"],
  },
  {
    id: "speech",
    label: "Live speech",
    passLabel: "Speech lined up with a visible speaker",
    failLabel: "Speech on the mic while the mouth was still",
    skipLabel: "Live speech matching did not run",
    icon: UserRound,
    types: ["SPEECH_WITHOUT_MOUTH_MOVEMENT"],
  },
  {
    id: "latency",
    label: "Answer timing",
    passLabel: "No extreme delay starting answers",
    failLabel: "Long delay before answering was flagged",
    icon: Clock3,
    types: ["HIGH_TURN_LATENCY"],
  },
];

function integrityHeaderIcon(
  matchingSkipped: boolean,
  classification: IntegrityReport["classification"],
): LucideIcon {
  if (matchingSkipped) return ShieldQuestion;
  if (classification === "VERIFIED_AUTHENTIC") return ShieldCheck;
  if (classification === "SUSPICIOUS_REVIEW_REQUIRED") return ShieldQuestion;
  return ShieldAlert;
}

function integrityHeaderCopy(
  matchingSkipped: boolean,
  audience: "candidate" | "reviewer",
): string {
  if (matchingSkipped) {
    return "Green = ran and stayed clean. Red = flagged. Gray = skipped because face or voice matching did not run. Separate from skill score.";
  }
  if (audience === "candidate") {
    return "Green checks stayed clean. Red items were flagged for review. This is separate from your skill score and never auto-fails.";
  }
  return "Green = clean check. Red = flagged for review. Separate from skill score — never auto-fail.";
}

function timelineEmptyCopy(
  selectedStatus: CheckStatus | undefined,
  filter: FilterId,
  selectedCheck: string | null,
): string {
  if (selectedStatus === "skipped" || filter === "skipped") {
    return "This check was skipped, so nothing was logged.";
  }
  if (selectedCheck) return "This check stayed green — nothing was logged.";
  return "No flagged events in this session.";
}

function classificationLabel(value: IntegrityReport["classification"]): string {
  switch (value) {
    case "VERIFIED_AUTHENTIC":
      return "Verified authentic";
    case "SUSPICIOUS_REVIEW_REQUIRED":
      return "Needs review";
    default:
      return "Breach suspected";
  }
}

function statusOf(
  types: IntegrityEventType[],
  timeline: IntegrityViolation[],
): CheckStatus {
  const hits = timeline.filter((item) => types.includes(item.type));
  if (hits.length === 0) return "pass";
  if (hits.some((item) => item.penalty > 0)) return "flagged";
  return "review";
}

function ringStroke(classification: IntegrityReport["classification"]): string {
  if (classification === "VERIFIED_AUTHENTIC") return "stroke-emerald-500";
  if (classification === "SUSPICIOUS_REVIEW_REQUIRED") return "stroke-amber-500";
  return "stroke-rose-500";
}

function checkTone(status: CheckStatus): string {
  if (status === "skipped") {
    return "border-slate-200/80 bg-slate-100/70 text-slate-500 hover:bg-slate-100 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-400";
  }
  if (status === "pass") {
    return "border-emerald-200/80 bg-emerald-50/80 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30";
  }
  if (status === "flagged") {
    return "border-rose-200/80 bg-rose-50/80 hover:bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30";
  }
  return "border-amber-200/80 bg-amber-50/80 hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30";
}

function checkIconTone(status: CheckStatus): string {
  if (status === "skipped") {
    return "bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  }
  if (status === "pass") return "bg-emerald-600 text-white";
  if (status === "flagged") return "bg-rose-600 text-white";
  return "bg-amber-500 text-white";
}

function checkBadgeClass(status: CheckStatus): string {
  if (status === "skipped") {
    return "inline-flex items-center rounded-md bg-slate-200/80 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
  if (status === "pass") return appBadgeSuccess;
  if (status === "flagged") return appBadgeDanger;
  return "inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
}

function checkBadgeLabel(status: CheckStatus): string {
  if (status === "skipped") return "Skipped";
  if (status === "pass") return "Passed";
  if (status === "flagged") return "Flagged";
  return "Review";
}

function classificationText(classification: IntegrityReport["classification"]): string {
  if (classification === "VERIFIED_AUTHENTIC") {
    return "text-emerald-700 dark:text-emerald-400";
  }
  if (classification === "SUSPICIOUS_REVIEW_REQUIRED") {
    return "text-amber-700 dark:text-amber-400";
  }
  return "text-rose-700 dark:text-rose-400";
}

function filterChipClass(id: FilterId, active: boolean): string {
  const base =
    "h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors";
  if (!active) {
    return cn(
      base,
      "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary",
    );
  }
  if (id === "passed") return cn(base, "border-emerald-600 bg-emerald-600 text-white");
  if (id === "flagged") return cn(base, "border-rose-600 bg-rose-600 text-white");
  if (id === "skipped") return cn(base, "border-slate-500 bg-slate-500 text-white");
  return cn(base, "border-[#7367F0] bg-[#7367F0] text-white");
}

function ScoreRing({
  score,
  classification,
}: Readonly<{
  score: number;
  classification: IntegrityReport["classification"];
}>) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0)) / 100);
  const stroke = ringStroke(classification);
  return (
    <div className="relative h-[5.5rem] w-[5.5rem] shrink-0 sm:h-24 sm:w-24">
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90" aria-hidden>
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth="8"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          className={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold tabular-nums leading-none sm:text-xl">
          {score}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  );
}

function IntegrityCheckRow({
  icon: Icon,
  label,
  detail,
  status,
  selected,
  onSelect,
}: Readonly<{
  icon: LucideIcon;
  label: string;
  detail: string;
  status: CheckStatus;
  selected: boolean;
  onSelect: () => void;
}>) {
  const isPass = status === "pass";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex h-full min-h-11 w-full min-w-0 items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors sm:px-4",
        checkTone(status),
        selected && "ring-2 ring-[#7367F0]/40 ring-offset-2 ring-offset-background",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          checkIconTone(status),
        )}
      >
        {isPass ? (
          <CheckCircle2 className="h-4 w-4" aria-hidden />
        ) : (
          <Icon className="h-4 w-4" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-sm font-semibold",
              status === "skipped" && "text-slate-600 dark:text-slate-300",
            )}
          >
            {label}
          </span>
          <span className={checkBadgeClass(status)}>{checkBadgeLabel(status)}</span>
        </span>
        <span
          className={cn(
            "mt-0.5 block text-xs leading-relaxed sm:text-sm",
            status === "skipped"
              ? "text-slate-500 dark:text-slate-400"
              : "text-muted-foreground",
          )}
        >
          {detail}
        </span>
      </span>
    </button>
  );
}

export function IntegrityMissingPrompt({
  audience = "reviewer",
  compact = false,
}: Readonly<{
  audience?: "candidate" | "reviewer";
  compact?: boolean;
}>) {
  const isCandidate = audience === "candidate";
  return (
    <section
      className={cn(
        appCard,
        "overflow-hidden",
        compact
          ? "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          : "px-4 py-5 sm:px-6",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 items-start gap-3",
          compact && "sm:items-center",
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <ShieldQuestion className="h-5 w-5 text-amber-600" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold sm:text-lg">
            Integrity score missing
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {isCandidate
              ? "Your biometric credentials are yet to be verified. Verify here to generate an integrity score."
              : "No identity credential was on file for this session, so biometric matching did not run. Clipboard, tab, and camera checks still apply. This is separate from the skill score."}
          </p>
        </div>
      </div>
      {isCandidate ? (
        <Button
          asChild
          className={cn(appPrimaryButton, "h-11 w-full shrink-0 sm:w-auto")}
        >
          <Link href="/dashboard/identity-verification">Verify here</Link>
        </Button>
      ) : null}
    </section>
  );
}

export function IntegrityReportCard({
  report,
  audience = "reviewer",
}: Readonly<{
  report: IntegrityReport | null | undefined;
  audience?: "candidate" | "reviewer";
}>) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [selectedCheck, setSelectedCheck] = useState<string | null>(null);
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  const {
    clipboardLock,
    tabBlur,
    camera,
    facePresence,
    faceIdentity,
    voiceprint,
    liveSpeech,
    turnLatency,
  } = useIntegrityConfig();
  const moduleOn = useMemo(
    () => ({
      clipboardLock,
      tabBlur,
      camera,
      facePresence,
      faceIdentity,
      voiceprint,
      liveSpeech,
      turnLatency,
    }),
    [
      clipboardLock,
      tabBlur,
      camera,
      facePresence,
      faceIdentity,
      voiceprint,
      liveSpeech,
      turnLatency,
    ],
  );

  const integrityStatus = resolveIntegrityStatus(report);

  const activeChecks = useMemo(
    () =>
      CHECKS.filter((check) => {
        const key = CHECK_SETTING[check.id];
        return !key || moduleOn[key];
      }),
    [moduleOn],
  );

  const disabledEventTypes = useMemo(() => {
    const types = new Set<IntegrityEventType>();
    for (const check of CHECKS) {
      const key = CHECK_SETTING[check.id];
      if (key && !moduleOn[key]) {
        for (const type of check.types) types.add(type);
      }
    }
    return types;
  }, [moduleOn]);

  const checks = useMemo(() => {
    if (!report) return [];
    const skipMatching = integrityStatus === "skipped";
    const skipVoice = skipMatching || report.voiceMatchRan === false;
    const skipFace = skipMatching || report.faceMatchRan === false;
    const skipSpeech =
      skipMatching ||
      report.speechMatchRan === false ||
      (report.speechMatchRan == null && report.voiceMatchRan === false);
    return activeChecks.map((check) => {
      if (
        (skipMatching && MATCHING_CHECK_IDS.has(check.id)) ||
        (skipVoice && check.id === "voice") ||
        (skipFace && check.id === "identity") ||
        (skipSpeech && check.id === "speech")
      ) {
        return {
          ...check,
          status: "skipped" as const,
          detail: check.skipLabel ?? "This check did not run",
        };
      }
      const status = statusOf(check.types, report.timeline ?? []);
      return {
        ...check,
        status,
        detail: status === "pass" ? check.passLabel : check.failLabel,
      };
    });
  }, [report, integrityStatus, activeChecks]);

  if (integrityStatus === "missing") {
    return <IntegrityMissingPrompt audience={audience} />;
  }

  if (!report) return null;

  if (integrityStatus === "processing") {
    return (
      <section className={cn(appCard, "overflow-hidden")}>
        <header className="px-4 py-5 sm:px-6">
          <h2 className="text-base font-semibold sm:text-lg">Session integrity</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Identity matching is processing. Refresh this report in a minute.
          </p>
        </header>
      </section>
    );
  }

  const matchingSkipped = integrityStatus === "skipped";
  const passed = checks.filter((c) => c.status === "pass");
  const flagged = checks.filter(
    (c) => c.status === "flagged" || c.status === "review",
  );
  const skipped = checks.filter((c) => c.status === "skipped");
  const Icon = integrityHeaderIcon(matchingSkipped, report.classification);
  const effectiveSelected = selectedCheck &&
    checks.some((check) => check.id === selectedCheck)
      ? selectedCheck
      : null;

  const visibleChecks = checks.filter((check) => {
    if (effectiveSelected) return check.id === effectiveSelected;
    if (filter === "passed") return check.status === "pass";
    if (filter === "flagged") {
      return check.status === "flagged" || check.status === "review";
    }
    if (filter === "skipped") return check.status === "skipped";
    return true;
  });

  const visibleEvents = (report.timeline ?? []).filter((item) => {
    if (item.type === "LIPSYNC_MISMATCH") return false;
    if (disabledEventTypes.has(item.type)) return false;
    if (effectiveSelected) {
      const check = activeChecks.find((c) => c.id === effectiveSelected);
      return check ? check.types.includes(item.type) : false;
    }
    if (filter === "passed") return false;
    return true;
  });

  const filters: Array<{ id: FilterId; label: string; count: number }> = [
    { id: "all", label: "All checks", count: checks.length },
    { id: "passed", label: "Passed", count: passed.length },
    { id: "flagged", label: "Flagged", count: flagged.length },
    ...(skipped.length > 0
      ? [{ id: "skipped" as const, label: "Skipped", count: skipped.length }]
      : []),
  ];

  const selectedStatus = effectiveSelected
    ? checks.find((check) => check.id === effectiveSelected)?.status
    : undefined;

  return (
    <section className={cn(appCard, "overflow-hidden")}>
      <header className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              matchingSkipped ? "bg-slate-500/10" : "bg-[#7367F0]/10",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                matchingSkipped ? "text-slate-600" : "text-[#7367F0]",
              )}
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold sm:text-lg">Session integrity</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {integrityHeaderCopy(matchingSkipped, audience)}
            </p>
          </div>
        </div>
        {matchingSkipped ? (
          <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-100/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Integrity skipped
              </p>
              <p className="text-xs text-slate-500">
                No face or voice score for this session
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <ScoreRing
              score={report.score}
              classification={report.classification}
            />
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", classificationText(report.classification))}>
                {classificationLabel(report.classification)}
              </p>
              <p className="text-xs text-muted-foreground">
                {report.deductedPoints > 0
                  ? `${report.deductedPoints} points deducted`
                  : "No points deducted"}
              </p>
            </div>
          </div>
        )}
      </header>

      <div
        className={cn(
          "grid gap-3 px-4 py-4 sm:px-6",
          skipped.length > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3",
        )}
      >
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:px-4">
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
            Passed
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {passed.length}
          </p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 dark:border-rose-900/50 dark:bg-rose-950/30 sm:px-4">
          <p className="text-xs font-medium text-rose-800 dark:text-rose-300">
            Flagged
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-rose-700 dark:text-rose-400">
            {flagged.length}
          </p>
        </div>
        {skipped.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40 sm:px-4">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Skipped
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-500 dark:text-slate-400">
              {skipped.length}
            </p>
          </div>
        ) : null}
        <div
          className={cn(
            "rounded-xl border border-border/60 bg-muted/20 px-3 py-3 sm:px-4",
            skipped.length === 0 && "col-span-2 sm:col-span-1",
          )}
        >
          <p className="text-xs font-medium text-muted-foreground">Events logged</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{report.eventCount}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3 sm:px-6">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setFilter(item.id);
              setSelectedCheck(null);
            }}
            className={filterChipClass(item.id, filter === item.id && !effectiveSelected)}
          >
            {item.label} · {item.count}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "grid gap-2 px-4 pb-4 sm:px-6 md:gap-3",
          visibleChecks.length === 1
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {visibleChecks.map((check) => (
          <IntegrityCheckRow
            key={check.id}
            icon={check.icon}
            label={check.label}
            detail={check.detail}
            status={check.status}
            selected={effectiveSelected === check.id}
            onSelect={() =>
              setSelectedCheck((current) =>
                current === check.id ? null : check.id,
              )
            }
          />
        ))}
      </div>

      {filter !== "passed" || effectiveSelected ? (
        <div className="border-t border-border/60 px-4 py-4 sm:px-6">
          <h3 className="text-sm font-semibold">Event timeline</h3>
          {visibleEvents.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {timelineEmptyCopy(selectedStatus, filter, effectiveSelected)}
            </p>
          ) : (
            <ol className="mt-3 space-y-2">
              {visibleEvents.map((item) => {
                const key = `${item.type}-${item.timestamp}`;
                const open = openEvent === key;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenEvent((current) => (current === key ? null : key))
                      }
                      className={cn(
                        "flex min-h-11 w-full min-w-0 items-start justify-between gap-3 rounded-xl border px-3 py-3 text-left sm:px-4",
                        item.penalty > 0
                          ? "border-rose-200 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20"
                          : "border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-snug">
                          {item.summary}
                        </span>
                        {open ? (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString()} ·{" "}
                            {item.type.replaceAll("_", " ")}
                          </span>
                        ) : (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Tap for time and event type
                          </span>
                        )}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {item.penalty > 0 ? (
                          <span className="text-xs font-semibold text-rose-600">
                            −{item.penalty}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-700">
                            review
                          </span>
                        )}
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            open && "rotate-180",
                          )}
                          aria-hidden
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      ) : null}
    </section>
  );
}

export function IntegrityReportCardForAudience({
  report,
  audience,
  alwaysShow = false,
}: Readonly<{
  report: IntegrityReport | null | undefined;
  audience: "candidate" | "reviewer";
  alwaysShow?: boolean;
}>) {
  const { isLoading, showReportToCandidate, showReportToReviewers } =
    useIntegrityConfig();
  if (isLoading && !alwaysShow) return null;
  if (!alwaysShow && audience === "candidate" && !showReportToCandidate) {
    return null;
  }
  if (!alwaysShow && audience === "reviewer" && !showReportToReviewers) {
    return null;
  }
  return <IntegrityReportCard report={report} audience={audience} />;
}
