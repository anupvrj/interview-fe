"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  combineScreenAndMicForRecording,
  pickRecorderMimeType,
} from "@/lib/codingSessionRecording";
import { peerApi } from "@/lib/api";

export function usePeerMeetingRecording(bookingId: string) {
  const screenStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      stopTracks();
    };
  }, []);

  const stopTracks = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    micStreamRef.current = null;
  };

  const uploadRecording = useCallback(async (opts?: { silent?: boolean }): Promise<boolean> => {
    if (recordedChunksRef.current.length === 0) return true;
    const totalSize = recordedChunksRef.current.reduce((s, c) => s + c.size, 0);
    if (totalSize < 100 * 1024) {
      recordedChunksRef.current = [];
      return true;
    }

    const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
    const durationSec = recordingStartedAtRef.current
      ? Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
      : undefined;

    setUploading(true);
    try {
      const { uploadUrl, s3Key } = await peerApi.getRecordingUploadUrl(bookingId);
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "video/webm" },
      });
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed (${uploadResponse.status})`);
      }
      await peerApi.saveRecordingKey(bookingId, { s3Key, durationSec });
      recordedChunksRef.current = [];
      if (!opts?.silent) {
        toast.success("Meeting recording saved");
      }
      return true;
    } catch (err) {
      console.error("[PeerMeeting] upload failed:", err);
      if (!opts?.silent) {
        toast.error("Could not upload meeting recording");
      }
      return false;
    } finally {
      setUploading(false);
    }
  }, [bookingId]);

  const stopRecording = useCallback(async (opts?: { silent?: boolean }): Promise<boolean> => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") {
      setIsRecording(false);
      return uploadRecording(opts);
    }

    await new Promise<void>((resolve) => {
      mr.addEventListener("stop", () => resolve(), { once: true });
      if (mr.state === "recording") mr.requestData();
      setTimeout(() => {
        try {
          mr.stop();
        } catch {
          resolve();
        }
      }, 250);
    });

    mediaRecorderRef.current = null;
    setIsRecording(false);
    stopTracks();
    return uploadRecording(opts);
  }, [uploadRecording]);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast.error("Screen recording is not supported in this browser");
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      screenStreamRef.current = screenStream;

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = micStream;

      const combined = combineScreenAndMicForRecording(screenStream, micStream);
      const mimeType = pickRecorderMimeType();
      const recorder = new MediaRecorder(combined, { mimeType });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        screenStream.getTracks().forEach((t) => t.stop());
      };

      screenStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        void stopRecording();
      });

      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      recorder.start(1000);
      setIsRecording(true);
      await peerApi.markRecordingStarted(bookingId);
      toast.success("Recording started — you can now join Google Meet");
    } catch (err) {
      console.error("[PeerMeeting] start recording:", err);
      stopTracks();
      if (err instanceof Error && err.name === "NotAllowedError") {
        toast.error("Recording was cancelled. Choose a window or entire screen to continue.");
      } else {
        toast.error("Could not start recording. Share your screen or an application window.");
      }
    }
  }, [bookingId, stopRecording]);

  return {
    isRecording,
    uploading,
    startRecording,
    stopRecording,
  };
}
