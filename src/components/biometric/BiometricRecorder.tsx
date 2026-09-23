"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Mic,
  RefreshCw,
  ScanFace,
  Shield,
  Upload,
  Video,
  XCircle,
} from "lucide-react";
import { computeAnalyserRms } from "@/lib/integrity/vadGate";
import { countValidFaces, type FaceHit } from "@/lib/integrity/facePresencePolicy";
import {
  biometricApi,
  biometricFailedCopy,
  type BiometricCredential,
} from "@/lib/biometric/api";
import {
  accumulateGoodMs,
  activeCredentialLineIndex,
  canUploadCredential,
  CREDENTIAL_AUDIO_RMS_MIN,
  CREDENTIAL_MAX_WALL_MS,
  CREDENTIAL_SENTENCES,
  CREDENTIAL_TARGET_MS,
} from "@/lib/biometric/qualityPolicy";
import { appCard, appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

type FaceDetectorHandle = {
  detect: (source: HTMLCanvasElement) => FaceHit[];
  close?: () => void;
};

const GUIDE_STEPS = [
  {
    icon: ScanFace,
    title: "Sit in good light",
    body: "One face in frame, looking at the camera. The lens stays off until you start.",
  },
  {
    icon: Video,
    title: "Read the lines on screen",
    body: "The script appears over the video, like a teleprompter. Speak naturally for 15 good seconds.",
  },
  {
    icon: Upload,
    title: "Upload the clip",
    body: "Keep going until the bar fills, then upload. A blink will not reset progress.",
  },
] as const;

async function createDetector(): Promise<FaceDetectorHandle | null> {
  try {
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
    );
    const detector = await vision.FaceDetector.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
      },
      runningMode: "IMAGE",
      minDetectionConfidence: 0.7,
      minSuppressionThreshold: 0.4,
    });
    return {
      detect: (canvas) => {
        const result = detector.detect(canvas);
        return (result.detections ?? []).map((detection) => ({
          score: detection.categories?.[0]?.score ?? 0,
          areaRatio:
            canvas.width * canvas.height > 0
              ? ((detection.boundingBox?.width ?? 0) *
                  (detection.boundingBox?.height ?? 0)) /
                (canvas.width * canvas.height)
              : 0,
        }));
      },
      close: () => detector.close(),
    };
  } catch {
    return null;
  }
}

function uploadResultCopy(credential: BiometricCredential) {
  if (credential.status === "approved" || credential.status === "human_verified") {
    return {
      title: "Identity clip uploaded",
      body: "Later interviews can match this clip for an integrity score.",
    };
  }
  if (credential.status === "pending" || credential.status === "in-review") {
    return {
      title: "Clip uploaded — checking quality",
      body: "This usually takes under a minute. You can leave this page.",
    };
  }
  return biometricFailedCopy(credential);
}

function uploadResultTone(status: BiometricCredential["status"]) {
  if (status === "approved" || status === "human_verified") {
    return "border-sky-500/20 bg-sky-500/10 text-sky-600";
  }
  if (status === "pending" || status === "in-review") {
    return "border-[#7367F0]/20 bg-[#7367F0]/10 text-[#7367F0]";
  }
  return "border-rose-500/20 bg-rose-500/10 text-rose-600";
}

function UploadResultIcon({
  status,
}: Readonly<{ status: BiometricCredential["status"] }>) {
  if (status === "pending" || status === "in-review") {
    return <Loader2 className="h-7 w-7 animate-spin" />;
  }
  if (status === "approved" || status === "human_verified") {
    return <CheckCircle2 className="h-7 w-7" />;
  }
  return <XCircle className="h-7 w-7" />;
}

function pickMimeType() {
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
    return "video/webm;codecs=vp8,opus";
  }
  if (MediaRecorder.isTypeSupported("video/webm")) return "video/webm";
  return "";
}

