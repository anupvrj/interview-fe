"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  systemDesignApi,
  type SystemDesignProblemDetail,
  type SystemDesignSession,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { invalidateAfterSystemDesignSessionFromStorage } from "@/lib/invalidate-queries";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  Trophy,
  Video,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  SystemDesignVoiceClient,
  type SystemDesignVoiceDiagramBridge,
  type SystemDesignVoiceSessionHandle,
} from "@/components/system-design/SystemDesignVoiceClient";
import { HorizontalResizeHandle } from "@/components/layout/HorizontalResizeHandle";
import {
  HORIZONTAL_SPLITTER_PX,
  useHorizontalPaneResize,
} from "@/hooks/useHorizontalPaneResize";
import { useMediaMinWidth } from "@/hooks/useMediaMinWidth";
import { useSystemDesignSessionRecording } from "@/hooks/useSystemDesignSessionRecording";
import { useWorkspaceRowWidth } from "@/hooks/useWorkspaceRowWidth";

// Dynamically import Excalidraw (no SSR)
const ExcalidrawBoard = dynamic(
  () => import("@/components/system-design/ExcalidrawBoard"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    ),
  },
);

function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

function RequirementList({
  title,
  items,
  dotClass,
}: {
  readonly title: string;
  readonly items: string[];
  readonly dotClass: string;
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-1.5 text-xs text-gray-300"
          >
            <span
              className={cn("mt-1 h-1 w-1 shrink-0 rounded-full", dotClass)}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProblemScenario({ scenario }: { readonly scenario: string }) {
  if (!scenario.trim()) {
    return (
      <p className="text-xs italic text-gray-500">No scenario text available.</p>
    );
  }
  if (looksLikeHtml(scenario)) {
    return (
      <div
        className="prose prose-invert prose-sm max-w-none text-xs leading-relaxed text-gray-300 [&_li]:text-gray-300 [&_p]:text-gray-300"
        dangerouslySetInnerHTML={{ __html: scenario }}
      />
    );
  }
  return (
    <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300">
      {scenario}
    </p>
  );
}

const SD_SIDEBAR_MIN_PX = 280;
const SD_WHITEBOARD_MIN_PX = 400;
const SD_SIDEBAR_DEFAULT_PX = 380;

const SCREEN_RECORD_DISPLAY_OPTIONS = {
  video: {
    displaySurface: "browser",
    width: { ideal: 1920, max: 3840 },
    height: { ideal: 1080, max: 2160 },
    frameRate: { ideal: 30, max: 60 },
  } as MediaTrackConstraints,
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    suppressLocalAudioPlayback: false,
  } as MediaTrackConstraints,
  selfBrowserSurface: "include" as MediaTrackSupportedConstraints,
  preferCurrentTab: true,
} as DisplayMediaStreamOptions & {
  preferCurrentTab?: boolean;
  selfBrowserSurface?: string;
};

function useInterviewElapsed(
  voiceReady: boolean,
  loading: boolean,
  finalized: boolean,
) {
  const [elapsed, setElapsed] = useState(0);
  const prevVoiceReady = useRef(false);
  useEffect(() => {
    if (voiceReady && !prevVoiceReady.current) {
      setElapsed(0);
    }
    prevVoiceReady.current = voiceReady;
  }, [voiceReady]);

  const ticking =
    voiceReady && !loading && !finalized;
  useEffect(() => {
    if (!ticking) return undefined;
    const id = window.setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [ticking]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function SystemDesignSessionPage() {
  const params = useParams<{ sessionId: string | string[] }>();
  const sessionId =
    typeof params.sessionId === "string"
      ? params.sessionId
      : (params.sessionId?.[0] ?? "");

  const reportHref = useMemo(
    () => `/dashboard/system-design/${encodeURIComponent(sessionId)}/report`,
    [sessionId],
  );

  const {
    videoRef,
    mediaStreamRef,
    acquireCameraAndMic,
    attachScreenAndBeginRecording,
    stopMediaRecorderAndUpload,
    isRecording,
    cameraReady,
    cameraError,
    setCameraError,
    setCameraReady,
  } = useSystemDesignSessionRecording(sessionId);

  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [session, setSession] = useState<SystemDesignSession | null>(null);
  const [problem, setProblem] = useState<SystemDesignProblemDetail | null>(null);
  const [problemLoading, setProblemLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [evaluating, setEvaluating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [voiceDiagramReady, setVoiceDiagramReady] = useState(false);

  const [problemOpen, setProblemOpen] = useState(true);
  const [endInterviewConfirmOpen, setEndInterviewConfirmOpen] = useState(false);
  const [leavePageConfirmOpen, setLeavePageConfirmOpen] = useState(false);
  const [recordingStarting, setRecordingStarting] = useState(false);
  const [preStartLeaveOpen, setPreStartLeaveOpen] = useState(false);

  const exportFnRef = useRef<(() => Promise<string | null>) | null>(null);
  const voiceDiagramBridgeRef = useRef<SystemDesignVoiceDiagramBridge | null>(
    null,
  );
  const voiceSessionRef = useRef<SystemDesignVoiceSessionHandle>(null);
  const workspaceRowRef = useRef<HTMLDivElement>(null);

  const isXlWorkspace = useMediaMinWidth(1280);
  const workspaceRowWidthPx = useWorkspaceRowWidth(workspaceRowRef, !loading);

  const getMaxSidebarWidth = useCallback(() => {
    const rowW =
      workspaceRowWidthPx > 0
        ? workspaceRowWidthPx
        : typeof window !== "undefined"
          ? window.innerWidth
          : 1280;
    return Math.max(
      SD_SIDEBAR_MIN_PX,
      rowW - SD_WHITEBOARD_MIN_PX - HORIZONTAL_SPLITTER_PX,
    );
  }, [workspaceRowWidthPx]);

  const sidebarResize = useHorizontalPaneResize({
    storageKey: sessionId ? `sd-sidebar-w-${sessionId}` : undefined,
    defaultWidth: SD_SIDEBAR_DEFAULT_PX,
    minWidth: SD_SIDEBAR_MIN_PX,
    getMaxWidth: getMaxSidebarWidth,
    enabled: isXlWorkspace,
  });

  const timer = useInterviewElapsed(voiceDiagramReady, loading, finalized);

  const recordingStarted = Boolean(session?.recordingPhaseStartedAt);

  /** Camera/recording microphone (shared stream for Gemini Live — mute toggles audio track.enabled). */
  const [recordingMicOn, setRecordingMicOn] = useState(true);

  const toggleRecordingMic = useCallback(() => {
    const stream = mediaStreamRef.current;
    if (!stream) return;
    const tracks = stream.getAudioTracks().filter(Boolean);
    if (tracks.length === 0) return;
    const nextEnabled = !(tracks[0]?.enabled ?? true);
    tracks.forEach((t) => {
      if (t.kind === "audio") t.enabled = nextEnabled;
    });
    setRecordingMicOn(nextEnabled);
  }, [mediaStreamRef]);
  useEffect(() => {
    if (loading || !session || finalized || recordingStarted) return;
    void acquireCameraAndMic();
  }, [acquireCameraAndMic, finalized, loading, recordingStarted, session]);

  useEffect(() => {
    if (!isLoaded || !user || !sessionId) return;
    systemDesignApi
      .getSession(sessionId)
      .then((s) => {
        setSession(s);
        if (s.status === "completed") setFinalized(true);
      })
      .catch(() => toast.error("Session not found"))
      .finally(() => setLoading(false));
  }, [isLoaded, user, sessionId]);

  useEffect(() => {
    if (!session?.problemId) {
      setProblem(null);
      return;
    }
    setProblemLoading(true);
    systemDesignApi
      .getProblem(session.problemId)
      .then(setProblem)
      .catch(() => {
        setProblem(null);
        toast.error("Could not load problem details");
      })
      .finally(() => setProblemLoading(false));
  }, [session?.problemId]);

  const handleGetFeedback = useCallback(async () => {
    if (evaluating || finalized) return;
    if (!voiceDiagramReady) {
      toast.error(
        "Tap “Start New Session” in the AI Interviewer panel first — your canvas snapshot must attach to that same live voice session.",
      );
      return;
    }
    if (!exportFnRef.current) {
      toast.error("Canvas not ready yet.");
      return;
    }
    setEvaluating(true);
    try {
      const base64 = await exportFnRef.current();
      if (!base64) {
        toast.info("Draw something on the canvas first.");
        return;
      }
      const sent = voiceDiagramBridgeRef.current?.sendDiagramSnapshot(
        base64,
        "image/png",
      );
      if (!sent) {
        toast.error(
          "Could not send — keep voice connected and mic session started, then try again.",
        );
        return;
      }
      toast.success(
        "Whiteboard frame attached to this voice session — listen for feedback.",
      );
    } catch {
      toast.error("Could not capture canvas. Please try again.");
    } finally {
      setEvaluating(false);
    }
  }, [evaluating, finalized, voiceDiagramReady]);

  useLayoutEffect(() => {
    if (finalized) return;
    const stream = mediaStreamRef.current;
    const el = videoRef.current;
    if (!stream || !el) return;
    const live = stream.getVideoTracks().some((t) => t.readyState === "live");
    if (!live) return;
    el.srcObject = stream;
    el.muted = true;
    el.playsInline = true;
    void el.play().catch(() => {});
    setCameraReady(true);
    setCameraError(null);
  }, [finalized, setCameraReady, setCameraError]);

  useEffect(() => {
    if (!recordingStarted || loading || finalized || isRecording) return;
    const stream = mediaStreamRef.current;
    const live = stream?.getVideoTracks().some((t) => t.readyState === "live");
    if (live) return;

    void acquireCameraAndMic();
  }, [acquireCameraAndMic, finalized, isRecording, loading, recordingStarted]);

  const handleRestoreScreenRecording = useCallback(async () => {
    if (finalized || recordingStarting || isRecording) return;
    const cam = await acquireCameraAndMic();
    if (!cam.ok) {
      toast.error(cam.message);
      return;
    }

    let screen: MediaStream | null = null;
    try {
      screen = await navigator.mediaDevices.getDisplayMedia(
        SCREEN_RECORD_DISPLAY_OPTIONS,
      );
    } catch (e: unknown) {
      const name =
        e && typeof e === "object" && "name" in e
          ? String((e as Error).name)
          : "";
      if (name === "NotAllowedError" || name === "AbortError") {
        toast.error("Screen sharing is required for system design recordings.");
      } else {
        toast.error(
          e instanceof Error ? e.message : "Could not start screen capture.",
        );
      }
      return;
    }

    setRecordingStarting(true);
    try {
      await attachScreenAndBeginRecording(screen);
      toast.success(
        "Screen + camera recording is active. Your voice uses the same microphone.",
      );
    } catch (e: unknown) {
      screen?.getTracks().forEach((t) => t.stop());
      const msg =
        e instanceof Error ? e.message : "Failed to start composite recording.";
      toast.error(msg);
    } finally {
      setRecordingStarting(false);
    }
  }, [
    acquireCameraAndMic,
    attachScreenAndBeginRecording,
    finalized,
    isRecording,
    recordingStarting,
  ]);

  const handleStartPracticeSession = useCallback(async () => {
    if (recordingStarting || isRecording || recordingStarted) return;
    setRecordingStarting(true);
    try {
      const cam = await acquireCameraAndMic();
      if (!cam.ok) {
        toast.error(cam.message);
        return;
      }

      let screen: MediaStream | null = null;
      try {
        screen = await navigator.mediaDevices.getDisplayMedia(
          SCREEN_RECORD_DISPLAY_OPTIONS,
        );
      } catch (e: unknown) {
        const name =
          e && typeof e === "object" && "name" in e
            ? String((e as Error).name)
            : "";
        if (name === "NotAllowedError" || name === "AbortError") {
          toast.error(
            "Screen sharing is required to start the system design interview.",
          );
        } else {
          toast.error(
            e instanceof Error ? e.message : "Could not start screen capture.",
          );
        }
        return;
      }

      try {
        await attachScreenAndBeginRecording(screen);
        const refreshed = await systemDesignApi.getSession(sessionId);
        setSession(refreshed);
        toast.success(
          "Session started. Your screen and camera are being recorded.",
        );
      } catch (e: unknown) {
        screen?.getTracks().forEach((t) => t.stop());
        const msg =
          e instanceof Error ? e.message : "Failed to start practice session.";
        toast.error(msg);
      }
    } finally {
      setRecordingStarting(false);
    }
  }, [
    acquireCameraAndMic,
    attachScreenAndBeginRecording,
    isRecording,
    recordingStarting,
    recordingStarted,
    sessionId,
  ]);

  const performFinalize = useCallback(async () => {
    if (finalizing || finalized) return;
    setFinalizing(true);
    try {
      await voiceSessionRef.current?.flushAndDisconnect().catch(() => {
        /* still finalize — transcript best-effort */
      });
      await stopMediaRecorderAndUpload().catch((e) =>
        console.warn("Recording stop on finalize:", e),
      );
      const updated = await systemDesignApi.finalize(sessionId);
      setSession(updated);
      setFinalized(true);
      setEndInterviewConfirmOpen(false);
      setFinalizing(false);
      toast.success("Session completed! Your score is ready.");
      await invalidateAfterSystemDesignSessionFromStorage();
      router.push(reportHref);
    } catch {
      toast.error("Could not finalize session. Please try again.");
      setFinalizing(false);
    }
  }, [
    sessionId,
    finalizing,
    finalized,
    stopMediaRecorderAndUpload,
    router,
    reportHref,
  ]);

  /**
   * Backend force-ended the interview (e.g. candidate inactivity). It already
   * finalized + scored the session, so we only stop/upload the recording and
   * navigate — no client finalize (the backend guard makes it safe regardless).
   */
  const handleForceEnd = useCallback(
    (reason: string) => {
      if (finalized) return;
      setFinalized(true);
      setEndInterviewConfirmOpen(false);
      void stopMediaRecorderAndUpload().catch((e) =>
        console.warn("Recording stop on force-end:", e),
      );
      toast.info(
        reason === "inactivity"
          ? "Interview ended — no activity detected. Your report is ready."
          : "Interview ended. Your report is ready.",
      );
      void invalidateAfterSystemDesignSessionFromStorage();
      router.push(reportHref);
    },
    [finalized, stopMediaRecorderAndUpload, router, reportHref],
  );

  const openLeaveSessionDialog = useCallback(() => {
    setEndInterviewConfirmOpen(false);
    setLeavePageConfirmOpen(true);
  }, []);

  /** Reload/close: browsers only allow their own confirm (beforeunload); no custom DOM modal. */
  useEffect(() => {
    if (!isLoaded || loading || !session || finalized || !recordingStarted)
      return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isLoaded, loading, session, finalized, recordingStarted]);

  /**
   * Browser back button / trackpad swipe-back: `beforeunload` does NOT fire for
   * SPA history navigation, so guard `popstate` too. We keep a sentinel entry on
   * the stack; each back attempt re-pushes it (so the interview page stays) and
   * opens the end-interview confirmation instead of silently leaving.
   */
  useEffect(() => {
    if (!isLoaded || loading || !session || finalized || !recordingStarted)
      return undefined;
    window.history.pushState(null, "", window.location.href);
    const onPopState = () => {
      window.history.pushState(null, "", window.location.href);
      setEndInterviewConfirmOpen(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isLoaded, loading, session, finalized, recordingStarted]);

  const leaveToSessions = useCallback(() => {
    void (async () => {
      try {
        await stopMediaRecorderAndUpload();
      } catch {
        /* still leave */
      }
      await invalidateAfterSystemDesignSessionFromStorage();
      router.push("/dashboard/system-design");
    })();
  }, [router, stopMediaRecorderAndUpload]);

  if (!isLoaded || loading) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, #1f2937 0%, #0b1220 55%, #060913 100%)",
        }}
      >
        <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 text-white"
        style={{ background: "#060913" }}
      >
        <p className="text-lg font-medium">Session not found.</p>
        <Button
          variant="outline"
          className="border-white/20 text-white"
          onClick={() => router.push("/dashboard/system-design")}
        >
          Back to System Design
        </Button>
      </div>
    );
  }


  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-0 flex-col overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(circle at 60% 40%, #1f2937 0%, #0b1220 55%, #060913 100%)",
      }}
    >
      {/* Decorative blurs */}
      <div
        className="pointer-events-none fixed -left-24 top-1/4 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -right-20 bottom-1/3 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0b1220]/95 px-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <button
            type="button"
            className="shrink-0 text-left text-xs font-medium text-white/80 transition-colors hover:text-white sm:text-sm"
            onClick={() => {
              if (finalized) router.push(reportHref);
              else if (!recordingStarted) setPreStartLeaveOpen(true);
              else setEndInterviewConfirmOpen(true);
            }}
          >
            ← Exit
          </button>
          {!finalized && (
            <button
              type="button"
              className="shrink-0 text-left text-[11px] font-medium text-gray-500 underline-offset-2 transition-colors hover:text-gray-300 hover:underline sm:text-xs"
              onClick={() =>
                !recordingStarted
                  ? setPreStartLeaveOpen(true)
                  : openLeaveSessionDialog()
              }
            >
              All sessions
            </button>
          )}
          <span
            className="hidden h-4 w-px shrink-0 bg-card/15 sm:block"
            aria-hidden
          />
          <span className="min-w-0 truncate text-sm font-semibold tracking-tight text-white sm:text-sm">
            {problem?.title ?? session.problemId}
          </span>
          {finalized && (
            <span className="flex items-center gap-1 rounded-full border border-green-400/30 bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold text-green-300">
              <Trophy className="h-3 w-3" />
              Completed
            </span>
          )}
          {!finalized && isRecording && (
            <span className="flex items-center gap-1.5 rounded-full border border-red-500/35 bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-200/95">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"
                aria-hidden
              />
              Recording
            </span>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <span className="font-mono text-sm tabular-nums text-gray-300">
            {timer}
          </span>
          {!finalized && (
            <>
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-violet-600/80 px-3.5 text-xs font-semibold text-white hover:bg-violet-600 disabled:opacity-40"
                onClick={() => void handleGetFeedback()}
                disabled={
                  evaluating ||
                  !recordingStarted ||
                  !voiceDiagramReady
                }
                title={
                  !recordingStarted
                    ? "Start interview on the whiteboard (camera + screen) first"
                    : voiceDiagramReady
                      ? undefined
                      : "Start New Session in the AI Interviewer panel first"
                }
              >
                {evaluating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                Submit diagram
              </Button>
              {recordingStarted ? (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-red-600/80 px-3 text-xs font-semibold hover:bg-red-600"
                  onClick={() => setEndInterviewConfirmOpen(true)}
                  disabled={finalizing}
                >
                  {finalizing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  End Interview
                </Button>
              ) : null}
            </>
          )}
        </div>
      </header>

      {cameraError ? (
        <div className="relative z-20 shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
          {cameraError}
        </div>
      ) : null}

      {/* ─── Workspace ──────────────────────────────────────────── */}
      <div
        ref={workspaceRowRef}
        className="flex min-h-0 flex-1 overflow-hidden"
      >
        {/* ── Left panel: camera + problem fill height; score when finalized ── */}
        <aside
          className={cn(
            "flex min-h-0 shrink-0 flex-col overflow-hidden bg-card/[0.03]",
            isXlWorkspace
              ? "border-r-0"
              : "w-[clamp(300px,min(420px,40vw),440px)] border-r border-white/10",
          )}
          style={isXlWorkspace ? { width: sidebarResize.widthPx } : undefined}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-white/10 px-2.5 py-1.5 sm:px-3">
              {/* Camera + AI Interviewer side by side */}
              <div className="flex flex-row items-stretch gap-2.5 sm:gap-3">
                <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-white/10 bg-card/[0.02] px-2 py-1.5 sm:px-2">
                  <h3 className="shrink-0 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-300/90 sm:text-[11px]">
                    Your camera
                  </h3>
                  <div className="mt-1 flex min-h-0 flex-1 flex-col justify-center">
                    <div className="relative mx-auto aspect-square w-full max-w-[168px] overflow-hidden rounded-lg border border-white/10 bg-black shadow-md">
                      <video
                        ref={videoRef}
                        className="h-full w-full object-cover object-top sm:object-center"
                        playsInline
                        muted
                      />
                      {!finalized && (
                        <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-center gap-3 px-2 pb-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            title={
                              !cameraReady
                                ? "Camera not ready yet"
                                : recordingMicOn
                                  ? "Mute recording microphone"
                                  : "Unmute microphone"
                            }
                            aria-label={
                              recordingMicOn
                                ? "Mute recording microphone"
                                : "Unmute microphone"
                            }
                            disabled={
                              !cameraReady ||
                              !(
                                mediaStreamRef.current?.getAudioTracks()
                                  ?.length ?? 0
                              )
                            }
                            className={cn(
                              "size-10 shrink-0 rounded-full border-white/25 bg-black/75 p-0 text-white shadow-lg backdrop-blur-sm hover:bg-black/90 disabled:pointer-events-none disabled:opacity-40",
                              !recordingMicOn && "border-amber-400/60",
                            )}
                            onClick={() => toggleRecordingMic()}
                          >
                            {recordingMicOn ? (
                              <Mic className="h-5 w-5" aria-hidden />
                            ) : (
                              <MicOff
                                className="h-5 w-5 text-amber-300"
                                aria-hidden
                              />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            title={
                              isRecording || recordingStarting
                                ? recordingStarting
                                  ? "Starting screen capture…"
                                  : "Screen recording active"
                                : "Restore screen recording"
                            }
                            aria-label="Screen capture — restore or share screen"
                            disabled={
                              recordingStarting ||
                              isRecording ||
                              !recordingStarted
                            }
                            className={cn(
                              "size-10 shrink-0 rounded-full border-white/25 bg-black/75 p-0 shadow-lg backdrop-blur-sm hover:bg-black/90 disabled:pointer-events-none",
                              !(isRecording || recordingStarting) &&
                                recordingStarted
                                ? "border-primary/50 text-primary/50 hover:border-primary/70"
                                : "text-primary/50/85 opacity-[0.42]",
                            )}
                            onClick={() => void handleRestoreScreenRecording()}
                          >
                            {recordingStarting ? (
                              <Loader2
                                className="h-5 w-5 animate-spin"
                                aria-hidden
                              />
                            ) : (
                              <Video className="h-5 w-5" aria-hidden />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 shrink-0 text-center text-[10px] leading-snug text-gray-400 sm:text-[11px]">
                    {!cameraReady
                      ? "Allow camera and microphone when your browser asks."
                      : !recordingStarted
                        ? "Preview ready — start interview on the whiteboard when you’re ready."
                        : "Ensure your camera and mic stay enabled for the interview."}
                  </p>
                </section>

                <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-white/10 px-2 py-1.5 sm:px-2">
                  <h3 className="flex w-full shrink-0 items-center justify-center gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-300/90 sm:gap-2 sm:text-[11px]">
                    <MessageCircle
                      className="h-3.5 w-3.5 shrink-0 text-violet-400/90 sm:h-4 sm:w-4"
                      aria-hidden
                    />
                    AI Interviewer
                  </h3>
                  <div className="mt-0.5 flex min-h-0 min-w-0 flex-1 flex-col">
                    <SystemDesignVoiceClient
                      ref={voiceSessionRef}
                      sessionId={sessionId}
                      disabled={Boolean(finalized || !recordingStarted)}
                      autoStartVoice={recordingStarted && !finalized}
                      disabledHint={
                        !finalized && !recordingStarted
                          ? "Voice starts automatically after you start recording."
                          : undefined
                      }
                      diagramBridgeRef={voiceDiagramBridgeRef}
                      onDiagramChannelReady={setVoiceDiagramReady}
                      onForceEnd={handleForceEnd}
                      reuseMicStreamRef={mediaStreamRef}
                      compact
                      className="flex min-h-0 w-full flex-1 flex-col"
                    />
                  </div>
                </section>
              </div>
            </div>

            {/* Problem statement — fills remaining sidebar height */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-b border-white/10">
              <button
                type="button"
                className="flex w-full shrink-0 items-center justify-between px-4 py-2.5 text-left hover:bg-card/[0.03]"
                onClick={() => setProblemOpen((o) => !o)}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-300/90">
                  Problem statement
                </span>
                {problemOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                )}
              </button>
              {problemOpen && (
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain border-t border-white/[0.06] px-4 pb-3 pt-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-card/[0.12] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent">
                  {problemLoading ? (
                    <div className="flex items-center gap-2 py-4 text-xs text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading problem…
                    </div>
                  ) : problem ? (
                    <div className="space-y-3">
                      {problem.shortTitle ? (
                        <p className="text-[11px] font-medium text-violet-300/90">
                          {problem.shortTitle}
                        </p>
                      ) : null}
                      <ProblemScenario scenario={problem.scenario} />
                      <RequirementList
                        title="Core Requirements"
                        items={problem.coreRequirements}
                        dotClass="bg-violet-400"
                      />
                      <RequirementList
                        title="Scale Requirements"
                        items={problem.scaleRequirements}
                        dotClass="bg-primary/80"
                      />
                      <RequirementList
                        title="Considerations"
                        items={problem.considerations}
                        dotClass="bg-amber-400/90"
                      />
                      <RequirementList
                        title="Out of scope (functional)"
                        items={problem.outOfScopeFunctional ?? []}
                        dotClass="bg-gray-500"
                      />
                      <RequirementList
                        title="Out of scope (non-functional)"
                        items={problem.outOfScopeNonFunctional ?? []}
                        dotClass="bg-gray-500"
                      />
                    </div>
                  ) : (
                    <p className="py-4 text-xs text-gray-500">
                      Problem details unavailable.
                    </p>
                  )}
                </div>
              )}
            </div>

            {finalized && session.scoreReport && (
              <div className="shrink-0 border-t border-white/10 px-4 py-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-300/80">
                  Final Score
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-violet-300 tabular-nums">
                    {session.scoreReport.overallScore}
                  </span>
                  <span className="text-sm text-gray-400">/ 100</span>
                </div>
                <div className="space-y-2 text-xs">
                  {session.scoreReport.dimensionScores ? (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Rubric dimensions
                      </p>
                      {(
                        [
                          ["Scope & reqs", "~15%", session.scoreReport.dimensionScores.scopeRequirements],
                          ["Components", "~25%", session.scoreReport.dimensionScores.componentArchitecture],
                          ["Scaling / deep dive", "~40%", session.scoreReport.dimensionScores.scalingDeepDive],
                          ["Trade-offs & comms", "~20%", session.scoreReport.dimensionScores.tradeoffsCommunication],
                        ] as const
                      ).map(([label, weight, score]) => (
                        <div
                          key={String(label)}
                          className="flex items-center justify-between gap-2 text-gray-300"
                        >
                          <span>
                            {label}{" "}
                            <span className="text-gray-500">({weight})</span>
                          </span>
                          <span className="font-semibold tabular-nums">{score}/100</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {[
                        ["Architecture", session.scoreReport.architectureScore],
                        ["Scalability", session.scoreReport.scalabilityScore],
                        ["Trade-offs", session.scoreReport.tradeoffsScore],
                      ]
                        .filter((row) => typeof row[1] === "number")
                        .map(([label, score]) => (
                          <div
                            key={String(label)}
                            className="flex items-center justify-between text-gray-300"
                          >
                            <span>{label}</span>
                            <span className="font-semibold">{score as number}/100</span>
                          </div>
                        ))}
                    </>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-gray-400">
                  {session.scoreReport.summary}
                </p>
              </div>
            )}
          </div>
        </aside>

        {isXlWorkspace ? (
          <HorizontalResizeHandle
            label="Drag to resize problem panel and whiteboard"
            {...sidebarResize.handleProps}
          />
        ) : null}

        {/* ── Right panel (whiteboard) ── */}
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden xl:min-w-[400px]">
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <ExcalidrawBoard
              sessionId={sessionId}
              initialSnapshotJson={session.whiteboardSnapshot ?? null}
              onExportRef={(fn) => {
                exportFnRef.current = fn;
              }}
              onActivity={() => {
                voiceDiagramBridgeRef.current?.sendWhiteboardActivity();
              }}
              readOnly={
                finalized ||
                !recordingStarted ||
                !voiceDiagramReady
              }
              viewModeEnabled={
                finalized || (recordingStarted && !voiceDiagramReady)
              }
              overlay={
                !finalized && !recordingStarted ? (
                  <>
                    <p className="pointer-events-none mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-black">
                      Your whiteboard
                    </p>
                    <div className="pointer-events-auto relative z-[3] w-full max-w-md overflow-hidden rounded-2xl border border-violet-400/50 px-6 py-8 text-center shadow-2xl shadow-black/50">
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(115,103,240,0.22)_0%,_transparent_55%)]"
                      />
                      <div className="relative flex flex-col items-center gap-5">
                        <p className="text-sm leading-relaxed text-gray-200 sm:text-base">
                          Allow camera, mic, and screen when prompted — then tap{" "}
                          <span className="font-semibold text-white">
                            Start interview
                          </span>
                          .
                        </p>
                        <Button
                          type="button"
                          size="lg"
                          className="h-11 min-w-[12rem] rounded-xl bg-gradient-to-r from-violet-600 to-primary px-8 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 hover:from-violet-700 hover:to-violet-600 disabled:opacity-60"
                          disabled={recordingStarting}
                          onClick={() => void handleStartPracticeSession()}
                        >
                          {recordingStarting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Starting…
                            </>
                          ) : (
                            "Start interview"
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : undefined
              }
            />
          </div>

          {/* Bottom: canvas status only (actions live in header) */}
          {!finalized && recordingStarted ? (
            <div className="flex shrink-0 justify-center border-t border-white/10 bg-[#0b1220]/90 px-4 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                {voiceDiagramReady
                  ? "Canvas auto-saved · resume anytime"
                  : "Tap Start New Session in the AI Interviewer panel to unlock voice-linked edits"}
              </div>
            </div>
          ) : null}

          {finalized && (
            <div className="flex shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-[#0b1220]/90 px-5 py-3">
              <p className="text-sm text-gray-300">
                Session completed. Open your report for scores and recording.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-white/15 bg-card/[0.05] text-gray-200 hover:bg-card/10"
                onClick={() => router.push(reportHref)}
              >
                View report
              </Button>
            </div>
          )}
        </main>
      </div>

      <AlertDialog
        open={endInterviewConfirmOpen}
        onOpenChange={(open) => {
          if (!finalizing) setEndInterviewConfirmOpen(open);
        }}
      >
        <AlertDialogContent className="z-[200] border-amber-500/40 bg-[#0f172a] text-white sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base text-white">
              End this practice session?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left text-sm text-gray-300">
                <p>
                  If you leave now, this interview will be ended and{" "}
                  <span className="font-medium text-amber-200/95">
                    marked as done
                  </span>{" "}
                  for your account.
                </p>
                <p className="text-xs text-gray-400">
                  You won&apos;t be able to return to this session to keep
                  sketching on the whiteboard, use chat, or run further voice
                  diagram feedback here. Your canvas is auto-saved so you
                  don&apos;t lose work when you reopen.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-end">
            <AlertDialogCancel
              disabled={finalizing}
              className="border-white/20 bg-card/5 text-white hover:bg-card/10 hover:text-white"
            >
              Stay
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={finalizing}
              className="rounded-xl"
              onClick={() => void performFinalize()}
            >
              {finalizing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              End &amp; leave
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={leavePageConfirmOpen}
        onOpenChange={setLeavePageConfirmOpen}
      >
        <AlertDialogContent className="z-[200] border-amber-500/40 bg-[#0f172a] text-white sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base text-white">
              Leave this system design session?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left text-sm text-gray-300">
                <p>
                  You haven&apos;t ended the interview yet. Your canvas is saved
                  automatically—you can reopen this session from{" "}
                  <span className="font-medium text-amber-200/95">
                    System Design · My sessions
                  </span>
                  anytime.
                </p>
                <p className="text-xs text-gray-400">
                  Use{" "}
                  <span className="font-medium text-gray-300">
                    End Interview
                  </span>{" "}
                  here when you want your final score.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-end">
            <AlertDialogCancel className="border-white/20 bg-card/5 text-white hover:bg-card/10 hover:text-white">
              Stay
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-white/20 bg-transparent text-white hover:bg-card/10 hover:text-white"
              onClick={() => {
                setLeavePageConfirmOpen(false);
                leaveToSessions();
              }}
            >
              Leave anyway
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={preStartLeaveOpen} onOpenChange={setPreStartLeaveOpen}>
        <AlertDialogContent className="z-[220] border-white/10 bg-[#0f172a] text-white sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base text-white">
              Leave before starting?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left text-sm text-gray-300">
                <p>
                  You haven&apos;t started recording yet. This session stays in{" "}
                  <span className="font-medium text-gray-200">
                    System Design · My sessions
                  </span>{" "}
                  so you can return later.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-end">
            <AlertDialogCancel className="border-white/20 bg-card/5 text-white hover:bg-card/10 hover:text-white">
              Stay
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-white/20 bg-transparent text-white hover:bg-card/10 hover:text-white"
              onClick={() => {
                setPreStartLeaveOpen(false);
                router.push("/dashboard/system-design");
              }}
            >
              Back to sessions
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
