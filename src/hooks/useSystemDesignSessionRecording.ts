"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  combineScreenAndMicForRecording,
  pickRecorderMimeType,
} from "@/lib/codingSessionRecording";
import { systemDesignApi } from "@/lib/api";

/**
 * Camera + mic + screen composite recording for system design sessions (same pattern as coding interview).
 */
export function useSystemDesignSessionRecording(sessionId: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

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

  const uploadRecording = useCallback(async () => {
    if (recordedChunksRef.current.length === 0) return;
    const totalSize = recordedChunksRef.current.reduce((s, c) => s + c.size, 0);
    if (totalSize < 100 * 1024) {
      console.warn("[SystemDesign] Recording too small, skip upload");
      recordedChunksRef.current = [];
      return;
    }
    const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
    const { uploadUrl, s3Key } =
      await systemDesignApi.getRecordingUploadUrl(sessionId);
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": "video/webm" },
    });
    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} ${text}`);
    }
    await systemDesignApi.saveRecordingKey(sessionId, s3Key);
    recordedChunksRef.current = [];
  }, [sessionId]);

  const stopMediaRecorderAndUpload = useCallback(async () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") {
      await uploadRecording().catch((e) =>
        console.warn("[SystemDesign] upload after stop:", e),
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
      await uploadRecording();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
      throw e;
    }
  }, [uploadRecording]);

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

  const attachScreenAndBeginRecording = useCallback(
    async (screen: MediaStream) => {
      screenStreamRef.current = screen;
      try {
        await systemDesignApi.startRecordingPhase(sessionId);
        await beginScreenRecording(screen);
      } catch (e) {
        screen.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
        throw e;
      }
    },
    [beginScreenRecording, sessionId],
  );

  return {
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
  };
}
