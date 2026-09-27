"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { postIntegrityEvidence } from "@/lib/integrity/IntegrityTelemetryClient";
import {
  FACE_SAMPLE_MS,
  FACE_ABSENT_EMIT_MS,
  MOUTH_OPEN_MIN,
  SPEECH_MOUTH_SAMPLE_MS,
  SPEECH_RMS_MIN,
  SPEECH_WITHOUT_MOUTH_DEDUP_MS,
  absenceSeverity,
  countValidFaces,
  shouldEmitAbsence,
  shouldEmitMultipleFaces,
  shouldFlagSpeechWithoutMouth,
  type FaceHit,
} from "@/lib/integrity/facePresencePolicy";
import { computeAnalyserRms } from "@/lib/integrity/vadGate";
import type {
  IntegrityEvent,
  IntegritySessionKind,
} from "@/lib/integrity/types";

type FaceDetectorHandle = {
  detect: (source: HTMLCanvasElement) => Promise<FaceHit[]>;
  close?: () => void;
};

function boxAreaRatio(
  box: { width?: number; height?: number } | undefined,
  canvas: HTMLCanvasElement,
): number {
  const area = canvas.width * canvas.height;
  if (!box || area <= 0) return 0;
  return ((box.width ?? 0) * (box.height ?? 0)) / area;
}

function grabFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): HTMLCanvasElement | null {
  if (video.readyState < 2 || video.videoWidth < 16 || video.videoHeight < 16) {
    return null;
  }
  const w = 320;
  const h = Math.max(180, Math.round((video.videoHeight / video.videoWidth) * w));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, w, h);
  return canvas;
}

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
      detect: async (canvas) => {
        const result = detector.detect(canvas);
        return (result.detections ?? []).map((detection) => ({
          score: detection.categories?.[0]?.score ?? 0,
          areaRatio: boxAreaRatio(detection.boundingBox, canvas),
        }));
      },
      close: () => detector.close(),
    };
  } catch {
    /* fall through to native FaceDetector */
  }

  const Native = (
    globalThis as unknown as {
      FaceDetector?: new (opts?: { maxDetectedFaces?: number }) => {
        detect: (src: ImageBitmapSource) => Promise<
          Array<{ boundingBox?: { width?: number; height?: number } }>
        >;
      };
    }
  ).FaceDetector;
  if (typeof Native === "function") {
    try {
      const detector = new Native({ maxDetectedFaces: 5 });
      return {
        detect: async (canvas) => {
          const faces = await detector.detect(canvas);
          return faces.map((face) => ({
            score: 1,
            areaRatio: boxAreaRatio(face.boundingBox, canvas),
          }));
        },
      };
    } catch {
      return null;
    }
  }
  return null;
}

type MouthLandmarkerHandle = {
  mouthOpen: (source: HTMLCanvasElement) => Promise<number | null>;
  close?: () => void;
};

function mouthOpenFromBlendshapes(
  categories: Array<{ categoryName?: string; score?: number }> | undefined,
): number | null {
  if (!categories?.length) return null;
  const jaw = categories.find((c) => c.categoryName === "jawOpen");
  return typeof jaw?.score === "number" ? jaw.score : null;
}

async function createLandmarker(): Promise<MouthLandmarkerHandle | null> {
  try {
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
    );
    const landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      runningMode: "IMAGE",
      numFaces: 1,
      outputFaceBlendshapes: true,
    });
    return {
      mouthOpen: async (canvas) => {
        const result = landmarker.detect(canvas);
        return mouthOpenFromBlendshapes(result.faceBlendshapes?.[0]?.categories);
      },
      close: () => landmarker.close(),
    };
  } catch {
    return null;
  }
}

function attachMicAnalyser(video: HTMLVideoElement): {
  analyser: AnalyserNode;
  ctx: AudioContext;
} | null {
  const stream = video.srcObject;
  if (!(stream instanceof MediaStream)) return null;
  const tracks = stream.getAudioTracks().filter((t) => t.readyState === "live");
  if (tracks.length === 0) return null;
  try {
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(new MediaStream(tracks));
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    void ctx.resume().catch(() => {});
    return { analyser, ctx };
  } catch {
    return null;
  }
}

function snapshotCanvas(canvas: HTMLCanvasElement): string | null {
  try {
    let quality = 0.6;
    let data = canvas.toDataURL("image/jpeg", quality);
    while (data.length > 40 * 1024 && quality > 0.25) {
      quality -= 0.1;
      data = canvas.toDataURL("image/jpeg", quality);
    }
    return data.length <= 40 * 1024 ? data : null;
  } catch {
    return null;
  }
}

