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
import {
  combineScreenAndMicForRecording,
  pickRecorderMimeType,
} from "@/lib/codingSessionRecording";
import { cn } from "@/lib/utils";
import {
  Braces,
  CheckCircle2,
  Check,
  FileText,
  GripVertical,
  Loader2,
  MessageCircle,
  Play,
  Send,
  Video,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { RealtimeInterviewClient } from "@/components/interview/RealtimeInterviewClient";

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

/** `w-64` aside + problem | splitter | editor (xl row). */
const ASIDE_WIDTH_XL_PX = 256;
const PROBLEM_PANE_MIN_PX = 280;
const EDITOR_PANE_MIN_XL_PX = 400;
const COL_SPLITTER_PX = 8;

function maxProblemPaneWidth(rowInnerWidthPx: number): number {
  if (rowInnerWidthPx < 1) {
    return typeof window !== "undefined"
      ? Math.max(PROBLEM_PANE_MIN_PX, Math.floor(window.innerWidth * 0.4))
      : 560;
  }
  return Math.max(
    PROBLEM_PANE_MIN_PX,
    rowInnerWidthPx -
      ASIDE_WIDTH_XL_PX -
      COL_SPLITTER_PX -
      EDITOR_PANE_MIN_XL_PX,
  );
}

type CodingRunCase = {
  index: number;
  passed: boolean;
  expected?: string;
  actual?: string;
  stderr?: string;
  compileOutput?: string;
  status?: string;
  error?: string;
};

type CodingRunPayload = {
  results: CodingRunCase[];
  passed: number;
  total: number;
};

type RunPanelState =
  | { type: "structured"; payload: CodingRunPayload }
  | { type: "text"; message: string };

function displayOut(s: string | undefined) {
  if (s === undefined) return "—";
  if (s === "") return "(empty)";
  return s;
}

function CodingRunResultsPanel({
  payload,
  theme = "light",
}: Readonly<{ payload: CodingRunPayload; theme?: "light" | "dark" }>) {
  const { results, passed, total } = payload;
  const failed = total - passed;
  const allPass = total > 0 && passed === total;
  const allFail = total > 0 && passed === 0;
  const dark = theme === "dark";

  return (
    <section
      aria-label="Test run results"
      className={cn(
        "rounded-lg border overflow-hidden text-sm",
        dark
          ? cn(
              allPass && "border-emerald-500/40 bg-emerald-500/10",
              !allPass && !allFail && total > 0 && "border-amber-500/35 bg-amber-500/10",
              allFail && "border-red-500/40 bg-red-500/10",
              total === 0 && "border-white/10 bg-white/[0.04]",
            )
          : cn(
              allPass && "border-emerald-200 bg-emerald-50/40",
              !allPass && !allFail && total > 0 && "border-amber-200 bg-amber-50/30",
              allFail && "border-red-200 bg-red-50/30",
              total === 0 && "border-slate-200 bg-slate-50",
            ),
      )}
    >
      <div
        className={cn(
          "px-3 py-2 border-b flex flex-wrap items-center gap-2",
          dark
            ? cn(
                allPass && "border-emerald-500/30 bg-emerald-500/15",
                !allPass && !allFail && total > 0 && "border-amber-500/25 bg-amber-500/10",
                allFail && "border-red-500/30 bg-red-500/15",
                total === 0 && "border-white/10 bg-white/[0.06]",
              )
            : cn(
                allPass && "border-emerald-200/80 bg-emerald-50/80",
                !allPass && !allFail && total > 0 && "border-amber-200/80 bg-amber-50/60",
                allFail && "border-red-200/80 bg-red-50/60",
                total === 0 && "border-slate-200 bg-slate-100/80",
              ),
        )}
      >
        {total === 0 ? (
          <span
            className={cn(
              "font-medium",
              dark ? "text-gray-400" : "text-slate-700",
            )}
          >
            No tests were run.
          </span>
        ) : (
          <>
            <span
              className={cn(
                "font-semibold tabular-nums",
                dark
                  ? allPass
                    ? "text-emerald-400"
                    : "text-white"
                  : allPass
                    ? "text-emerald-800"
                    : "text-slate-900",
              )}
            >
              {passed} / {total} passed
            </span>
            {failed > 0 && (
              <span
                className={cn(
                  "font-medium tabular-nums",
                  dark ? "text-red-400" : "text-red-700",
                )}
              >
                {failed} failed
              </span>
            )}
            {allPass && (
              <span
                className={cn(
                  "text-xs sm:text-sm",
                  dark ? "text-emerald-400/90" : "text-emerald-700",
                )}
              >
                All sample tests passed — you can submit when ready.
              </span>
            )}
          </>
        )}
      </div>
      <ul
        className={cn(
          "max-h-56 overflow-y-auto",
          dark ? "divide-y divide-white/10" : "divide-y divide-slate-200/80",
        )}
      >
        {results.map((r) => (
          <li
            key={r.index}
            className={cn(
              "px-3 py-3 space-y-2",
              dark
                ? r.passed
                  ? "bg-white/[0.03]"
                  : "bg-white/[0.06]"
                : r.passed
                  ? "bg-white/60"
                  : "bg-white/80",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              {r.passed ? (
                <CheckCircle2
                  className={cn(
                    "h-5 w-5 shrink-0",
                    dark ? "text-emerald-400" : "text-emerald-600",
                  )}
                  aria-hidden
                />
              ) : (
                <XCircle
                  className={cn(
                    "h-5 w-5 shrink-0",
                    dark ? "text-red-400" : "text-red-600",
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  dark ? "text-white" : "text-slate-900",
                )}
              >
                Test {r.index + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold uppercase tracking-wide",
                  r.passed
                    ? dark
                      ? "text-emerald-400"
                      : "text-emerald-700"
                    : dark
                      ? "text-red-400"
                      : "text-red-700",
                )}
              >
                {r.passed ? "Passed" : "Failed"}
              </span>
              {r.status ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-normal",
                    dark &&
                      "border-white/20 bg-white/[0.06] text-gray-200",
                  )}
                >
                  {r.status}
                </Badge>
              ) : null}
            </div>

            {(r.expected !== undefined || r.actual !== undefined) && (
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                <div>
                  <div
                    className={cn(
                      "font-sans text-xs font-medium mb-0.5",
                      dark ? "text-gray-400" : "text-slate-500",
                    )}
                  >
                    Expected
                  </div>
                  <pre
                    className={cn(
                      "whitespace-pre-wrap break-words rounded border px-2 py-1.5 font-mono text-xs",
                      dark
                        ? r.passed
                          ? "border-emerald-500/35 bg-black/35 text-emerald-200/95"
                          : "border-white/15 bg-black/35 text-gray-200"
                        : r.passed
                          ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                          : "border-slate-200 bg-slate-50 text-slate-800",
                    )}
                  >
                    {displayOut(r.expected)}
                  </pre>
                </div>
                <div>
                  <div
                    className={cn(
                      "font-sans text-xs font-medium mb-0.5",
                      dark ? "text-gray-400" : "text-slate-500",
                    )}
                  >
                    Your output
                  </div>
                  <pre
                    className={cn(
                      "whitespace-pre-wrap break-words rounded border px-2 py-1.5 font-mono text-xs",
                      dark
                        ? r.passed
                          ? "border-emerald-500/35 bg-black/35 text-emerald-200/95"
                          : "border-red-500/40 bg-red-500/10 text-red-200"
                        : r.passed
                          ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                          : "border-red-200 bg-red-50/90 text-red-900",
                    )}
                  >
                    {displayOut(r.actual)}
                  </pre>
                </div>
              </div>
            )}

            {r.error ? (
              <div
                className={cn(
                  "rounded border px-2 py-1.5 text-xs",
                  dark
                    ? "border-red-900/60 bg-red-950/40 text-red-200"
                    : "border-red-200 bg-red-50 text-red-900",
                )}
              >
                <span
                  className={cn(
                    "font-semibold",
                    dark ? "text-red-300" : "text-red-800",
                  )}
                >
                  Note:{" "}
                </span>
                {r.error}
              </div>
            ) : null}
            {r.stderr ? (
              <div>
                <div
                  className={cn(
                    "font-sans font-medium text-xs mb-0.5",
                    dark ? "text-gray-400" : "text-slate-500",
                  )}
                >
                  stderr
                </div>
                <pre
                  className={cn(
                    "whitespace-pre-wrap break-words rounded border px-2 py-1.5 font-mono text-xs max-h-24 overflow-y-auto",
                    dark
                      ? "border-blue-400/35 bg-blue-500/10 text-blue-200/90"
                      : "border-amber-200 bg-amber-50/80 text-amber-950",
                  )}
                >
                  {r.stderr.trim() || "(empty)"}
                </pre>
              </div>
            ) : null}
            {r.compileOutput ? (
              <div>
                <div
                  className={cn(
                    "font-sans font-medium text-xs mb-0.5",
                    dark ? "text-gray-400" : "text-slate-500",
                  )}
                >
                  Compiler output
                </div>
                <pre
                  className={cn(
                    "whitespace-pre-wrap break-words rounded border px-2 py-1.5 font-mono text-xs max-h-24 overflow-y-auto",
                    dark
                      ? "border-white/15 bg-black/35 text-gray-300"
                      : "border-slate-200 bg-slate-100 text-slate-900",
                  )}
                >
                  {r.compileOutput.trim() || "(empty)"}
                </pre>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProblemDescriptionDark({
  problem,
}: Readonly<{ problem: CodingProblemPublic }>) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-blue-400/80" aria-hidden />
          <h2 className="truncate text-base font-semibold tracking-tight text-white">
            {problem.title}
          </h2>
        </div>
        <span className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-300">
          {problem.difficulty}
        </span>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-300/90">
          Problem description
        </h3>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-gray-200 whitespace-pre-wrap shadow-lg shadow-black/20">
          {problem.statement}
        </div>
        <p className="mt-2 text-xs leading-snug text-gray-400">
          The starter code is an{" "}
          <span className="text-violet-200/90">I/O template</span> — add your
          logic and print the required answer.
        </p>
      </div>

      {problem.publicTests.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300/90">
            Examples (sample I/O)
          </h3>
          <div className="space-y-3">
            {problem.publicTests.map((t, i) => (
              <div
                key={`${i}-${t.input.slice(0, 20)}`}
                className="space-y-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-lg shadow-black/20"
              >
                <div className="text-xs font-semibold text-gray-300">
                  Example {i + 1}
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400">
                    Input:
                  </span>
                  <pre className="mt-1 whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-gray-100 sm:text-sm">
                    {t.input || "(empty)"}
                  </pre>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400">
                    Output:
                  </span>
                  <pre className="mt-1 whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-gray-100 sm:text-sm">
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
  return (
    <ol className="m-0 hidden list-none items-center gap-2 p-0 text-[11px] font-medium md:flex">
      <li
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1",
          codingActive
            ? "border-blue-400/40 bg-blue-500/15 text-blue-300"
            : "border-white/10 text-gray-500",
        )}
      >
        {codingActive ? (
          <Check className="h-3 w-3 shrink-0 text-blue-400" aria-hidden />
        ) : (
          <span
            className="h-3 w-3 shrink-0 rounded-full border border-white/20"
            aria-hidden
          />
        )}
        Live session
      </li>
      <li className="select-none text-gray-600" aria-hidden>
        →
      </li>
      <li
        className={cn(
          "rounded-full border px-2.5 py-1",
          codingActive && !allSubmitted
            ? "border-violet-400/40 bg-violet-600/20 text-violet-100 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]"
            : "border-white/10 text-gray-500",
        )}
      >
        Code & test
      </li>
      <li className="select-none text-gray-600" aria-hidden>
        →
      </li>
      <li
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1",
          allSubmitted
            ? "border-white/20 bg-white/[0.08] text-gray-100"
            : "border-white/10 text-gray-500",
        )}
      >
        {allSubmitted ? (
          <Check className="h-3 w-3 shrink-0 text-blue-400" aria-hidden />
        ) : null}
        All submitted
      </li>
    </ol>
  );
}

export default function CodingInterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = params.interviewId as string;

  const videoRef = useRef<HTMLVideoElement>(null);
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
  const [problemPaneWidthPx, setProblemPaneWidthPx] = useState(560);
  const [workspaceRowWidthPx, setWorkspaceRowWidthPx] = useState(0);
  const [isXlWorkspaceRow, setIsXlWorkspaceRow] = useState(false);

  const problemPaneStorageKey = `coding-problem-pane-w-${interviewId}`;
  const codingWorkspaceRowRef = useRef<HTMLDivElement>(null);
  const colSplitDragRef = useRef<{ startX: number; startW: number } | null>(
    null,
  );
  const problemPaneWidthRef = useRef(560);

  const load = useCallback(async () => {
    try {
      const data = await codingInterviewApi.getSession(interviewId);
      const st = data.interview.status;
      if (st === "completed") {
        router.replace(`/dashboard/interviews/${interviewId}/report`);
        return;
      }
      if (st === "processing") {
        router.replace(`/dashboard/interviews/${interviewId}/processing`);
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
  }, [interviewId, router]);

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
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = () => setIsXlWorkspaceRow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(problemPaneStorageKey);
      if (raw) {
        const n = Number.parseInt(raw, 10);
        if (!Number.isNaN(n) && n >= PROBLEM_PANE_MIN_PX) {
          setProblemPaneWidthPx(n);
          problemPaneWidthRef.current = n;
        }
      }
    } catch {
      /* ignore */
    }
  }, [problemPaneStorageKey]);

  useEffect(() => {
    problemPaneWidthRef.current = problemPaneWidthPx;
  }, [problemPaneWidthPx]);

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

  useEffect(() => {
    if (!codingStarted) return;
    const el = codingWorkspaceRowRef.current;
    if (!el) return;
    /**
     * Observe a stable-width wrapper (overflow-hidden). Observing a scroll
     * container causes scrollbar show/hide to flip contentRect width and can
     * loop with problem-pane clamp updates — tab freeze when a modal opens
     * after the last submit.
     */
    let raf = 0;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.round(
        entry.contentRect.width ||
          (entry.borderBoxSize?.[0]?.inlineSize ?? 0),
      );
      if (w < 1) return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        setWorkspaceRowWidthPx((prev) =>
          Math.abs(prev - w) < 2 ? prev : w,
        );
      });
    });
    ro.observe(el);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [codingStarted]);

  useEffect(() => {
    if (!isXlWorkspaceRow || workspaceRowWidthPx < 1) return;
    const max = maxProblemPaneWidth(workspaceRowWidthPx);
    setProblemPaneWidthPx((prev) => {
      const clamped = Math.min(
        Math.max(prev, PROBLEM_PANE_MIN_PX),
        max,
      );
      problemPaneWidthRef.current = clamped;
      return clamped;
    });
  }, [workspaceRowWidthPx, isXlWorkspaceRow]);

  const onColSplitPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      colSplitDragRef.current = {
        startX: e.clientX,
        startW: problemPaneWidthRef.current,
      };
    },
    [],
  );

  const onColSplitPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (
        !e.currentTarget.hasPointerCapture(e.pointerId) ||
        colSplitDragRef.current == null
      ) {
        return;
      }
      const dx = e.clientX - colSplitDragRef.current.startX;
      const raw = colSplitDragRef.current.startW + dx;
      const rowW =
        workspaceRowWidthPx > 0
          ? workspaceRowWidthPx
          : typeof window !== "undefined"
            ? window.innerWidth
            : 1280;
      const max = maxProblemPaneWidth(rowW);
      const next = Math.round(
        Math.min(max, Math.max(PROBLEM_PANE_MIN_PX, raw)),
      );
      problemPaneWidthRef.current = next;
      setProblemPaneWidthPx(next);
    },
    [workspaceRowWidthPx],
  );

  const onColSplitPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      colSplitDragRef.current = null;
      try {
        localStorage.setItem(
          problemPaneStorageKey,
          String(problemPaneWidthRef.current),
        );
      } catch {
        /* ignore */
      }
    },
    [problemPaneStorageKey],
  );

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
    const cam = await acquireCameraAndMic();
    if (!cam.ok) {
      toast.error(cam.message);
      setStarting(false);
      startCodingInFlightRef.current = false;
      return;
    }

    let screen: MediaStream | null = null;
    try {
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
    } catch (e: unknown) {
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
      const msg =
        e instanceof Error ? e.message : "Failed to start coding session.";
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
      router.push(`/dashboard/interviews/${interviewId}/processing`);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Could not end session. Please try again.";
      toast.error(msg);
    } finally {
      setExitBusy(false);
    }
  }, [codingStarted, interviewId, router, stopMediaRecorderAndUpload]);

  const exitConfirmDialog = (
    <AlertDialog
      open={exitConfirmOpen}
      onOpenChange={(open) => {
        if (!exitBusy) setExitConfirmOpen(open);
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
                You won&apos;t be able to return to this session to keep coding,
                run tests, or open the AI Interview Practice discussion from here.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:justify-end">
          <AlertDialogCancel
            disabled={exitBusy}
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
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
      <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_#1f2937_0%,_#0b1220_45%,_#060913_100%)] text-white antialiased">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"
            aria-hidden
          />
        </div>

        <header className="relative z-20 shrink-0 border-b border-white/10 bg-[#0b1220]/95">
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
                className="hidden h-4 w-px bg-white/15 sm:block"
                aria-hidden
              />
              <span className="truncate text-sm font-semibold tracking-tight text-white sm:text-sm">
                InterviewTrix · Coding
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
              <span className="font-mono text-sm tabular-nums text-gray-300/90 sm:text-sm">
                {Math.floor(remainingSec / 60)}:
                {(remainingSec % 60).toString().padStart(2, "0")}
              </span>
              {allSubmitted ? (
                <Button
                  type="button"
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 text-xs text-white shadow-lg shadow-black/25 transition-none hover:from-violet-700 hover:to-blue-700 sm:h-10 sm:text-sm"
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
              "flex shrink-0 flex-col border-white/10 bg-white/[0.04] shadow-lg shadow-black/20 xl:h-auto xl:border-r",
              voiceEmbedOpen
                ? "min-h-0 xl:h-full xl:w-80 xl:max-h-none xl:self-stretch"
                : "max-h-[38vh] xl:max-h-none xl:w-64",
            )}
          >
            <div className="shrink-0 border-b border-white/10 p-3">
              <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-300/90">
                <Video className="h-4 w-4 text-blue-400/90" aria-hidden />
                Your camera
              </h3>
              <video
                ref={videoRef}
                className="mt-2 aspect-video w-full rounded-2xl border border-white/10 bg-black object-cover shadow-lg shadow-black/30"
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
                <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-300/90">
                  <MessageCircle
                    className="h-4 w-4 text-violet-400/90"
                    aria-hidden
                  />
                  AI Interviewer
                </h3>
                <div className="mt-2 min-w-0">
                  <RealtimeInterviewClient
                    interviewId={interviewId}
                    isCodingDiscussion
                    codingEmbed
                    codingDiscussionHost
                    reuseMediaStreamRef={mediaStreamRef}
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
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-300/90">
                Problems
              </h3>
              <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
                {problems.map((p) => {
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
                          "flex w-full flex-col rounded-xl border px-2.5 py-2 text-left text-xs transition-colors",
                          active
                            ? "border-violet-400/45 bg-violet-600/20 text-white shadow-[0_0_0_1px_rgba(139,92,246,0.2)]"
                            : "border-white/10 bg-white/[0.04] text-gray-300 hover:border-white/20 hover:bg-white/[0.07]",
                        )}
                      >
                        <span className="line-clamp-2 font-medium text-white">
                          {p.title}
                        </span>
                        <span className="mt-0.5 text-xs uppercase tracking-wide text-gray-400">
                          {p.difficulty}
                        </span>
                        {sub ? (
                          <span className="mt-1 text-[11px] text-blue-400/95 sm:text-xs">
                            Done · {sub.finalScore}% ({sub.testsPassed}/
                            {sub.testsTotal})
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-[11px] leading-relaxed text-gray-400 shadow-md shadow-black/20 sm:text-xs">
                <p className="font-medium text-gray-300">Tips</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-3.5">
                  <li>Run checks public samples only.</li>
                  <li>Submit runs hidden tests too.</li>
                </ul>
              </div>
            </div>
          </aside>

          <main
            className={cn(
              "flex min-h-0 min-w-0 w-full flex-1 flex-col border-white/10 bg-white/[0.04] shadow-lg shadow-black/20",
              isXlWorkspaceRow
                ? "xl:w-auto xl:max-w-none xl:flex-none xl:shrink-0 xl:border-r"
                : "xl:flex-1 xl:border-r",
            )}
            style={
              isXlWorkspaceRow ? { width: problemPaneWidthPx } : undefined
            }
          >
            <div className="shrink-0 border-b border-white/10 px-3 py-2 sm:px-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-300/90">
                Active problem
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {problems.map((p) => (
                  <button
                    key={p.problemId}
                    type="button"
                    onClick={() => setActiveId(p.problemId)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      activeId === p.problemId
                        ? "border-violet-400/45 bg-violet-600/20 text-white shadow-[0_0_0_1px_rgba(139,92,246,0.2)]"
                        : "border-white/10 bg-white/[0.04] text-gray-400 hover:border-white/20 hover:text-gray-200",
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

          <button
            type="button"
            aria-label="Drag to resize problem and editor panels"
            className="hidden min-h-0 w-2 shrink-0 cursor-col-resize touch-none flex-col items-center justify-center border-x border-white/10 bg-white/[0.06] hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 xl:flex"
            onPointerDown={onColSplitPointerDown}
            onPointerMove={onColSplitPointerMove}
            onPointerUp={onColSplitPointerUp}
            onPointerCancel={onColSplitPointerUp}
          >
            <GripVertical
              className="h-10 w-3.5 text-gray-500 hover:text-gray-300"
              aria-hidden
            />
          </button>

          <section className="flex min-h-0 w-full min-w-0 shrink-0 flex-col border-t border-white/10 bg-white/[0.04] shadow-lg shadow-black/20 xl:h-full xl:min-h-0 xl:min-w-[400px] xl:flex-1 xl:max-w-none xl:self-stretch xl:border-l xl:border-t-0">
            <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-300/90">
                  <Braces className="h-4 w-4 text-blue-400/90" aria-hidden />
                  Code editor
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
                  <SelectTrigger className="h-9 w-[150px] rounded-xl border-white/15 bg-white/[0.06] text-xs text-white shadow-md shadow-black/20 focus:ring-blue-400/40 sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[200] rounded-xl border-white/10 bg-[#0b1220] text-white shadow-xl">
                    {LANG_OPTIONS.map((o) => (
                      <SelectItem
                        key={o.id}
                        value={o.id}
                        className="focus:bg-white/10 focus:text-white"
                      >
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[min(58vh,680px)] min-h-[400px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-inner shadow-black/40">
                <MonacoEditor
                  height="100%"
                  language={monacoLang}
                  theme="vs-dark"
                  value={code}
                  onChange={(v) => persistDraft(v ?? "")}
                  options={{ minimap: { enabled: false }, fontSize: 14 }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRun}
                  disabled={running}
                  className="rounded-xl border-white/20 bg-white/[0.06] text-xs text-white shadow-md shadow-black/15 hover:bg-white/10 hover:text-white sm:h-10 sm:text-sm"
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
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 text-xs text-white shadow-lg shadow-black/25 transition-none hover:from-violet-700 hover:to-blue-700 sm:h-10 sm:text-sm"
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
          <AlertDialogContent className="z-[220] border-white/10 bg-[#0f172a] text-white sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base text-white">
                Let&apos;s discuss and analyze your problem-solving
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
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                Not now
              </AlertDialogCancel>
              <Button
                type="button"
                disabled={discussBusy}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-700 hover:to-blue-700"
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
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_#1f2937_0%,_#0b1220_45%,_#060913_100%)] text-white antialiased">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"
          aria-hidden
        />
      </div>

      <header className="relative z-20 shrink-0 border-b border-white/10 bg-[#0b1220]/95">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              className="shrink-0 text-left text-xs font-medium text-white/80 transition-colors hover:text-white sm:text-sm"
              onClick={() => setExitConfirmOpen(true)}
            >
              ← Exit
            </button>
            <span className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden />
            <span className="truncate text-sm font-semibold tracking-tight text-white sm:text-sm">
              InterviewTrix · Coding
            </span>
            <CodingPhaseStepper
              codingActive={codingStarted}
              allSubmitted={allSubmitted}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 text-xs text-white shadow-lg shadow-black/25 transition-none hover:from-violet-700 hover:to-blue-700 sm:h-10 sm:text-sm"
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
              <AlertDialogContent className="border-white/10 bg-[#0f172a] text-white sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base text-white">
                    Start your session
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
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    type="button"
                    disabled={starting}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-700 hover:to-blue-700"
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

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
        <div className="w-full max-w-md space-y-5 text-center">
          <div className="space-y-2 text-left">
            <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-300/90">
              <Video className="h-4 w-4 text-blue-400/90" aria-hidden />
              Camera &amp; mic
            </h3>
            <video
              ref={videoRef}
              className="aspect-video w-full rounded-2xl border border-white/10 bg-black object-cover shadow-lg shadow-black/30"
              playsInline
              muted
            />
            <p className="text-xs text-gray-500">
              We need this preview so your browser can attach the camera stream
              before recording starts.
            </p>
          </div>
          {starting ? (
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-violet-400" />
          ) : null}
          <p className="text-sm text-gray-300">
            {starting
              ? "Allow camera, microphone, and screen capture when your browser prompts you."
              : "When you’re ready, choose Start Solving Problems in the header. Your browser will ask for camera, microphone, and screen capture."}
          </p>
        </div>
      </div>
      {exitConfirmDialog}
    </div>
  );
}
