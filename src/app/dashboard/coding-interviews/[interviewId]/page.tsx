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
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  codingInterviewApi,
  CodingProblemPublic,
  Interview,
  interviewApi,
} from "@/lib/api";
import { resolveInterviewReturnTo, withInterviewReturnTo } from "@/lib/interview-return-to";
import { invalidateAfterCodingSessionCompleteFromStorage } from "@/lib/invalidate-queries";
import {
  combineScreenAndMicForRecording,
  pickRecorderMimeType,
} from "@/lib/codingSessionRecording";
import { HorizontalResizeHandle } from "@/components/layout/HorizontalResizeHandle";
import { CodingProblemStatement } from "@/components/coding/CodingProblemStatement";
import {
  HORIZONTAL_SPLITTER_PX,
  useHorizontalPaneResize,
} from "@/hooks/useHorizontalPaneResize";
import { useMediaMinWidth } from "@/hooks/useMediaMinWidth";
import { useWorkspaceRowWidth } from "@/hooks/useWorkspaceRowWidth";
import { cn } from "@/lib/utils";
import { dash2026Scope } from "@/components/dashboard-2026/ui";
import {
  CodingRunResultsPanel,
  type CodingRunPayload,
} from "@/components/coding/CodingRunResultsPanel";
import {
  Braces,
  Check,
  FileText,
  Loader2,
  MessageCircle,
  Play,
  Send,
  Video,
  PhoneOff,
} from "lucide-react";
import { toast } from "sonner";
import { RealtimeInterviewClient } from "@/components/interview/RealtimeInterviewClient";
import { useIntegritySession } from "@/hooks/integrity/useIntegritySession";
import { useTabFocusTelemetry } from "@/hooks/integrity/useTabFocusTelemetry";
import { useCodeSandbox } from "@/hooks/integrity/useCodeSandbox";
import { useFacePresence } from "@/hooks/integrity/useFacePresence";
import { useIntegrityConfig } from "@/hooks/useIntegrityConfig";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

type Lang = "javascript" | "python" | "java" | "c" | "cpp";

const LANG_OPTIONS: { id: Lang; label: string; monaco: string }[] = [
  { id: "javascript", label: "JavaScript", monaco: "javascript" },
  { id: "python", label: "Python", monaco: "python" },
  { id: "java", label: "Java", monaco: "java" },
  { id: "cpp", label: "C++", monaco: "cpp" },
  { id: "c", label: "C", monaco: "c" },
];

function draftKey(problemId: string, lang: Lang) {
  return `${problemId}::${lang}`;
}

/** Resizable aside + problem | splitter | editor (xl row). */
const ASIDE_MIN_XL_PX = 200;
const ASIDE_DEFAULT_XL_PX = 256;
const ASIDE_MAX_XL_PX = 420;
const PROBLEM_PANE_MIN_PX = 280;
const PROBLEM_PANE_DEFAULT_PX = 560;
const EDITOR_PANE_MIN_XL_PX = 400;

function maxProblemPaneWidth(
  rowInnerWidthPx: number,
  asideWidthPx: number,
): number {
  if (rowInnerWidthPx < 1) {
    return typeof window !== "undefined"
      ? Math.max(PROBLEM_PANE_MIN_PX, Math.floor(window.innerWidth * 0.4))
      : PROBLEM_PANE_DEFAULT_PX;
  }
  return Math.max(
    PROBLEM_PANE_MIN_PX,
    rowInnerWidthPx -
      asideWidthPx -
      2 * HORIZONTAL_SPLITTER_PX -
      EDITOR_PANE_MIN_XL_PX,
  );
}

function maxAsideWidth(
  rowInnerWidthPx: number,
  problemPaneWidthPx: number,
): number {
  if (rowInnerWidthPx < 1) {
    return ASIDE_MAX_XL_PX;
  }
  const computed = Math.max(
    ASIDE_MIN_XL_PX,
    rowInnerWidthPx -
      problemPaneWidthPx -
      2 * HORIZONTAL_SPLITTER_PX -
      EDITOR_PANE_MIN_XL_PX,
  );
  return Math.min(ASIDE_MAX_XL_PX, computed);
}

type RunPanelState =
  | { type: "structured"; payload: CodingRunPayload }
  | { type: "text"; message: string };

function difficultyTone(d: string) {
  const v = d.toLowerCase();
  if (v === "easy") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  if (v === "hard") return "border-rose-400/30 bg-rose-400/10 text-rose-300";
  return "border-amber-400/30 bg-amber-400/10 text-amber-300";
}