export function BiometricRecorder({
  institutionId,
  onUploaded,
  onStudioChange,
}: Readonly<{
  institutionId?: string | null;
  onUploaded?: (credential: BiometricCredential) => void;
  onStudioChange?: (open: boolean) => void;
}>) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const idInputRef = useRef<HTMLInputElement | null>(null);
  const [started, setStarted] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceOk, setFaceOk] = useState(false);
  const [audioOk, setAudioOk] = useState(false);
  const [goodMs, setGoodMs] = useState(0);
  const [wallMs, setWallMs] = useState(0);
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<BiometricCredential | null>(null);
  const goodRef = useRef(0);
  const wallRef = useRef(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const onUploadedRef = useRef(onUploaded);
  onUploadedRef.current = onUploaded;

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const backToGuide = () => {
    recorderRef.current?.stop();
    stopStream();
    setStarted(false);
    setCameraReady(false);
    setRecording(false);
    setBlob(null);
    setGoodMs(0);
    setWallMs(0);
    setFaceOk(false);
    setAudioOk(false);
    setError(null);
    goodRef.current = 0;
    wallRef.current = 0;
  };

  useEffect(() => {
    onStudioChange?.(started && !uploaded);
  }, [onStudioChange, started, uploaded]);

  useEffect(() => {
    if (!started || uploaded) return;
    stageRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [started, uploaded]);

  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    let detector: FaceDetectorHandle | null = null;
    let analyser: AnalyserNode | null = null;
    let audioCtx: AudioContext | null = null;
    let timer: number | null = null;
    const rmsBuf = new Uint8Array(1024);

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 1280, height: 720 },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraReady(true);
        detector = await createDetector();
        audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);

        timer = window.setInterval(() => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas || video.readyState < 2) return;
          canvas.width = 320;
          canvas.height = Math.max(
            180,
            Math.round((video.videoHeight / video.videoWidth) * 320),
          );
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          let nextFace = false;
          try {
            const hits = detector?.detect(canvas) ?? [];
            nextFace = countValidFaces(hits) === 1;
          } catch {
            nextFace = false;
          }
          const rms = analyser ? computeAnalyserRms(analyser, rmsBuf) : 0;
          const nextAudio = rms >= CREDENTIAL_AUDIO_RMS_MIN;
          setFaceOk(nextFace);
          setAudioOk(nextAudio);
          if (recorderRef.current && recorderRef.current.state === "recording") {
            goodRef.current = accumulateGoodMs(
              goodRef.current,
              nextFace,
              nextAudio,
              200,
            );
            wallRef.current += 200;
            setGoodMs(goodRef.current);
            setWallMs(wallRef.current);
            if (
              goodRef.current >= CREDENTIAL_TARGET_MS ||
              wallRef.current >= CREDENTIAL_MAX_WALL_MS
            ) {
              recorderRef.current.stop();
            }
          }
        }, 200);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Camera and microphone are required",
        );
        setStarted(false);
      }
    })();

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      detector?.close?.();
      void audioCtx?.close();
      stopStream();
      setCameraReady(false);
    };
  }, [started, stopStream]);

  useEffect(() => {
    if (!uploaded) return;
    if (uploaded.status !== "pending" && uploaded.status !== "in-review") {
      return;
    }
    const timer = window.setInterval(() => {
      void biometricApi
        .getMine()
        .then((mine) => {
          if (!mine) return;
          setUploaded(mine);
          onUploadedRef.current?.(mine);
          if (mine.status === "approved" || mine.status === "human_verified") {
            toast.success("Identity clip approved.");
          }
          if (mine.status === "failed" || mine.status === "failed_by_admin") {
            toast.error("Quality check failed. Record a clearer clip.");
          }
        })
        .catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [uploaded?.status]);

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    goodRef.current = 0;
    wallRef.current = 0;
    setGoodMs(0);
    setWallMs(0);
    setBlob(null);
    setError(null);
    try {
      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setRecording(false);
        setBlob(new Blob(chunksRef.current, { type: "video/webm" }));
      };
      recorderRef.current = recorder;
      recorder.start(1000);
      setRecording(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Recording is not supported in this browser",
      );
    }
  };

  const retake = () => {
    recorderRef.current?.stop();
    setBlob(null);
    setGoodMs(0);
    setWallMs(0);
    goodRef.current = 0;
    wallRef.current = 0;
  };

  const uploadEnabled =
    canUploadCredential(goodMs, blob?.size ?? 0) &&
    (!institutionId || Boolean(idFile));

  const upload = async () => {
    if (!blob || !uploadEnabled) return;
    if (institutionId && !idFile) {
      setError("Institute ID card is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { uploadUrl, s3Key } = await biometricApi.presign({
        purpose: "credential",
        contentType: "video/webm",
      });
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "video/webm" },
        body: blob,
      });
      if (!put.ok) throw new Error("Video upload failed");
      let idCardS3Key: string | undefined;
      if (institutionId && idFile) {
        const id = await biometricApi.presign({
          purpose: "id_card",
          contentType: idFile.type || "image/jpeg",
        });
        const idPut = await fetch(id.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": idFile.type || "image/jpeg" },
          body: idFile,
        });
        if (!idPut.ok) throw new Error("ID card upload failed");
        idCardS3Key = id.s3Key;
      }
      const confirmed = await biometricApi.confirmCredential({
        s3Key,
        durationMs: Math.max(goodMs, wallMs),
        idCardS3Key,
      });
      const credential = confirmed ?? (await biometricApi.getMine());
      if (!credential) {
        throw new Error("Clip uploaded, but status did not load. Refresh this page.");
      }
      stopStream();
      setStarted(false);
      setCameraReady(false);
      setRecording(false);
      setBlob(null);
      setUploaded(credential);
      onUploaded?.(credential);
      toast.success(
        credential.status === "pending"
          ? "Clip uploaded. Quality check is running."
          : "Identity clip uploaded.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const promptIndex = recording ? activeCredentialLineIndex(wallMs) : 0;
  const activeLine = CREDENTIAL_SENTENCES[promptIndex];
  const upcomingLine =
    promptIndex < CREDENTIAL_SENTENCES.length - 1
      ? CREDENTIAL_SENTENCES[promptIndex + 1]
      : null;
  const goodPct = Math.min(100, (goodMs / CREDENTIAL_TARGET_MS) * 100);
  const goodSeconds = (goodMs / 1000).toFixed(1);

  if (uploaded) {
    const copy = uploadResultCopy(uploaded);
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-6 text-center sm:py-10">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl border",
            uploadResultTone(uploaded.status),
          )}
        >
          <UploadResultIcon status={uploaded.status} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">
            {copy.title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {copy.body}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full sm:w-auto"
            onClick={() => {
              setUploaded(null);
              setError(null);
            }}
          >
            Record another clip
          </Button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-5 lg:gap-6">
        <div className="min-w-0 space-y-4 sm:space-y-5 lg:col-span-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
              Read this first — camera stays off
            </h2>
          </div>
          <ol className="space-y-3">
            {GUIDE_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="flex gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#7367F0]/15 bg-[#7367F0]/10 text-[#7367F0]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Step {index + 1}
                    </p>
                    <p className="text-sm font-semibold text-foreground sm:text-base">
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <aside
          className={cn(
            appCard,
            "flex min-w-0 flex-col p-4 sm:p-5 lg:col-span-2 lg:row-span-2",
          )}
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-[#7367F0]/40">
            <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 px-4 text-center sm:aspect-video">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white sm:h-14 sm:w-14">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <p className="text-sm font-medium text-white/90">
                Camera is off
              </p>
              <p className="max-w-[16rem] text-xs leading-relaxed text-white/65">
                We only ask for camera and microphone after you start.
              </p>
            </div>
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground sm:mt-5">
            Ready when you are
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            About 15 seconds. Look at the camera and read the lines that appear
            on the video.
          </p>
          {error ? (
            <p className="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
              {error}
            </p>
          ) : null}
          <Button
            type="button"
            className={cn(appPrimaryButton, "mt-4 h-11 w-full sm:mt-5")}
            onClick={() => {
              setError(null);
              setStarted(true);
            }}
          >
            <Video className="h-4 w-4" />
            Start verification
          </Button>
        </aside>

        <div className="min-w-0 rounded-xl border border-border/70 bg-muted/15 p-3 sm:p-4 lg:col-span-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            You will read this on the video
          </p>
          <ol className="mt-3 space-y-3">
            {CREDENTIAL_SENTENCES.map((sentence, index) => (
              <li key={sentence} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7367F0]/12 text-xs font-bold text-[#7367F0]">
                  {index + 1}
                </span>
                <p className="min-w-0 break-words text-sm leading-relaxed text-foreground sm:text-[0.9375rem]">
                  {sentence}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div ref={stageRef} className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <button
          type="button"
          onClick={backToGuide}
          className="inline-flex h-11 items-center gap-2 self-start text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to guide
        </button>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {recording
            ? "Read the white text on the video. Look at the camera."
            : "Center yourself, then start recording."}
        </p>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-zinc-950 shadow-[0_18px_50px_rgba(115,103,240,0.18)] ring-1 ring-[#7367F0]/25",
          recording && "ring-2 ring-rose-500",
        )}
      >
        <video
          ref={videoRef}
          className="h-[min(62svh,28rem)] w-full object-cover sm:h-auto sm:aspect-video sm:max-h-none"
          muted
          playsInline
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/70" />

        <div className="absolute left-2 right-2 top-2 flex flex-wrap items-center justify-between gap-2 sm:left-3 sm:right-3 sm:top-3">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <LiveChip ok={faceOk} icon={ScanFace} label="Face" />
            <LiveChip ok={audioOk} icon={Mic} label="Voice" />
          </div>
          {recording ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              <span>
                Rec · {promptIndex + 1}/{CREDENTIAL_SENTENCES.length}
              </span>
            </span>
          ) : null}
        </div>

        {recording ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-20 px-3 sm:bottom-28 sm:px-10 lg:px-16">
            <p
              className="text-center text-[0.95rem] font-semibold leading-snug text-white sm:text-2xl lg:text-[1.75rem] lg:leading-snug"
              style={{ textShadow: "0 2px 18px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)" }}
            >
              {activeLine}
            </p>
            {upcomingLine ? (
              <p
                className="mt-2 hidden text-center text-sm leading-relaxed text-white/55 sm:mt-3 sm:block sm:text-base"
                style={{ textShadow: "0 1px 10px rgba(0,0,0,0.85)" }}
              >
                Next: {upcomingLine}
              </p>
            ) : (
              <p
                className="mt-2 text-center text-xs text-white/55 sm:mt-3 sm:text-sm"
                style={{ textShadow: "0 1px 10px rgba(0,0,0,0.85)" }}
              >
                Last line — keep speaking until 15s.
              </p>
            )}
          </div>
        ) : null}

        {!recording && cameraReady && !blob ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
            <Button
              type="button"
              className={cn(
                appPrimaryButton,
                "h-12 w-full max-w-[17rem] px-5 text-sm shadow-[0_12px_40px_rgba(115,103,240,0.45)] sm:h-14 sm:px-8 sm:text-base",
              )}
              onClick={startRecording}
              disabled={busy}
            >
              <Video className="h-5 w-5" />
              Start recording
            </Button>
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-3 pt-10 sm:px-4 sm:pb-4 sm:pt-12">
          <div className="flex flex-wrap items-end justify-between gap-2 text-white sm:gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
                Good seconds
              </p>
              <p className="text-lg font-bold tabular-nums sm:text-xl">
                {goodSeconds}
                <span className="text-sm font-medium text-white/70"> / 15</span>
              </p>
            </div>
            {recording ? (
              <p className="shrink-0 text-xs text-white/70">
                Clock {(wallMs / 1000).toFixed(1)}s
              </p>
            ) : null}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7367F0] to-sky-400 transition-[width] duration-200"
              style={{ width: `${goodPct}%` }}
            />
          </div>
        </div>

        {!cameraReady && !error ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/80 px-4 text-center text-sm text-white/80">
            Asking for camera and microphone…
          </div>
        ) : null}
      </div>

      {institutionId ? (
        <div>
          <input
            ref={idInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => setIdFile(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => idInputRef.current?.click()}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-dashed border-[#7367F0]/35 bg-[#7367F0]/[0.04] px-4 py-3 text-left transition-colors hover:border-[#7367F0]/60 hover:bg-[#7367F0]/[0.07]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">
                {idFile ? idFile.name : "Add institute ID photo"}
              </span>
              <span className="block text-xs text-muted-foreground">
                Required for institute verification
              </span>
            </span>
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      {blob && uploadEnabled ? (
        <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
          Clip looks clear — you can upload.
        </p>
      ) : null}
      {blob && !uploadEnabled ? (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          {institutionId && !idFile
            ? "Attach a photo of your institute ID card, then upload."
            : "Need 15 good seconds of face and voice. Use Retake."}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full sm:w-auto"
          onClick={retake}
          disabled={busy || recording}
        >
          <RefreshCw className="h-4 w-4" />
          Retake
        </Button>
        <Button
          type="button"
          className={cn(
            "h-11 w-full sm:flex-1",
            uploadEnabled ? appPrimaryButton : "",
          )}
          onClick={() => void upload()}
          disabled={!uploadEnabled || busy}
        >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {busy ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </div>
  );
}

function LiveChip({
  ok,
  icon: Icon,
  label,
}: Readonly<{
  ok: boolean;
  icon: typeof ScanFace;
  label: string;
}>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md",
        ok
          ? "bg-emerald-500/90 text-white"
          : "bg-black/55 text-white/80 ring-1 ring-white/15",
      )}
    >
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}
