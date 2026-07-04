"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Headphones,
  Loader2,
  Mic,
  MonitorUp,
  Video,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatHumanDuration, formatPeerSchedule } from "@/components/peer/peerSlotTime";
import { usePeerMeetingRecording } from "@/hooks/usePeerMeetingRecording";
import { PeerInterviewerMarkDoneFlow } from "@/components/peer/PeerInterviewerMarkDoneFlow";
import { PeerMeetingChatPanel } from "@/components/peer/PeerMeetingChatPanel";
import { PeerBookingViewReportLink } from "@/components/peer/PeerBookingViewReportButton";
import { appPrimaryButton } from "@/lib/app-theme";
import { dashboardHeroStatPalette } from "@/lib/dashboard-stat-themes";
import { cn } from "@/lib/utils";
import { peerApi, type PeerBooking } from "@/lib/api";

function useMeetingTimer(start: string, end: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const remainingSec = Math.max(0, Math.floor((endMs - now) / 1000));
  const untilStartSec = Math.max(0, Math.floor((startMs - now) / 1000));
  const pastEnd = now > endMs;
  const beforeStart = now < startMs;

  let remainingText: string;
  let remainingHint: string;

  if (beforeStart) {
    remainingText = `Starts in ${formatHumanDuration(untilStartSec)}`;
    remainingHint = "Until your scheduled start time";
  } else if (pastEnd) {
    remainingText = "Session ended";
    remainingHint = "Past your scheduled end time";
  } else {
    remainingText = `${formatHumanDuration(remainingSec)} left`;
    remainingHint = "Until your scheduled end time";
  }

  return {
    remainingText,
    remainingHint,
    pastEnd,
  };
}