function ProblemDescriptionDark({
  problem,
}: Readonly<{ problem: CodingProblemPublic }>) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="min-w-0 text-[20px] font-extrabold leading-tight tracking-[-0.03em] text-white">
          {problem.title}
        </h2>
        <span className={cn("shrink-0 rounded-md border px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[10.5px] uppercase", difficultyTone(problem.difficulty))}>
          {problem.difficulty}
        </span>
      </div>

      <div>
        <h3 className="mb-2 font-[family-name:var(--font-geist-mono)] text-[10.5px] tracking-wider text-sky-300/80">
          — THE PROBLEM —
        </h3>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
          <CodingProblemStatement
            statement={problem.statement}
            variant="dark"
          />
        </div>
        <p className="mt-2 text-xs leading-snug text-gray-400">
          The starter code is an{" "}
          <span className="text-violet-200/90">I/O template</span> — add your
          logic and print the required answer.
        </p>
      </div>

      {problem.publicTests.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-[family-name:var(--font-geist-mono)] text-[10.5px] tracking-wider text-sky-300/80">
            — EXAMPLES —
          </h3>
          <div className="space-y-3">
            {problem.publicTests.map((t, i) => (
              <div
                key={`${i}-${t.input.slice(0, 20)}`}
                className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5"
              >
                <div className="font-[family-name:var(--font-geist-mono)] text-[11px] text-white/60">
                  EXAMPLE {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400">
                    Input:
                  </span>
                  <pre className="mt-1 whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-[family-name:var(--font-geist-mono)] text-xs text-gray-100 sm:text-[13px]">
                    {t.input || "(empty)"}
                  </pre>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400">
                    Output:
                  </span>
                  <pre className="mt-1 whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-[family-name:var(--font-geist-mono)] text-xs text-gray-100 sm:text-[13px]">
                    {t.expectedOutput || "(empty)"}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CodingPhaseStepper({
  codingActive,
  allSubmitted,
}: Readonly<{ codingActive: boolean; allSubmitted: boolean }>) {
  const steps = [
    { label: "Setup", done: codingActive, active: !codingActive },
    { label: "Code & test", done: allSubmitted, active: codingActive && !allSubmitted },
    { label: "Discuss", done: false, active: allSubmitted },
  ];
  return (
    <ol className="m-0 hidden list-none items-center gap-1.5 p-0 md:flex">
      {steps.map((st, i) => (
        <li
          key={st.label}
          aria-current={st.active ? "step" : undefined}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium",
            st.active
              ? "border-primary/50 bg-primary/20 text-white"
              : st.done
                ? "border-white/10 text-white/60"
                : "border-white/10 text-white/35",
          )}
        >
          <span className={cn("font-[family-name:var(--font-geist-mono)] text-[10px]", st.active ? "text-sky-300" : "text-white/40")}>
            {st.done ? <Check className="h-3 w-3 text-emerald-400" aria-hidden /> : String(i + 1).padStart(2, "0")}
          </span>
          {st.label}
        </li>
      ))}
    </ol>
  );
}

export default function CodingInterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = params.interviewId as string;

  const videoRef = useRef<HTMLVideoElement>(null);
  const monacoEditorRef = useRef<unknown>(null);
  const monacoNsRef = useRef<unknown>(null);
  const [monacoReady, setMonacoReady] = useState(0);
  const [faceVideoEl, setFaceVideoEl] = useState<HTMLVideoElement | null>(null);
  const [displayPickerOpen, setDisplayPickerOpen] = useState(false);
  const [editorEl, setEditorEl] = useState<HTMLElement | null>(null);
  const [problemEl, setProblemEl] = useState<HTMLElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [problems, setProblems] = useState<CodingProblemPublic[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Lang>("python");
  const [code, setCode] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [runPanel, setRunPanel] = useState<RunPanelState | null>(null);
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [, bump] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [startSessionOpen, setStartSessionOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [discussBusy, setDiscussBusy] = useState(false);
  const [discussionPromptOpen, setDiscussionPromptOpen] = useState(false);
  const [voiceEmbedOpen, setVoiceEmbedOpen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [exitBusy, setExitBusy] = useState(false);
  const discussionAutoOpenedRef = useRef(false);
  const autostartAttemptedRef = useRef(false);
  const startCodingInFlightRef = useRef(false);
  const handleStartCodingRef = useRef<() => Promise<void>>(async () => {});
  const problemPaneStorageKey = `coding-problem-pane-w-${interviewId}`;
  const asideStorageKey = `coding-aside-w-${interviewId}`;
  const codingWorkspaceRowRef = useRef<HTMLDivElement>(null);
  const asideWidthRef = useRef(ASIDE_DEFAULT_XL_PX);
  const problemPaneWidthRef = useRef(PROBLEM_PANE_DEFAULT_PX);

  const isXlWorkspaceRow = useMediaMinWidth(1280);
  const workspaceRowWidthPx = useWorkspaceRowWidth(
    codingWorkspaceRowRef,
    Boolean(interview?.codingRound?.codingPhaseStartedAt),
  );

  const getMaxAsideWidth = useCallback(() => {
    const rowW =
      workspaceRowWidthPx > 0
        ? workspaceRowWidthPx
        : typeof window !== "undefined"
          ? window.innerWidth
          : 1280;
    return maxAsideWidth(rowW, problemPaneWidthRef.current);
  }, [workspaceRowWidthPx]);

  const getMaxProblemPaneWidth = useCallback(() => {
    const rowW =
      workspaceRowWidthPx > 0
        ? workspaceRowWidthPx
        : typeof window !== "undefined"
          ? window.innerWidth
          : 1280;
    return maxProblemPaneWidth(rowW, asideWidthRef.current);
  }, [workspaceRowWidthPx]);

  const asideResize = useHorizontalPaneResize({
    storageKey: asideStorageKey,
    defaultWidth: ASIDE_DEFAULT_XL_PX,
    minWidth: ASIDE_MIN_XL_PX,
    getMaxWidth: getMaxAsideWidth,
    enabled: isXlWorkspaceRow,
  });

  const problemPaneResize = useHorizontalPaneResize({
    storageKey: problemPaneStorageKey,
    defaultWidth: PROBLEM_PANE_DEFAULT_PX,
    minWidth: PROBLEM_PANE_MIN_PX,
    getMaxWidth: getMaxProblemPaneWidth,
    enabled: isXlWorkspaceRow,
  });

  const problemPaneWidthPx = problemPaneResize.widthPx;

  useEffect(() => {
    asideWidthRef.current = asideResize.widthPx;
  }, [asideResize.widthPx]);

  useEffect(() => {
    problemPaneWidthRef.current = problemPaneWidthPx;
  }, [problemPaneWidthPx]);

  const load = useCallback(async () => {
    try {
      const data = await codingInterviewApi.getSession(interviewId);
      const st = data.interview.status;
      const returnTo = resolveInterviewReturnTo(interviewId, searchParams);
      if (st === "completed") {
        router.replace(
          returnTo ?? `/dashboard/interviews/${interviewId}/report`,
        );
        return;
      }
      if (st === "processing") {
        router.replace(
          withInterviewReturnTo(
            `/dashboard/interviews/${interviewId}/processing`,
            returnTo,
          ),
        );
        return;
      }
      setInterview(data.interview);
      setProblems(data.problems);
      setActiveId((prev) => prev ?? data.problems[0]?.problemId ?? null);
      const seeded: Record<string, string> = {};
      for (const p of data.problems) {
        for (const opt of LANG_OPTIONS) {
          const starter = p.starterCode?.[opt.id];
          if (starter) {
            seeded[draftKey(p.problemId, opt.id)] = starter;
          }
        }
      }
      setDrafts((prev) => ({ ...seeded, ...prev }));
    } finally {
      setLoading(false);
    }
  }, [interviewId, router, searchParams]);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    autostartAttemptedRef.current = false;
  }, [interviewId]);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (globalThis.location.origin !== ev.origin) return;
      const d = ev.data as { type?: string; interviewId?: string } | null;
      if (!d || d.interviewId !== interviewId) return;
      if (
        d.type === "itrix-coding-discussion-done" ||
        d.type === "itrix-coding-discussion-leave" ||
        d.type === "itrix-coding-discussion-close"
      ) {
        setVoiceEmbedOpen(false);
        if (d.type === "itrix-coding-discussion-done") {
          toast.success("Discussion finished. Your report is being prepared.");
          void load();
        }
      }
    };
    globalThis.window.addEventListener("message", onMsg);
    return () => globalThis.window.removeEventListener("message", onMsg);
  }, [interviewId, load]);

  useEffect(() => {
    setRunPanel(null);
  }, [activeId]);

  useEffect(() => {
    const id = setInterval(() => bump((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /** Release camera/mic when leaving the page (stream is acquired when starting the session). */
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((x) => x.stop());
      mediaStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const acquireCameraAndMic = useCallback(async (): Promise<
    { ok: true } | { ok: false; message: string }
  > => {
    const el = videoRef.current;
    if (!el || !navigator.mediaDevices?.getUserMedia) {
      const message = "Camera is not supported in this browser.";
      setCameraError(message);
      setCameraReady(false);
      return { ok: false, message };
    }
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1,
        } as MediaTrackConstraints,
      });
      mediaStreamRef.current = stream;
      el.srcObject = stream;
      el.muted = true;
      el.playsInline = true;
      await el.play();
      setCameraReady(true);
      setCameraError(null);
      return { ok: true };
    } catch (e: unknown) {
      console.error(e);
      const message =
        "Camera and microphone access is required. Allow both in your browser, then try again.";
      setCameraError(message);
      setCameraReady(false);
      return { ok: false, message };
    }
  }, []);

  const uploadCodingRecording = useCallback(async () => {
    if (recordedChunksRef.current.length === 0) return;
    const totalSize = recordedChunksRef.current.reduce((s, c) => s + c.size, 0);
    if (totalSize < 100 * 1024) {
      console.warn("Coding recording too small, skip upload");
      recordedChunksRef.current = [];
      return;
    }
    const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
    const { uploadUrl, s3Key } =
      await interviewApi.getRecordingUploadUrl(interviewId);
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": "video/webm" },
    });
    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} ${text}`);
    }
    await interviewApi.saveRecordingKey(interviewId, s3Key);
    recordedChunksRef.current = [];
  }, [interviewId]);

  const stopMediaRecorderAndUpload = useCallback(async () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") {
      await uploadCodingRecording().catch((e) =>
        console.warn("upload after stop:", e),
      );
      return;
    }
    await new Promise<void>((resolve) => {
      mr.addEventListener("stop", () => resolve(), { once: true });
      if (mr.state === "recording") {
        mr.requestData();
      }
      setTimeout(() => {
        try {
          mr.stop();
        } catch {
          resolve();
        }
      }, 200);
    });
    mediaRecorderRef.current = null;
    setIsRecording(false);
    try {
      await uploadCodingRecording();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
      throw e;
    }
  }, [uploadCodingRecording]);

  const beginScreenRecording = useCallback(
    async (screen: MediaStream) => {
      const mic = mediaStreamRef.current;
      if (!mic) {
        throw new Error("Camera/mic stream not ready");
      }
      const combined = combineScreenAndMicForRecording(screen, mic);
      const mimeType = pickRecorderMimeType();
      recordedChunksRef.current = [];
      const mr = new MediaRecorder(combined, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "video/webm",
        videoBitsPerSecond: 5_000_000,
      });
      mr.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      mr.addEventListener("stop", () => {
        screenStreamRef.current?.getTracks().forEach((track) => {
          if (track.readyState === "live") {
            track.stop();
          }
        });
        screenStreamRef.current = null;
      });
      const vt = screen.getVideoTracks()[0];
      vt?.addEventListener("ended", () => {
        toast.warning(
          "Screen sharing ended. Recording was saved (partial if you stopped early).",
        );
        void stopMediaRecorderAndUpload();
      });
      mediaRecorderRef.current = mr;
      mr.start(1000);
      setIsRecording(true);
    },
    [stopMediaRecorderAndUpload],
  );

  const activeProblem = useMemo(
    () => problems.find((p) => p.problemId === activeId) ?? null,
    [problems, activeId],
  );

  useEffect(() => {
    if (!activeProblem) return;
    const k = draftKey(activeProblem.problemId, language);
    const sub = interview?.codingRound?.submissions?.find(
      (s) => s.problemId === activeProblem.problemId,
    );
    if (sub && sub.language === language) {
      setCode(sub.code);
      return;
    }
    setCode(
      drafts[k] ??
        activeProblem.starterCode?.[language] ??
        "// Write your solution",
    );
  }, [activeProblem, language, drafts, interview]);

  const persistDraft = (nextCode: string) => {
    if (!activeProblem) return;
    const k = draftKey(activeProblem.problemId, language);
    setDrafts((prev) => ({ ...prev, [k]: nextCode }));
    setCode(nextCode);
  };

  const codingStarted = !!interview?.codingRound?.codingPhaseStartedAt;
  const integrityCfg = useIntegrityConfig();
  const integrityEnabled =
    codingStarted &&
    integrityCfg.live &&
    interview?.metadata?.integrityTelemetry !== false;
  const integrity = useIntegritySession("interview", interviewId, integrityEnabled);
  const tabFocus = useTabFocusTelemetry({
    enabled: integrityEnabled && integrityCfg.tabBlur,
    displayPickerOpen,
    dialogOpen: startSessionOpen || discussionPromptOpen || exitConfirmOpen,
    onEvent: (e) => integrity.emit(e),
  });
  useCodeSandbox({
    enabled: integrityEnabled && integrityCfg.clipboardLock,
    editorContainer: editorEl,
    problemPane: problemEl,
    monacoEditor: monacoReady ? (monacoEditorRef.current as never) : null,
    monaco: monacoReady ? (monacoNsRef.current as never) : null,
    onEvent: (e) => integrity.emit(e),
  });
  useFacePresence({
    enabled:
      integrityEnabled &&
      (integrityCfg.facePresence ||
        integrityCfg.camera ||
        integrityCfg.liveSpeech),
    videoEl: faceVideoEl,
    kind: "interview",
    sessionId: interviewId,
    onEvent: (e) => integrity.emit(e),
    emitFace: integrityCfg.facePresence,
    emitCamera: integrityCfg.camera,
    emitSpeech: integrityCfg.liveSpeech,
  });

  useEffect(() => {
    setFaceVideoEl(videoRef.current);
  }, [cameraReady, codingStarted]);

  /**
   * Workspace mounts a different <video> than pre-start. Reattach an existing
   * stream and sync cameraReady (e.g. state false after a remount).
   */
  useLayoutEffect(() => {
    if (!codingStarted) return;
    const stream = mediaStreamRef.current;
    const el = videoRef.current;
    if (!stream || !el) return;
    const live = stream
      .getVideoTracks()
      .some((t) => t.readyState === "live");
    if (!live) return;
    el.srcObject = stream;
    el.muted = true;
    el.playsInline = true;
    void el.play().catch(() => {});
    setCameraReady(true);
    setCameraError(null);
  }, [codingStarted]);

  /**
   * If the tab remounted, unmount cleanup stops tracks. Re-acquire preview only when
   * not recording so we don't replace the mic stream used by MediaRecorder.
   */
  useEffect(() => {
    if (!codingStarted || loading || isRecording) return;
    const stream = mediaStreamRef.current;
    const live = stream
      ?.getVideoTracks()
      .some((t) => t.readyState === "live");
    if (live) return;

    let cancelled = false;
    void (async () => {
      await acquireCameraAndMic();
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [codingStarted, loading, isRecording, acquireCameraAndMic]);

  useEffect(() => {
    if (loading) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [loading]);

  const budgetMin = interview?.metadata?.codingPhaseDurationMinutes ?? 60;
  const budgetSec = budgetMin * 60;
  const codingStartMs = interview?.codingRound?.codingPhaseStartedAt
    ? new Date(interview.codingRound.codingPhaseStartedAt).getTime()
    : null;
  const codingPhaseEndMs = interview?.codingRound?.codingPhaseEndedAt
    ? new Date(interview.codingRound.codingPhaseEndedAt).getTime()
    : null;
  const sessionEndMs = interview?.session?.endedAt
    ? new Date(interview.session.endedAt).getTime()
    : null;
  const interviewTerminal =
    interview?.status === "processing" ||
    interview?.status === "completed" ||
    interview?.status === "failed";

  /** Stop the coding clock when the phase ends or the interview session ends. */
  let elapsedCapMs = Date.now();
  if (codingPhaseEndMs != null) {
    elapsedCapMs = Math.min(elapsedCapMs, codingPhaseEndMs);
  } else if (interviewTerminal && sessionEndMs != null) {
    elapsedCapMs = Math.min(elapsedCapMs, sessionEndMs);
  }

  const elapsedSec =
    codingStartMs != null
      ? Math.max(0, Math.floor((elapsedCapMs - codingStartMs) / 1000))
      : 0;
  const remainingSec = Math.max(0, budgetSec - elapsedSec);

  const submissions = interview?.codingRound?.submissions ?? [];
  const allSubmitted =
    problems.length > 0 &&
    problems.every((p) => submissions.some((s) => s.problemId === p.problemId));

  useEffect(() => {
    if (
      !codingStarted ||
      !allSubmitted ||
      discussionAutoOpenedRef.current ||
      voiceEmbedOpen
    ) {
      return;
    }
    discussionAutoOpenedRef.current = true;
    const id = globalThis.window.setTimeout(() => {
      setDiscussionPromptOpen(true);
    }, 0);
    return () => globalThis.window.clearTimeout(id);
  }, [codingStarted, allSubmitted, voiceEmbedOpen]);

  const handleStartCoding = async () => {
    if (codingStarted) return;
    if (startCodingInFlightRef.current) return;
    startCodingInFlightRef.current = true;
    setStarting(true);
    tabFocus.setDisplayPickerOpen(true);
    const cam = await acquireCameraAndMic();
    tabFocus.setDisplayPickerOpen(false);
    if (!cam.ok) {
      toast.error(cam.message);
      setStarting(false);
      startCodingInFlightRef.current = false;
      return;
    }

    let screen: MediaStream | null = null;
    try {
      tabFocus.setDisplayPickerOpen(true);
      setDisplayPickerOpen(true);
      screen = await navigator.mediaDevices.getDisplayMedia({
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
      });
      setDisplayPickerOpen(false);
      tabFocus.setDisplayPickerOpen(false);
    } catch (e: unknown) {
      setDisplayPickerOpen(false);
      tabFocus.setDisplayPickerOpen(false);
      const name = e && typeof e === "object" && "name" in e ? String((e as Error).name) : "";
      if (name === "NotAllowedError" || name === "AbortError") {
        toast.error("Screen sharing is required to start the coding round.");
      } else {
        toast.error(
          e instanceof Error ? e.message : "Could not start screen capture.",
        );
      }
      setStarting(false);
      startCodingInFlightRef.current = false;
      return;
    }

    try {
      screenStreamRef.current = screen;
      const doc = await codingInterviewApi.startCoding(interviewId);
      setInterview(doc);
      await beginScreenRecording(screen);
      setStartSessionOpen(false);
      const stripAutostart =
        typeof globalThis.window !== "undefined" &&
        new URLSearchParams(globalThis.window.location.search).get(
          "autostart",
        ) === "1";
      if (stripAutostart) {
        router.replace(`/dashboard/coding-interviews/${interviewId}`, {
          scroll: false,
        });
      }
      toast.success(
        "Session started. Your screen and camera are being recorded.",
      );
    } catch (e: unknown) {
      screen?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      const data = (e as { response?: { data?: { code?: string; message?: string } } })
        ?.response?.data;
      if (data?.code === "BIOMETRIC_REQUIRED") {
        router.push("/dashboard/identity-verification");
        return;
      }
      const msg =
        data?.message ||
        (e instanceof Error ? e.message : "Failed to start coding session.");
      toast.error(msg);
    } finally {
      setStarting(false);
      startCodingInFlightRef.current = false;
    }
  };

  handleStartCodingRef.current = handleStartCoding;

  useEffect(() => {
    if (loading || !interview || codingStarted) return;
    if (searchParams.get("autostart") !== "1") return;
    if (autostartAttemptedRef.current) return;
    autostartAttemptedRef.current = true;
    /** Do not router.replace here — it can remount this page, stop camera tracks, and leave a black preview. Strip ?autostart after startCoding succeeds instead. */
    queueMicrotask(() => {
      void handleStartCodingRef.current();
    });
  }, [loading, interview, codingStarted, searchParams, interviewId]);

  const handleRun = async () => {
    if (!activeProblem || !codingStarted) return;
    setRunning(true);
    setRunPanel(null);
    try {
      const res = await codingInterviewApi.run(interviewId, {
        problemId: activeProblem.problemId,
        language,
        code,
        visibility: "public",
      });
      setRunPanel({ type: "structured", payload: res });
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : e instanceof Error
            ? e.message
            : "Run failed";
      setRunPanel({
        type: "text",
        message: msg || "Run failed",
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitProblem = async () => {
    if (!activeProblem || !codingStarted) return;
    persistDraft(code);
    try {
      const doc = await codingInterviewApi.submit(interviewId, {
        problemId: activeProblem.problemId,
        language,
        code,
      });
      setInterview(doc);
      setRunPanel({
        type: "text",
        message: "Submitted. Check status on the problem list.",
      });
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Submit failed";
      setRunPanel({ type: "text", message: msg });
    }
  };

  const launchDiscussionVoice = async () => {
    setDiscussBusy(true);
    try {
      await stopMediaRecorderAndUpload();
      await codingInterviewApi.startDiscussion(interviewId);
      await load();
      setDiscussionPromptOpen(false);
      setVoiceEmbedOpen(true);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Could not continue to discussion.";
      toast.error(msg);
    } finally {
      setDiscussBusy(false);
    }
  };

  const confirmExitAndMarkDone = useCallback(async () => {
    setExitBusy(true);
    try {
      if (codingStarted) {
        await stopMediaRecorderAndUpload().catch((e) => {
          console.warn("Recording stop on exit:", e);
        });
      }
      // Unmount voice client so the WebSocket closes and the server can persist
      // the discussion transcript before we trigger the same completion + report
      // pipeline as a normal interview.
      setVoiceEmbedOpen(false);
      await new Promise((r) => setTimeout(r, 900));
      await codingInterviewApi.markDone(interviewId);
      setExitConfirmOpen(false);
      await invalidateAfterCodingSessionCompleteFromStorage();
      const returnTo = resolveInterviewReturnTo(interviewId, searchParams);
      router.push(
        withInterviewReturnTo(
          `/dashboard/interviews/${interviewId}/processing`,
          returnTo,
        ),
      );
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Could not end session. Please try again.";
      toast.error(msg);
    } finally {
      setExitBusy(false);
    }
  }, [codingStarted, interviewId, router, searchParams, stopMediaRecorderAndUpload]);

  const exitConfirmDialog = (
    <AlertDialog
      open={exitConfirmOpen}
      onOpenChange={(open) => {
        if (!exitBusy) setExitConfirmOpen(open);
      }}
    >
      <AlertDialogContent className={cn(dash2026Scope, "z-[200] rounded-[22px] border-white/10 bg-[#0D1626] text-white sm:max-w-md")}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[20px] font-bold tracking-tight text-white">
            End this coding round?
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
                You won&apos;t be able to return to this session to keep coding,
                run tests, or open the AI Interview Practice discussion from here.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:justify-end">
          <AlertDialogCancel
            disabled={exitBusy}
            className="border-white/20 bg-card/5 text-white hover:bg-card/10 hover:text-white"
          >
            Stay
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={exitBusy}
            className="rounded-xl"
            onClick={() => void confirmExitAndMarkDone()}
          >
            {exitBusy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            End & leave
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const monacoLang =
    LANG_OPTIONS.find((o) => o.id === language)?.monaco ?? "python";

  useEffect(() => {
    const onBeforeUnload = (ev: BeforeUnloadEvent) => {
      if (isRecording) {
        ev.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isRecording]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] justify-center p-16">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      </div>
    );
  }

  if (codingStarted) {
    return (
      <div className={cn("fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#060B16] text-white antialiased", dash2026Scope)}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="bg-blueprint-dark absolute inset-0 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_10%,#000_30%,transparent_80%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(40%_35%_at_15%_0%,rgba(115,103,240,.22),transparent_70%),radial-gradient(35%_30%_at_90%_5%,rgba(31,143,255,.12),transparent_70%)]" />
        </div>

        <header className="relative z-20 shrink-0 border-b border-white/10 bg-[#060B16]/80 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                className="shrink-0 text-left text-xs font-medium text-white/80 transition-colors hover:text-white sm:text-sm"
                onClick={() => setExitConfirmOpen(true)}
              >
                ← Exit
              </button>
              <span
                className="hidden h-4 w-px bg-card/15 sm:block"
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-bold tracking-[-0.02em] text-white">{interview?.metadata.role || "Coding round"}</span>
                <span className="block truncate font-[family-name:var(--font-geist-mono)] text-[10.5px] tracking-wide text-white/45">
                  CODING ROUND{interview?.metadata.targetCompany ? ` · ${interview.metadata.targetCompany.toUpperCase()}` : ""}
                </span>
              </span>
              <CodingPhaseStepper
                codingActive={codingStarted}
                allSubmitted={allSubmitted}
              />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              {isRecording ? (
                <span className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-1 text-[11px] font-medium text-red-200">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                  Recording
                </span>
              ) : null}
{/* end the round from here too; same confirm as Exit, so it is never one stray click */}
              <Button
                type="button"
                onClick={() => setExitConfirmOpen(true)}
                aria-label="End coding round"
                className="h-9 gap-1.5 rounded-full bg-[#E5484D] px-3.5 text-[13px] font-semibold text-white shadow-[0_10px_26px_-12px_rgba(229,72,77,.9)] hover:bg-[#d93d42]"
              >
                <PhoneOff className="h-4 w-4" />
                <span className="hidden sm:inline">End Call</span>
              </Button>
              <span className={cn("rounded-full border px-3 py-1.5 font-[family-name:var(--font-geist-mono)] text-[12.5px] tabular-nums", remainingSec <= 120 ? "border-rose-400/40 bg-rose-500/15 text-rose-200" : "border-white/15 bg-white/[0.05] text-white/85")}>
                {Math.floor(remainingSec / 60)}:{(remainingSec % 60).toString().padStart(2, "0")} left
              </span>
              {allSubmitted ? (
                <Button
                  type="button"
                  className="h-10 rounded-xl bg-primary px-4 text-[13.5px] font-semibold text-white shadow-[0_10px_26px_-12px_rgba(115,103,240,.9)] hover:bg-primary/90"
                  onClick={() => setDiscussionPromptOpen(true)}
                  disabled={voiceEmbedOpen}
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                  Discuss
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        {cameraError ? (
          <div className="relative z-20 shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
            {cameraError}
          </div>
        ) : null}

        <div
          ref={codingWorkspaceRowRef}
          className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden xl:flex-row"
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden xl:flex-row xl:overflow-hidden">
          <aside
            className={cn(
              "flex shrink-0 flex-col border-white/10 bg-[#0B1322]/80 backdrop-blur xl:h-auto",
              isXlWorkspaceRow
                ? "min-h-0 xl:h-full xl:max-h-none xl:self-stretch xl:shrink-0 xl:border-r-0"
                : voiceEmbedOpen
                  ? "min-h-0 xl:h-full xl:w-80 xl:max-h-none xl:self-stretch xl:border-r"
                  : "max-h-[38vh] xl:max-h-none xl:w-64 xl:border-r",
            )}
            style={
              isXlWorkspaceRow ? { width: asideResize.widthPx } : undefined
            }
          >
            <div className="shrink-0 border-b border-white/10 p-3">
              <h3 className="font-[family-name:var(--font-geist-mono)] text-[10.5px] tracking-wider text-white/50">
                YOUR CAMERA
              </h3>
              <video
                ref={videoRef}
                className="mt-2 aspect-video w-full rounded-xl border border-white/10 bg-black object-cover"
                playsInline
                muted
              />
              <p className="mt-2 text-[11px] leading-snug text-gray-400 sm:text-xs">
                {cameraReady
                  ? "Camera and mic are on. Session is recorded securely."
                  : "If you don’t see yourself, check browser permissions."}
              </p>
            </div>
            {voiceEmbedOpen ? (
              <div className="flex shrink-0 flex-col border-b border-white/10 p-3">
                <h3 className="font-[family-name:var(--font-geist-mono)] text-[10.5px] tracking-wider text-sky-300/80">
                  AI INTERVIEWER · DISCUSSION
                </h3>
                <div className="mt-2 min-w-0">
                  <RealtimeInterviewClient
                    interviewId={interviewId}
                    isCodingDiscussion
                    codingEmbed
                    codingDiscussionHost
                    reuseMediaStreamRef={mediaStreamRef}
                    integrityEmit={integrity.emit}
                    integrityBindWs={integrity.bindWs}
                    className="w-full"
                    onCodingDiscussionHostNotify={(kind) => {
                      setVoiceEmbedOpen(false);
                      if (kind === "done") {
                        toast.success(
                          "Discussion finished. Your report is being prepared.",
                        );
                        void load();
                      }
                    }}
                  />
                </div>
                <p className="mt-2 text-[11px] leading-snug text-gray-400 sm:text-xs">
                  AI Interview Practice debrief with the AI interviewer about your solutions.
                </p>
              </div>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
              <h3 className="flex items-baseline justify-between font-[family-name:var(--font-geist-mono)] text-[10.5px] tracking-wider text-white/50">
                PROBLEMS
                <span className="text-white/40">{submissions.length}/{problems.length} SUBMITTED</span>
              </h3>
              <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
                {problems.map((p, idx) => {
                  const sub = submissions.find(
                    (s) => s.problemId === p.problemId,
                  );
                  const active = activeId === p.problemId;
                  return (
                    <li key={p.problemId}>
                      <button
                        type="button"
                        onClick={() => setActiveId(p.problemId)}
                        className={cn(
                          "flex w-full gap-2.5 rounded-xl border px-2.5 py-2.5 text-left text-xs transition-colors",
                          active
                            ? "border-primary/50 bg-primary/15 text-white"
                            : "border-white/10 bg-white/[0.02] text-gray-300 hover:border-white/20 hover:bg-white/[0.05]",
                        )}
                      >
                        <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md font-[family-name:var(--font-geist-mono)] text-[10px]", sub ? "bg-emerald-400/15 text-emerald-300" : active ? "bg-primary/30 text-white" : "bg-white/[0.06] text-white/50")}>
                          {sub ? <Check className="h-3 w-3" /> : String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-[13px] font-medium text-white">{p.title}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-2">
                            <span className={cn("rounded px-1.5 py-px font-[family-name:var(--font-geist-mono)] text-[9.5px] uppercase", difficultyTone(p.difficulty))}>{p.difficulty}</span>
                            {sub ? (
                              <span className="font-[family-name:var(--font-geist-mono)] text-[10.5px] text-emerald-300">
                                {sub.finalScore}% · {sub.testsPassed}/{sub.testsTotal} TESTS
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11.5px] leading-relaxed text-white/55">
                <p className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-wider text-white/40">GOOD TO KNOW</p>
                <ul className="mt-1.5 space-y-1">
                  <li><b className="font-medium text-white/80">Run</b> checks the public samples only.</li>
                  <li><b className="font-medium text-white/80">Submit</b> runs the hidden tests too.</li>
                </ul>
              </div>
            </div>
          </aside>

          {isXlWorkspaceRow ? (
            <HorizontalResizeHandle
              label="Drag to resize sidebar and problem panels"
              {...asideResize.handleProps}
            />
          ) : null}

          <main
            ref={setProblemEl}
            className={cn(
              "flex min-h-0 min-w-0 w-full flex-1 flex-col border-white/10 bg-[#0B1322]/60 backdrop-blur",
              isXlWorkspaceRow
                ? "xl:w-auto xl:max-w-none xl:flex-none xl:shrink-0 xl:border-r"
                : "xl:flex-1 xl:border-r",
            )}
            style={
              isXlWorkspaceRow ? { width: problemPaneWidthPx } : undefined
            }
          >
            <div className="shrink-0 border-b border-white/10 px-3 py-2 sm:px-4">
              <p className="font-[family-name:var(--font-geist-mono)] text-[10.5px] tracking-wider text-white/50">
                ACTIVE PROBLEM
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {problems.map((p) => (
                  <button
                    key={p.problemId}
                    type="button"
                    onClick={() => setActiveId(p.problemId)}
                    className={cn(
                      "shrink-0 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                      activeId === p.problemId
                        ? "border-primary/50 bg-primary/20 text-white"
                        : "border-white/10 bg-white/[0.02] text-white/55 hover:border-white/20 hover:text-white",
                    )}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
              {activeProblem ? (
                <ProblemDescriptionDark problem={activeProblem} />
              ) : (
                <p className="text-sm text-gray-400">Select a problem.</p>
              )}
            </div>
          </main>

          {isXlWorkspaceRow ? (
            <HorizontalResizeHandle
              label="Drag to resize problem and editor panels"
              {...problemPaneResize.handleProps}
            />
          ) : null}

          <section className="flex min-h-0 w-full min-w-0 shrink-0 flex-col border-t border-white/10 bg-[#0B1322]/80 backdrop-blur xl:h-full xl:min-h-0 xl:min-w-[400px] xl:flex-1 xl:max-w-none xl:self-stretch xl:border-l xl:border-t-0">
            <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-[family-name:var(--font-geist-mono)] text-[10.5px] tracking-wider text-white/50">
                  EDITOR
                </h3>
                <Select
                  value={language}
                  onValueChange={(v: Lang) => {
                    if (activeProblem) {
                      const k = draftKey(activeProblem.problemId, language);
                      setDrafts((prev) => ({ ...prev, [k]: code }));
                    }
                    setLanguage(v);
                  }}
                >
                  <SelectTrigger className="h-9 w-[150px] rounded-lg border-white/15 bg-white/[0.05] text-[13px] text-white focus:ring-primary/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[200] rounded-xl border-white/10 bg-[#0b1220] text-white shadow-xl">
                    {LANG_OPTIONS.map((o) => (
                      <SelectItem
                        key={o.id}
                        value={o.id}
                        className="focus:bg-card/10 focus:text-white"
                      >
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div
                ref={setEditorEl}
                className="h-[min(58vh,680px)] min-h-[400px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e]"
              >
                <MonacoEditor
                  height="100%"
                  language={monacoLang}
                  theme="vs-dark"
                  value={code}
                  onChange={(v) => persistDraft(v ?? "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    contextmenu: false,
                  }}
                  onMount={(editor, monaco) => {
                    monacoEditorRef.current = editor;
                    monacoNsRef.current = monaco;
                    setMonacoReady((n) => n + 1);
                  }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRun}
                  disabled={running}
                  className="h-10 rounded-xl border-white/15 bg-white/[0.05] px-4 text-[13.5px] text-white hover:bg-white/10 hover:text-white"
                >
                  {running ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-1 h-4 w-4" />
                  )}
                  Run samples
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitProblem}
                  className="h-10 rounded-xl bg-primary px-4 text-[13.5px] font-semibold text-white shadow-[0_10px_26px_-12px_rgba(115,103,240,.9)] hover:bg-primary/90"
                >
                  <Send className="mr-1 h-4 w-4" />
                  Submit all
                </Button>
              </div>
              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
                {runPanel?.type === "structured" ? (
                  <CodingRunResultsPanel
                    payload={runPanel.payload}
                    theme="dark"
                    successHint="All sample tests passed — you can submit when ready."
                  />
                ) : null}
                {runPanel?.type === "text" ? (
                  <div
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm shadow-md shadow-black/20",
                      runPanel.message.startsWith("Submitted.")
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                        : "border-red-500/40 bg-red-500/10 text-red-200",
                    )}
                  >
                    {runPanel.message}
                  </div>
                ) : null}
                <p className="text-[11px] leading-relaxed text-gray-400 sm:text-xs">
                  Run uses public cases only. Submit includes hidden tests. Video
                  uploads when you open Discuss or stop sharing.
                </p>
              </div>
            </div>
          </section>
          </div>
        </div>

        <AlertDialog
          open={discussionPromptOpen}
          onOpenChange={(open) => {
            if (!discussBusy) setDiscussionPromptOpen(open);
          }}
        >
          <AlertDialogContent className={cn(dash2026Scope, "z-[220] rounded-[22px] border-white/10 bg-[#0D1626] text-white sm:max-w-lg")}>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[20px] font-bold tracking-tight text-white">
                Now talk it through
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 text-left text-sm text-gray-300">
                <span className="block">
                  You&apos;ve submitted all problems. Start AI Interview Practice with
                  the AI interviewer to reflect on your approach, tradeoffs, and
                  solutions — without leaving this page.
                </span>
                <span className="block text-sm text-gray-400">
                  Your coding recording will finish uploading first; then the
                  discussion opens in a panel under your camera.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:justify-end">
              <AlertDialogCancel
                disabled={discussBusy}
                className="border-white/20 bg-card/5 text-white hover:bg-card/10 hover:text-white"
              >
                Not now
              </AlertDialogCancel>
              <Button
                type="button"
                disabled={discussBusy}
                className="rounded-xl bg-primary font-semibold text-white hover:bg-primary/90"
                onClick={() => void launchDiscussionVoice()}
              >
                {discussBusy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Start Discussion
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {exitConfirmDialog}
      </div>
    );
  }

  return (
    <div className={cn("fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#060B16] text-white antialiased", dash2026Scope)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="bg-blueprint-dark absolute inset-0 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_10%,#000_30%,transparent_80%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_35%_at_15%_0%,rgba(115,103,240,.22),transparent_70%),radial-gradient(35%_30%_at_90%_5%,rgba(31,143,255,.12),transparent_70%)]" />
      </div>

      <header className="relative z-20 shrink-0 border-b border-white/10 bg-[#060B16]/80 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              className="shrink-0 text-left text-xs font-medium text-white/80 transition-colors hover:text-white sm:text-sm"
              onClick={() => setExitConfirmOpen(true)}
            >
              ← Exit
            </button>
            <span className="hidden h-4 w-px bg-card/15 sm:block" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold tracking-[-0.02em] text-white">{interview?.metadata.role || "Coding round"}</span>
              <span className="block truncate font-[family-name:var(--font-geist-mono)] text-[10.5px] tracking-wide text-white/45">
                CODING ROUND{interview?.metadata.targetCompany ? ` · ${interview.metadata.targetCompany.toUpperCase()}` : ""}
              </span>
            </span>
            <CodingPhaseStepper
              codingActive={codingStarted}
              allSubmitted={allSubmitted}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              className="h-10 rounded-xl bg-primary px-4 text-[13.5px] font-semibold text-white shadow-[0_10px_26px_-12px_rgba(115,103,240,.9)] hover:bg-primary/90"
              onClick={() => setStartSessionOpen(true)}
              disabled={starting}
            >
              {starting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Start Solving Problems
            </Button>
            <AlertDialog
              open={startSessionOpen}
              onOpenChange={(open) => {
                if (!starting) setStartSessionOpen(open);
              }}
            >
              <AlertDialogContent className={cn(dash2026Scope, "rounded-[22px] border-white/10 bg-[#0D1626] text-white sm:max-w-lg")}>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-[20px] font-bold tracking-tight text-white">
                    Start your coding round
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2 text-left text-sm text-gray-300">
                    <span className="block">
                      You need the camera and microphone on, and permission to
                      record your screen for this practice round.
                    </span>
                    <span className="block text-sm text-gray-400">
                      Your browser will ask for camera and mic first, then for
                      what to share for screen capture. Recording begins once
                      both are allowed.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:justify-end">
                  <AlertDialogCancel
                    disabled={starting}
                    className="border-white/20 bg-card/5 text-white hover:bg-card/10 hover:text-white"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    type="button"
                    disabled={starting}
                    className="rounded-xl bg-primary font-semibold text-white hover:bg-primary/90"
                    onClick={() => void handleStartCoding()}
                  >
                    {starting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting…
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {cameraError ? (
        <div className="relative z-20 shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
          {cameraError}
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 overflow-y-auto px-4 py-10">
        <div className="m-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <p className="font-[family-name:var(--font-geist-mono)] text-[12px] tracking-wider text-sky-300/90">— READY WHEN YOU ARE —</p>
            <h1 className="text-balance mt-4 text-[34px] font-black leading-[1.03] tracking-[-0.045em] text-white md:text-[46px]">
              {problems.length || 3} problems. Then you{" "}
              <span className="bg-gradient-to-r from-[#A99CFF] to-[#5CD3FF] bg-clip-text text-transparent">defend them out loud.</span>
            </h1>
            <ol className="mt-7 space-y-3">
              {[
                ["Solve", "Write code in the editor, run it against the sample tests."],
                ["Submit", "Each submit also runs hidden tests and locks your score for that problem."],
                ["Discuss", "Talk through your approach and trade-offs with the AI interviewer."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-sky-300">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block text-[15px] font-semibold text-white">{t}</span>
                    <span className="block text-[13.5px] leading-relaxed text-white/60">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            {problems.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {problems.map((p) => (
                  <span key={p.problemId} className={cn("rounded-md border px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[10.5px] uppercase", difficultyTone(p.difficulty))}>{p.difficulty}</span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-[22px] border border-white/10 bg-[#0D1626]/85 p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,.7)] backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="font-[family-name:var(--font-geist-mono)] text-[10.5px] tracking-wider text-white/50">CAMERA &amp; MIC CHECK</p>
              {cameraReady ? <span className="inline-flex items-center gap-1.5 font-[family-name:var(--font-geist-mono)] text-[10.5px] text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-400" />ON</span> : null}
            </div>
            <video
              ref={videoRef}
              className="mt-3 aspect-video w-full rounded-xl border border-white/10 bg-black object-cover"
              playsInline
              muted
            />
            <p className="mt-3 text-[12.5px] leading-relaxed text-white/55">
              {starting
                ? "Allow camera, microphone and screen capture when your browser asks."
                : "When you start, your browser asks for camera and mic, then which screen to share. Recording begins once both are allowed."}
            </p>
            <Button
              type="button"
              className="mt-4 h-12 w-full rounded-xl bg-primary text-[15px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(115,103,240,.9)] hover:bg-primary/90"
              onClick={() => setStartSessionOpen(true)}
              disabled={starting}
            >
              {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {starting ? "Starting…" : "Start solving"}
            </Button>
          </div>
        </div>
      </div>
      {exitConfirmDialog}
    </div>
  );
}
