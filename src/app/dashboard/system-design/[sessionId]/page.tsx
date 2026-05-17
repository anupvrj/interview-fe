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
import { isAxiosError } from "axios";
import { useUser } from "@clerk/nextjs";
import {
  systemDesignApi,
  type SystemDesignSession,
  type SystemDesignChatMessage,
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
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircle,
  MessagesSquare,
  Mic,
  MicOff,
  Send,
  Trophy,
  Video,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getProblemById } from "@/lib/systemDesignProblems";
import {
  SystemDesignVoiceClient,
  type SystemDesignVoiceDiagramBridge,
  type SystemDesignVoiceSessionHandle,
} from "@/components/system-design/SystemDesignVoiceClient";
import { useSystemDesignSessionRecording } from "@/hooks/useSystemDesignSessionRecording";

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

const HINT_PROMPTS = [
  "I'm not sure, could you give me a hint?",
  "Could you clarify the question?",
  "Let me think out loud...",
];

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

function ChatBubble({ msg }: { msg: SystemDesignChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
          isUser ? "bg-violet-600/80 text-white" : "bg-white/10 text-gray-300",
        )}
      >
        {isUser ? "You" : "AI"}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-none bg-violet-600/80 text-white"
            : "rounded-tl-none bg-white/[0.08] text-gray-200",
        )}
      >
        {msg.content.split("\n").map((line, i) => {
          const boldReplaced = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} className="font-semibold">
                {part}
              </strong>
            ) : (
              part
            ),
          );
          return (
            <span key={i}>
              {boldReplaced}
              {i < msg.content.split("\n").length - 1 && <br />}
            </span>
          );
        })}
      </div>
    </div>
  );
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
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<SystemDesignChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  const [evaluating, setEvaluating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [voiceDiagramReady, setVoiceDiagramReady] = useState(false);

  const [problemOpen, setProblemOpen] = useState(true);
  const [endInterviewConfirmOpen, setEndInterviewConfirmOpen] = useState(false);
  const [leavePageConfirmOpen, setLeavePageConfirmOpen] = useState(false);
  const [recordingStarting, setRecordingStarting] = useState(false);
  const [preStartLeaveOpen, setPreStartLeaveOpen] = useState(false);
  const [textChatPanelOpen, setTextChatPanelOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const exportFnRef = useRef<(() => Promise<string | null>) | null>(null);
  const voiceDiagramBridgeRef = useRef<SystemDesignVoiceDiagramBridge | null>(
    null,
  );
  const voiceSessionRef = useRef<SystemDesignVoiceSessionHandle>(null);

  const timer = useInterviewElapsed(voiceDiagramReady, loading, finalized);

  const problem = useMemo(
    () => (session ? getProblemById(session.problemId) : null),
    [session],
  );

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
        setMessages(s.chatHistory ?? []);
        if (s.status === "completed") setFinalized(true);
      })
      .catch(() => toast.error("Session not found"))
      .finally(() => setLoading(false));
  }, [isLoaded, user, sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || chatBusy || finalized) return;
      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed, timestamp: new Date().toISOString() },
      ]);
      setInputText("");
      setChatBusy(true);
      try {
        const reply = await systemDesignApi.chat(sessionId, trimmed);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: reply,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (e: unknown) {
        setMessages((prev) =>
          prev.at(-1)?.role === "user" ? prev.slice(0, -1) : prev,
        );
        setInputText(trimmed);
        let msg = "Could not send message. Please try again.";
        if (isAxiosError(e)) {
          const body = e.response?.data as { message?: unknown } | undefined;
          const m = body?.message;
          if (typeof m === "string" && m.trim()) msg = m.trim();
          else if (e.code === "ECONNABORTED") msg = "Request timed out — try again.";
          else if (e.message?.toLowerCase().includes("network")) msg = "Network error — check your connection.";
          else if (e.response?.status === 413) msg = "Message too long — try shortening it.";
          else if (e.response?.status === 503 || e.response?.status === 502)
            msg = "Service unavailable — try again in a moment.";
        }
        toast.error(msg);
      } finally {
        setChatBusy(false);
      }
    },
    [sessionId, chatBusy, finalized],
  );

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

  const leaveToSessions = useCallback(() => {
    void (async () => {
      try {
        await stopMediaRecorderAndUpload();
      } catch {
        /* still leave */
      }
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
        className="pointer-events-none fixed -right-20 bottom-1/3 h-56 w-56 rounded-full bg-blue-600/10 blur-3xl"
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
            className="hidden h-4 w-px shrink-0 bg-white/15 sm:block"
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
                    ? "Start interview from the sidebar (camera + screen) first"
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
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ── Left panel: camera + problem fill height; score when finalized ── */}
        <aside className="flex min-h-0 w-[clamp(300px,min(420px,40vw),440px)] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-white/[0.03]">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {!finalized && !recordingStarted ? (
              <div className="shrink-0 space-y-2 border-b border-violet-500/35 bg-violet-950/35 px-3 py-3">
                <p className="text-[11px] leading-snug text-gray-300">
                  Allow camera, mic, and screen when prompted — then tap Start
                  interview.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="h-10 w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-sm font-semibold text-white shadow-md hover:from-violet-700 hover:to-blue-700 disabled:opacity-60"
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
            ) : null}
            <div className="shrink-0 border-b border-white/10 px-2.5 py-1.5 sm:px-3">
              {/* Camera + AI Interviewer side by side */}
              <div className="flex flex-row items-stretch gap-2.5 sm:gap-3">
                <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-white/10 bg-white/[0.02] px-2 py-1.5 sm:px-2">
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
                                ? "border-blue-400/50 text-blue-300 hover:border-blue-400/70"
                                : "text-blue-300/85 opacity-[0.42]",
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
                        ? "Preview ready — start interview above when you’re ready to record."
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
                className="flex w-full shrink-0 items-center justify-between px-4 py-2.5 text-left hover:bg-white/[0.03]"
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
              {problemOpen && problem && (
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain border-t border-white/[0.06] px-4 pb-3 pt-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.12] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent">
                  <div className="space-y-3">
                    <p className="text-xs leading-relaxed text-gray-300">
                      {problem.scenario}
                    </p>
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Core Requirements
                      </p>
                      <ul className="space-y-1">
                        {problem.coreRequirements.map((r) => (
                          <li
                            key={r}
                            className="flex items-start gap-1.5 text-xs text-gray-300"
                          >
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Scale Requirements
                      </p>
                      <ul className="space-y-1">
                        {problem.scaleRequirements.map((r) => (
                          <li
                            key={r}
                            className="flex items-start gap-1.5 text-xs text-gray-300"
                          >
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
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

        {/* ── Right panel (whiteboard) ── */}
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">
            <ExcalidrawBoard
              sessionId={sessionId}
              initialSnapshotJson={session.whiteboardSnapshot ?? null}
              onExportRef={(fn) => {
                exportFnRef.current = fn;
              }}
              readOnly={
                finalized ||
                (recordingStarted && !voiceDiagramReady)
              }
            />
          </div>

          {/* Bottom: canvas status only (actions live in header) */}
          {!finalized && (
            <div className="flex shrink-0 justify-center border-t border-white/10 bg-[#0b1220]/90 px-4 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                {!recordingStarted
                  ? "Sketch on the canvas — start interview in the sidebar when you’re ready."
                  : voiceDiagramReady
                    ? "Canvas auto-saved · resume anytime"
                    : "Tap Start New Session in the AI Interviewer panel to unlock voice-linked edits"}
              </div>
            </div>
          )}

          {!finalized && (
            <>
              {textChatPanelOpen ? (
                <button
                  type="button"
                  aria-label="Close text chat"
                  className="absolute inset-0 z-[60] bg-black/20"
                  onClick={() => setTextChatPanelOpen(false)}
                />
              ) : null}
              <div className="pointer-events-none absolute bottom-[5.5rem] left-4 z-[70] flex max-w-[min(384px,calc(100%-2rem))] flex-col-reverse items-start gap-2 sm:left-5">
                <Button
                  type="button"
                  size="icon"
                  title={textChatPanelOpen ? "Hide text chat" : "Text chat"}
                  aria-expanded={textChatPanelOpen}
                  aria-label="Text chat"
                  className="pointer-events-auto h-12 w-12 shrink-0 rounded-full border border-white/15 bg-violet-600 text-white shadow-lg shadow-black/30 hover:bg-violet-500"
                  onClick={() => setTextChatPanelOpen((o) => !o)}
                >
                  <MessagesSquare className="h-6 w-6" aria-hidden />
                </Button>

                {textChatPanelOpen ? (
                  <div className="pointer-events-auto flex max-h-[min(420px,calc(100vh-12rem))] w-[min(384px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl shadow-black/50">
                    <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-300">
                        Text chat
                      </span>
                      <button
                        type="button"
                        aria-label="Close"
                        className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                        onClick={() => setTextChatPanelOpen(false)}
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                    <div className="min-h-[120px] flex-1 overflow-y-auto overscroll-contain px-3 py-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.12] [&::-webkit-scrollbar]:w-1.5">
                      <div className="space-y-3 py-1">
                        {messages.map((m, i) => (
                          <ChatBubble key={i} msg={m} />
                        ))}
                        {chatBusy && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            AI is thinking…
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    </div>
                    <div className="shrink-0 border-t border-white/10 px-3 py-2 space-y-1.5">
                      {HINT_PROMPTS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          disabled={chatBusy}
                          onClick={() => void sendMessage(p)}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-left text-[11px] text-gray-300 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <div className="shrink-0 border-t border-white/10 px-3 py-2.5">
                      <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-2 focus-within:border-violet-500/50">
                        <textarea
                          className="max-h-24 min-h-[2.5rem] flex-1 resize-none bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                          placeholder="Message the AI interviewer…"
                          rows={2}
                          value={inputText}
                          disabled={chatBusy}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void sendMessage(inputText);
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={chatBusy || !inputText.trim()}
                          onClick={() => void sendMessage(inputText)}
                          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-1 text-[10px] text-gray-600">
                        Enter sends · Shift+Enter newline
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}

          {finalized && (
            <div className="flex shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-[#0b1220]/90 px-5 py-3">
              <p className="text-sm text-gray-300">
                Session completed. Open your report for scores and recording.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-white/15 bg-white/[0.05] text-gray-200 hover:bg-white/10"
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
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
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
            <AlertDialogCancel className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              Stay
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
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
            <AlertDialogCancel className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              Stay
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
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
