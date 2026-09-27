"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { biometricApi } from "@/lib/biometric/api";
import type { IntegritySessionKind } from "@/lib/integrity/types";

const MAX_CLIPS = 5;
const CLIP_MS = 3000;

export function useBiometricSnapshots(opts: {
  enabled: boolean;
  kind: IntegritySessionKind;
  sessionId: string;
  stream: MediaStream | null;
  aiSpeakingRef?: MutableRefObject<boolean>;
  micMutedRef?: MutableRefObject<boolean>;
}) {
  const countRef = useRef(0);
  const recordingRef = useRef(false);

  useEffect(() => {
    if (!opts.enabled || !opts.stream || !opts.sessionId) return;
    const stream = opts.stream;
    let cancelled = false;
    const timer = window.setInterval(() => {
      if (cancelled || recordingRef.current) return;
      if (opts.aiSpeakingRef?.current || opts.micMutedRef?.current) return;
      if (countRef.current >= MAX_CLIPS) return;
      try {
        const liveVideo = stream
          .getVideoTracks()
          .filter((track) => track.readyState === "live");
        if (liveVideo.length === 0) return;
        const clipStream = new MediaStream(liveVideo);
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
          : MediaRecorder.isTypeSupported("video/webm")
            ? "video/webm"
            : "";
        const recorder = mimeType
          ? new MediaRecorder(clipStream, { mimeType })
          : new MediaRecorder(clipStream);
        const chunks: Blob[] = [];
        recordingRef.current = true;
        recorder.onerror = () => {
          recordingRef.current = false;
        };
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onstop = () => {
          recordingRef.current = false;
          const blob = new Blob(chunks, { type: "video/webm" });
          if (blob.size < 8_000) return;
          countRef.current += 1;
          void (async () => {
            try {
              const { uploadUrl, s3Key } = await biometricApi.presign({
                purpose: "snapshot",
                contentType: "video/webm",
                sessionKind: opts.kind,
                sessionId: opts.sessionId,
              });
              const put = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": "video/webm" },
                body: blob,
              });
              if (!put.ok) return;
              await biometricApi.registerSnapshot({
                sessionKind: opts.kind,
                sessionId: opts.sessionId,
                s3Key,
              });
            } catch {
              countRef.current = Math.max(0, countRef.current - 1);
            }
          })();
        };
        recorder.start();
        window.setTimeout(() => {
          try {
            if (recorder.state === "recording") recorder.stop();
          } catch {
            recordingRef.current = false;
          }
        }, CLIP_MS);
      } catch {
        recordingRef.current = false;
      }
    }, 12_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    opts.enabled,
    opts.kind,
    opts.sessionId,
    opts.stream,
    opts.aiSpeakingRef,
    opts.micMutedRef,
  ]);
}
