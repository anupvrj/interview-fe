"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/** Pin to the installed package so WASM URLs stay in sync with the JS bundle. */
const MEDIAPIPE_TASKS_VISION_VERSION = "0.10.34";

const VISION_WASM_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VISION_VERSION}/wasm`;

const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

/** Largest face must cover at least this fraction of the video frame (intrinsic pixels). */
const MIN_FACE_AREA_RATIO = 0.055;

/** How long a condition must hold before we show or clear a warning (reduces flicker). */
const STABLE_MS = 500;

export type InterviewFaceWarningId = "no_face" | "multiple_faces" | "face_too_far";

export const INTERVIEW_FACE_WARNING_COPY: Record<
  InterviewFaceWarningId,
  string
> = {
  no_face:
    "We cannot see your face clearly. Please stay centered in the camera.",
  multiple_faces:
    "Multiple faces detected. Please be alone in frame for a fair interview.",
  face_too_far:
    "Move a bit closer so your face fills more of the frame.",
};

type InstantIssue = "ok" | InterviewFaceWarningId;

function classifyFrame(
  detectionCount: number,
  videoWidth: number,
  videoHeight: number,
  boxWidth: number,
  boxHeight: number,
): InstantIssue {
  if (detectionCount > 1) return "multiple_faces";
  if (detectionCount === 0) return "no_face";
  const frameArea = videoWidth * videoHeight;
  if (frameArea <= 0) return "no_face";
  const faceArea = boxWidth * boxHeight;
  if (faceArea <= 0) return "no_face";
  if (faceArea / frameArea < MIN_FACE_AREA_RATIO) return "face_too_far";
  return "ok";
}

export interface UseInterviewFaceDetectionOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Typically: active interview, camera on, and video playing. */
  enabled: boolean;
}

export interface UseInterviewFaceDetectionResult {
  /** Stable warning after hysteresis; null when framing looks acceptable. */
  warning: InterviewFaceWarningId | null;
  /** True once the detector has loaded and is running (or failed silently). */
  isDetectorReady: boolean;
  /** Initialization failed — checks are skipped; no false warnings. */
  detectorFailed: boolean;
}

/**
 * Runs MediaPipe Face Detector on the live interview camera feed and surfaces
 * gentle proctoring-style hints (no face, multiple faces, face too small).
 */
export function useInterviewFaceDetection(
  options: UseInterviewFaceDetectionOptions,
): UseInterviewFaceDetectionResult {
  const { videoRef, enabled } = options;
  const [warning, setWarning] = useState<InterviewFaceWarningId | null>(null);
  const [isDetectorReady, setIsDetectorReady] = useState(false);
  const [detectorFailed, setDetectorFailed] = useState(false);

  const stableIssueRef = useRef<InstantIssue>("ok");
  const stableSinceRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  useEffect(() => {
    if (!enabled) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastVideoTimeRef.current = -1;
      stableIssueRef.current = "ok";
      stableSinceRef.current = null;
      setWarning(null);
      return;
    }

    let cancelled = false;
    let faceDetector: import("@mediapipe/tasks-vision").FaceDetector | null =
      null;

    const applyStableIssue = (instant: InstantIssue, now: number) => {
      if (instant !== stableIssueRef.current) {
        stableIssueRef.current = instant;
        stableSinceRef.current = now;
        return;
      }
      if (stableSinceRef.current == null) {
        stableSinceRef.current = now;
        return;
      }
      if (now - stableSinceRef.current < STABLE_MS) return;

      if (instant === "ok") {
        setWarning(null);
      } else {
        setWarning(instant);
      }
    };

    const loop = () => {
      if (cancelled) return;

      const video = videoRef.current;
      if (
        !video ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !faceDetector
      ) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const t = video.currentTime;
      if (t === lastVideoTimeRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      lastVideoTimeRef.current = t;

      try {
        const result = faceDetector.detectForVideo(video, performance.now());
        const n = result.detections.length;
        let instant: InstantIssue = "ok";
        if (n > 0) {
          const box = result.detections[0].boundingBox;
          if (!box) {
            instant = "no_face";
          } else {
            instant = classifyFrame(
              n,
              video.videoWidth,
              video.videoHeight,
              box.width,
              box.height,
            );
          }
        } else {
          instant = "no_face";
        }
        applyStableIssue(instant, performance.now());
      } catch {
        applyStableIssue("ok", performance.now());
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    const start = async () => {
      try {
        const { FaceDetector, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );
        if (cancelled) return;

        const wasm = await FilesetResolver.forVisionTasks(VISION_WASM_ROOT);
        if (cancelled) return;

        faceDetector = await FaceDetector.createFromOptions(wasm, {
          baseOptions: {
            modelAssetPath: FACE_MODEL_URL,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
          minSuppressionThreshold: 0.3,
        });

        if (cancelled) {
          faceDetector.close();
          return;
        }

        setIsDetectorReady(true);
        setDetectorFailed(false);
        rafRef.current = requestAnimationFrame(loop);
      } catch (e) {
        console.warn("Interview face detection unavailable:", e);
        if (!cancelled) {
          setDetectorFailed(true);
          setIsDetectorReady(true);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastVideoTimeRef.current = -1;
      stableIssueRef.current = "ok";
      stableSinceRef.current = null;
      setWarning(null);
      if (faceDetector) {
        try {
          faceDetector.close();
        } catch {
          /* ignore */
        }
        faceDetector = null;
      }
      setIsDetectorReady(false);
      setDetectorFailed(false);
    };
  }, [enabled]);

  return { warning, isDetectorReady, detectorFailed };
}