export function useFacePresence(opts: {
  enabled: boolean;
  videoEl: HTMLVideoElement | null;
  kind: IntegritySessionKind;
  sessionId: string;
  onEvent: (event: IntegrityEvent) => void;
  aiSpeakingRef?: MutableRefObject<boolean>;
  micMutedRef?: MutableRefObject<boolean>;
  emitFace?: boolean;
  emitCamera?: boolean;
  emitSpeech?: boolean;
}) {
  const onEventRef = useRef(opts.onEvent);
  onEventRef.current = opts.onEvent;
  const emitFace = opts.emitFace !== false;
  const emitCamera = opts.emitCamera !== false;
  const emitSpeech = opts.emitSpeech !== false;
  const absentSinceRef = useRef<number | null>(null);
  const absentEmittedRef = useRef(false);
  const lastMultiAtRef = useRef(0);
  const multiSinceRef = useRef<number | null>(null);
  const cameraFlaggedRef = useRef(false);
  const closedMouthSpeechSinceRef = useRef<number | null>(null);
  const lastSpeechMouthAtRef = useRef(0);
  const aiSpeakingRef = opts.aiSpeakingRef;
  const micMutedRef = opts.micMutedRef;

  useEffect(() => {
    if (!opts.enabled || !opts.videoEl || !opts.sessionId) return;
    const video = opts.videoEl;
    const frameCanvas = document.createElement("canvas");
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let detector: FaceDetectorHandle | null = null;
    let landmarker: MouthLandmarkerHandle | null = null;
    let micGraph: { analyser: AnalyserNode; ctx: AudioContext } | null = null;
    const rmsBuf = { current: new Uint8Array(0) };

    const emit = (event: IntegrityEvent) => {
      if (cancelled) return;
      if (
        (event.type === "CAMERA_UNAVAILABLE" && !emitCamera) ||
        ((event.type === "CANDIDATE_ABSENT" ||
          event.type === "MULTIPLE_FACES_DETECTED") &&
          !emitFace) ||
        (event.type === "SPEECH_WITHOUT_MOUTH_MOVEMENT" && !emitSpeech)
      ) {
        return;
      }
      onEventRef.current(event);
    };

    const flushAbsence = () => {
      const started = absentSinceRef.current;
      if (started == null || absentEmittedRef.current) return;
      const absentMs = Date.now() - started;
      if (absentMs < FACE_ABSENT_EMIT_MS) return;
      absentEmittedRef.current = true;
      onEventRef.current({
        type: "CANDIDATE_ABSENT",
        absentMs,
        timestamp: Date.now(),
        severity: absenceSeverity(absentMs),
      });
    };

    const sample = async () => {
      if (cancelled) return;
      const tracks =
        video.srcObject instanceof MediaStream
          ? video.srcObject.getVideoTracks()
          : [];
      const live = tracks.some((t) => t.readyState === "live" && t.enabled);
      if (!live) {
        if (!cameraFlaggedRef.current && tracks.length > 0) {
          cameraFlaggedRef.current = true;
          emit({
            type: "CAMERA_UNAVAILABLE",
            reason: "track_ended",
            timestamp: Date.now(),
            severity: "LOW",
          });
        }
        schedule();
        return;
      }
      cameraFlaggedRef.current = false;
      if (!detector) {
        schedule();
        return;
      }
      const frame = grabFrame(video, frameCanvas);
      if (!frame) {
        schedule();
        return;
      }
      let count = 0;
      try {
        count = countValidFaces(await detector.detect(frame));
      } catch {
        schedule();
        return;
      }

      const now = Date.now();
      if (count === 0) {
        if (absentSinceRef.current == null) absentSinceRef.current = now;
        const absentMs = now - absentSinceRef.current;
        if (absentMs > 15_000 && !absentEmittedRef.current) {
          absentEmittedRef.current = true;
          emit({
            type: "CANDIDATE_ABSENT",
            absentMs,
            timestamp: now,
            severity: "HIGH",
          });
        }
      } else {
        if (!absentEmittedRef.current && absentSinceRef.current != null) {
          const absentMs = now - absentSinceRef.current;
          if (shouldEmitAbsence(absentMs, false)) {
            emit({
              type: "CANDIDATE_ABSENT",
              absentMs,
              timestamp: now,
              severity: absenceSeverity(absentMs),
            });
          }
        }
        absentSinceRef.current = null;
        absentEmittedRef.current = false;
      }

      if (count > 1) {
        if (multiSinceRef.current == null) multiSinceRef.current = now;
        if (
          shouldEmitMultipleFaces({
            faceCount: count,
            heldMs: now - multiSinceRef.current,
            sinceLastEmitMs: now - lastMultiAtRef.current,
          })
        ) {
          lastMultiAtRef.current = now;
          emit({
            type: "MULTIPLE_FACES_DETECTED",
            faceCount: count,
            timestamp: now,
            severity: "HIGH",
          });
          const snap = snapshotCanvas(frame);
          if (snap) {
            void postIntegrityEvidence(opts.kind, opts.sessionId, {
              imageBase64: snap,
              mimeType: "image/jpeg",
              type: "MULTIPLE_FACES_DETECTED",
              timestamp: now,
            });
          }
        }
      } else {
        multiSinceRef.current = null;
      }

      if (count === 1 && emitSpeech && landmarker) {
        if (!micGraph) micGraph = attachMicAnalyser(video);
        let mouthOpen: number | null = null;
        try {
          mouthOpen = await landmarker.mouthOpen(frame);
        } catch {
          mouthOpen = null;
        }
        let speechRms = 0;
        if (micGraph) {
          if (rmsBuf.current.length !== micGraph.analyser.fftSize) {
            rmsBuf.current = new Uint8Array(micGraph.analyser.fftSize);
          }
          speechRms = computeAnalyserRms(micGraph.analyser, rmsBuf.current);
        }
        const aiSpeaking = Boolean(aiSpeakingRef?.current);
        const micMuted = Boolean(micMutedRef?.current);
        const speakingClosed =
          !aiSpeaking &&
          !micMuted &&
          mouthOpen != null &&
          mouthOpen < MOUTH_OPEN_MIN &&
          speechRms >= SPEECH_RMS_MIN;
        if (speakingClosed) {
          if (closedMouthSpeechSinceRef.current == null) {
            closedMouthSpeechSinceRef.current = now;
          }
        } else {
          closedMouthSpeechSinceRef.current = null;
        }
        const closedMouthSpeechMs =
          closedMouthSpeechSinceRef.current == null
            ? 0
            : now - closedMouthSpeechSinceRef.current;
        if (
          now - lastSpeechMouthAtRef.current >= SPEECH_WITHOUT_MOUTH_DEDUP_MS &&
          shouldFlagSpeechWithoutMouth({
            aiSpeaking,
            micMuted,
            faceCount: count,
            mouthOpen,
            speechRms,
            closedMouthSpeechMs,
          })
        ) {
          lastSpeechMouthAtRef.current = now;
          closedMouthSpeechSinceRef.current = null;
          emit({
            type: "SPEECH_WITHOUT_MOUTH_MOVEMENT",
            durationMs: closedMouthSpeechMs,
            timestamp: now,
            severity: "HIGH",
          });
          const snap = snapshotCanvas(frame);
          if (snap) {
            void postIntegrityEvidence(opts.kind, opts.sessionId, {
              imageBase64: snap,
              mimeType: "image/jpeg",
              type: "SPEECH_WITHOUT_MOUTH_MOVEMENT",
              timestamp: now,
            });
          }
        }
      } else {
        closedMouthSpeechSinceRef.current = null;
      }

      const candidateTurn =
        count === 1 &&
        Boolean(landmarker) &&
        !aiSpeakingRef?.current &&
        !micMutedRef?.current;
      schedule(candidateTurn);
    };

    const schedule = (fast = false) => {
      if (cancelled) return;
      timer = setTimeout(() => {
        void sample();
      }, fast ? SPEECH_MOUTH_SAMPLE_MS : FACE_SAMPLE_MS);
    };

    void Promise.all([
      createDetector(),
      emitSpeech ? createLandmarker() : Promise.resolve(null),
    ]).then(([handle, mouth]) => {
        if (cancelled) {
          handle?.close?.();
          mouth?.close?.();
          return;
        }
        if (!handle) {
          emit({
            type: "CAMERA_UNAVAILABLE",
            reason: "face_detector_unavailable",
            timestamp: Date.now(),
            severity: "LOW",
          });
          mouth?.close?.();
          return;
        }
        detector = handle;
        landmarker = mouth;
        void sample();
      },
    );

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      detector?.close?.();
      landmarker?.close?.();
      if (micGraph) {
        void micGraph.ctx.close().catch(() => {});
      }
      flushAbsence();
      absentSinceRef.current = null;
      absentEmittedRef.current = false;
      closedMouthSpeechSinceRef.current = null;
      multiSinceRef.current = null;
    };
  }, [
    opts.enabled,
    opts.videoEl,
    opts.kind,
    opts.sessionId,
    emitFace,
    emitCamera,
    emitSpeech,
  ]);
}