function StepCard({
  step,
  title,
  description,
  done,
  active,
  children,
}: {
  step: number;
  title: string;
  description: string;
  done?: boolean;
  active?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 transition-all sm:p-5",
        done
          ? "border-emerald-500/30 bg-emerald-500/[0.04]"
          : active
            ? "border-[#7367F0]/40 bg-[#7367F0]/[0.05] shadow-[0_8px_30px_rgba(115,103,240,0.12)]"
            : "border-border/60 bg-card/60",
      )}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
            done
              ? "bg-emerald-500 text-white"
              : active
                ? "bg-[#7367F0] text-white shadow-[0_4px_14px_rgba(115,103,240,0.45)]"
                : "bg-muted text-muted-foreground",
          )}
        >
          {done ? <CheckCircle2 className="h-5 w-5" /> : step}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          {children ? <div className="pt-3">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({
  icon: Icon,
  label,
  done,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  done?: boolean;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5">
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          done ? "bg-emerald-500/15 text-emerald-600" : "bg-[#7367F0]/10 text-[#7367F0]",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className={cn("text-sm leading-snug", done ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
      {done ? <CheckCircle2 className="ml-auto mt-1 h-4 w-4 shrink-0 text-emerald-600" /> : null}
    </li>
  );
}

function PreFlightChecklistCard({
  isInterviewer,
  isRecording,
  meetOpened,
}: {
  isInterviewer: boolean;
  isRecording: boolean;
  meetOpened: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
            <Headphones className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">Pre-flight checklist</h2>
            <p className="text-xs text-muted-foreground">Quick tips for a smooth session</p>
          </div>
        </div>
      </div>

      <ul className="space-y-2 p-4">
        {isInterviewer ? (
          <>
            <ChecklistItem
              icon={MonitorUp}
              label="Use Chrome or Edge on desktop for screen recording"
              done={isRecording}
            />
            <ChecklistItem
              icon={Video}
              label="Share full screen or window — not a single browser tab"
              done={isRecording}
            />
            <ChecklistItem
              icon={ExternalLink}
              label="Join Google Meet after recording starts"
              done={meetOpened}
            />
            <ChecklistItem
              icon={Mic}
              label="Meet transcription may be used for the interview report"
            />
          </>
        ) : (
          <>
            <ChecklistItem icon={Wifi} label="Use a stable internet connection" />
            <ChecklistItem icon={Mic} label="Unmute when speaking and find a quiet space" />
            <ChecklistItem
              icon={Video}
              label="The interviewer records the session for review"
            />
          </>
        )}
      </ul>
    </div>
  );
}

type SessionEndPhase = "idle" | "uploading" | "success";

function SessionEndOverlay({ phase }: { phase: "uploading" | "success" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 text-center shadow-card">
        {phase === "uploading" ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#7367F0]/10">
              <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
            </div>
            <p className="text-lg font-semibold text-foreground">Uploading video…</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Please keep this tab open while your session recording is saved.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-foreground">Interview successfully done</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Returning to your booking page…
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function PeerMeetingRoom({
  booking: initialBooking,
  timezone,
  timezoneLabel,
  onLeave,
  onSessionComplete,
}: {
  booking: PeerBooking;
  timezone: string;
  timezoneLabel: string;
  onLeave: (opts?: { feedback?: boolean }) => void;
  onSessionComplete?: () => void;
}) {
  const [booking, setBooking] = useState(initialBooking);
  const [meetOpened, setMeetOpened] = useState(false);
  const [recordingHandled, setRecordingHandled] = useState(false);
  const [sessionEndPhase, setSessionEndPhase] = useState<SessionEndPhase>("idle");
  const [markDoneFlowOpen, setMarkDoneFlowOpen] = useState(false);
  const timer = useMeetingTimer(booking.start, booking.end);
  const { user } = useUser();

  const isInterviewer = booking.viewerRole === "interviewer";
  const canMarkDone =
    isInterviewer &&
    !booking.interviewerMarkedDone &&
    (booking.status === "paid_confirmed" || booking.status === "completed");
  const interviewMarkedDone = booking.interviewerMarkedDone;

  const { isRecording, uploading, startRecording, stopRecording } =
    usePeerMeetingRecording(booking.id);

  const autoStoppedRef = useRef(false);
  const sessionDurationSec = Math.max(
    0,
    Math.floor(
      (new Date(booking.end).getTime() - new Date(booking.start).getTime()) / 1000,
    ),
  );
  const sessionDurationLabel = formatHumanDuration(sessionDurationSec);

  const endTime = new Date(booking.end).toLocaleTimeString("en-IN", {
    timeZone: timezone,
    timeStyle: "short",
  });

  const openMeet = () => {
    if (interviewMarkedDone) {
      toast.error("This interview has been marked done");
      return;
    }
    if (isInterviewer && !isRecording) {
      toast.error("Start screen recording first, then join Google Meet");
      return;
    }
    if (!booking.videoLink) {
      toast.error("No meeting link on this booking");
      return;
    }
    window.open(booking.videoLink, "_blank", "noopener,noreferrer");
    setMeetOpened(true);
  };

  const handleLeave = async () => {
    if (sessionEndPhase !== "idle") return;
    if (isInterviewer && isRecording) {
      await stopRecording();
    }
    onLeave();
  };

  const finishEndSession = useCallback(async () => {
    setSessionEndPhase("uploading");
    const saved = await stopRecording({ silent: true });
    if (!saved) {
      setSessionEndPhase("idle");
      toast.error("Could not save the session recording. Please try again.");
      return;
    }
    setRecordingHandled(true);
    setSessionEndPhase("success");
  }, [stopRecording]);

  const handleEndSession = () => {
    if (!isRecording || sessionEndPhase !== "idle") return;
    void finishEndSession();
  };

  useEffect(() => {
    setBooking(initialBooking);
  }, [initialBooking]);

  useEffect(() => {
    if (!timer.pastEnd || !isRecording || autoStoppedRef.current || sessionEndPhase !== "idle") {
      return;
    }
    autoStoppedRef.current = true;
    void finishEndSession();
  }, [timer.pastEnd, isRecording, sessionEndPhase, finishEndSession]);

  useEffect(() => {
    if (sessionEndPhase !== "success" || !onSessionComplete) return;
    const timeoutId = setTimeout(() => onSessionComplete(), 2500);
    return () => clearTimeout(timeoutId);
  }, [sessionEndPhase, onSessionComplete]);

  useEffect(() => {
    if (!meetOpened) return;

    const poll = async () => {
      try {
        const fresh = await peerApi.getBooking(booking.id);
        setBooking(fresh);
      } catch {
        /* ignore transient poll errors */
      }
    };

    const id = setInterval(() => void poll(), 30_000);
    void poll();
    return () => clearInterval(id);
  }, [meetOpened, booking.id]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 md:px-6 md:py-8">
      {sessionEndPhase === "uploading" || sessionEndPhase === "success" ? (
        <SessionEndOverlay phase={sessionEndPhase} />
      ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleLeave()}
            disabled={sessionEndPhase !== "idle"}
            className="h-9 rounded-full px-3 text-muted-foreground hover:bg-muted/80 hover:text-foreground disabled:opacity-50"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Leave room
          </Button>
          {isInterviewer && isRecording ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
              <Circle className="h-2 w-2 fill-current animate-pulse" />
              Recording live
            </span>
          ) : null}
        </div>

        <section
          className={cn(
            "relative overflow-hidden rounded-2xl border p-5 sm:p-6 md:p-8",
            dashboardHeroStatPalette.shell,
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(115,103,240,0.08),transparent_50%)]"
          />

          <div className="relative space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.14em]",
                    dashboardHeroStatPalette.label,
                  )}
                >
                  InterviewTrix meeting room
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {booking.bookingRef}
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {formatPeerSchedule(booking.start, timezone)} – {endTime}
                  <span className="mx-2 text-border">·</span>
                  {timezoneLabel}
                </p>
              </div>

              <div className="shrink-0">
                <div
                  className={cn(
                    "rounded-xl border px-4 py-3 shadow-sm backdrop-blur-sm sm:min-w-[200px]",
                    interviewMarkedDone
                      ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                      : "border-[#7367F0]/15 bg-card/80",
                  )}
                >
                  {interviewMarkedDone ? (
                    <>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        Status
                      </p>
                      <p className="mt-1 text-lg font-semibold leading-snug text-emerald-700 dark:text-emerald-300 sm:text-xl">
                        Interview was Marked done
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        This session is complete
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#7367F0]">
                        Time left
                      </p>
                      <p className="mt-1 text-lg font-semibold leading-snug text-foreground sm:text-xl">
                        {timer.remainingText}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{timer.remainingHint}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            {isInterviewer ? (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">Session workflow</h2>
                  <p className="text-sm text-muted-foreground">
                    Follow these steps in order before and during the interview.
                  </p>
                </div>

                <div className="space-y-3">
                  <StepCard
                    step={1}
                    title="Start screen recording"
                    description="Share your entire screen or an application window. Audio capture is recommended."
                    done={isRecording}
                    active={!isRecording && !interviewMarkedDone}
                  >
                    <div className="flex flex-wrap gap-2">
                      {!isRecording ? (
                        <Button
                          onClick={() => void startRecording()}
                          disabled={uploading || interviewMarkedDone}
                          className={cn("gap-2 rounded-xl", appPrimaryButton)}
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MonitorUp className="h-4 w-4" />
                          )}
                          Start recording
                        </Button>
                      ) : null}
                    </div>
                    {interviewMarkedDone && !isRecording ? (
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        This interview is marked done. Recording is no longer available.
                      </p>
                    ) : !isRecording ? (
                      <p className="mt-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                        In the browser picker, choose <strong>Entire screen</strong> or{" "}
                        <strong>Window</strong> and enable audio if prompted.
                      </p>
                    ) : (
                      <p className="mt-3 text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
                        Recording is active. You can return to this tab anytime during the call.
                      </p>
                    )}
                  </StepCard>

                  <StepCard
                    step={2}
                    title="Join Google Meet"
                    description="Opens in a new tab. Recording must be running before you can join."
                    done={meetOpened}
                    active={isRecording && !meetOpened && !interviewMarkedDone}
                  >
                    <Button
                      onClick={openMeet}
                      disabled={!isRecording || interviewMarkedDone}
                      className={cn(
                        "gap-2 rounded-xl",
                        isRecording ? appPrimaryButton : "opacity-60",
                      )}
                      variant={isRecording ? "default" : "outline"}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Join Google Meet
                    </Button>
                  </StepCard>

                  <StepCard
                    step={3}
                    title="Conduct the interview"
                    description={`Keep recording running until the scheduled end (${sessionDurationLabel}). It saves automatically, or use End Session to finish early.`}
                    done={timer.pastEnd}
                    active={meetOpened && !timer.pastEnd && !interviewMarkedDone}
                  />
                </div>
              </>
            ) : (
              <>
                <PreFlightChecklistCard
                  isInterviewer={false}
                  isRecording={isRecording}
                  meetOpened={meetOpened}
                />
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
                <div className="border-b border-border/60 bg-gradient-to-br from-[#7367F0]/[0.08] via-transparent to-transparent px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7367F0]/15 text-[#7367F0]">
                      <Video className="h-6 w-6" />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Ready to join?</h2>
                      <p className="text-sm text-muted-foreground">
                        Your interviewer will start recording, then join the call.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-5 sm:p-6">
                  {interviewMarkedDone ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      This interview has been marked done. The Google Meet link is no longer
                      available from this room.
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      When you&apos;re set, open Google Meet in a new tab. Use a stable connection
                      and unmute when it&apos;s your turn to speak.
                    </p>
                  )}
                  <Button
                    onClick={openMeet}
                    size="lg"
                    disabled={interviewMarkedDone}
                    className={cn(
                      "h-12 w-full gap-2 rounded-xl text-base sm:w-auto sm:px-8",
                      interviewMarkedDone ? "opacity-60" : appPrimaryButton,
                    )}
                    variant={interviewMarkedDone ? "outline" : "default"}
                  >
                    <ExternalLink className="h-5 w-5" />
                    Join Google Meet
                  </Button>
                </div>
              </div>
              </>
            )}

            {isInterviewer && (isRecording || recordingHandled) ? (
              <div className="rounded-2xl border border-[#7367F0]/25 bg-[#7367F0]/[0.06] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Session wrap-up</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isRecording
                        ? `Recording saves automatically when your ${sessionDurationLabel} session ends. Use End Session below to finish early and save the video.`
                        : uploading
                          ? "Uploading your session recording…"
                          : `Recording saved. Your ${sessionDurationLabel} session is complete.`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {isRecording && sessionEndPhase === "idle" ? (
                      <Button
                        size="lg"
                        onClick={handleEndSession}
                        disabled={uploading}
                        className={cn("rounded-xl", appPrimaryButton)}
                      >
                        End Session
                      </Button>
                    ) : sessionEndPhase === "success" || recordingHandled ? (
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Recording saved
                      </span>
                    ) : null}
                    {canMarkDone ? (
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setMarkDoneFlowOpen(true)}
                        disabled={sessionEndPhase === "uploading"}
                        className="gap-2 rounded-xl border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark interview done
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : canMarkDone ? (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Finish this interview</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      When the session is complete, mark it done to record your earning and share
                      feedback with the candidate.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => setMarkDoneFlowOpen(true)}
                    className={cn("shrink-0 gap-2 rounded-xl", appPrimaryButton)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark interview done
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-4 lg:col-span-2">
            <PeerMeetingChatPanel
              bookingId={booking.id}
              viewerClerkId={user?.id}
              viewerRole={booking.viewerRole}
            />

            {isInterviewer ? (
              <PreFlightChecklistCard
                isInterviewer
                isRecording={isRecording}
                meetOpened={meetOpened}
              />
            ) : null}

            {booking.reportStatus && booking.reportStatus !== "none" ? (
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Report
                </p>
                <p className="mt-1 text-sm font-medium capitalize text-foreground">
                  {booking.reportStatus.replaceAll("_", " ")}
                </p>
                {booking.peerReportId ? (
                  <PeerBookingViewReportLink
                    booking={booking}
                    timezone={timezone}
                    className="mt-2 inline-flex text-sm font-medium text-[#7367F0] hover:underline"
                  >
                    View report →
                  </PeerBookingViewReportLink>
                ) : null}
              </div>
            ) : null}

            {booking.reportStatus === "processing" ? (
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-[#7367F0]" />
                Generating interview report…
              </div>
            ) : null}
          </aside>
        </div>

      <PeerInterviewerMarkDoneFlow
        booking={booking}
        open={markDoneFlowOpen}
        onOpenChange={setMarkDoneFlowOpen}
        timezone={timezone}
        interviewLabel={booking.interviewType}
        onSuccess={(updated) => setBooking(updated)}
      />
    </div>
  );
}
