"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  enrollVoiceprint,
  requestVoiceprintChallenge,
} from "@/lib/integrity/IntegrityTelemetryClient";
import {
  VOICEPRINT_ENROLL_MS,
  VOICEPRINT_RMS_MIN,
  recordWavFromStream,
} from "@/lib/integrity/wavCapture";
import type { IntegritySessionKind } from "@/lib/integrity/types";

export function VoiceprintGate({
  open,
  kind,
  sessionId,
  stream,
  onEnrolled,
  onCancel,
}: Readonly<{
  open: boolean;
  kind: IntegritySessionKind;
  sessionId: string;
  stream: MediaStream | null;
  onEnrolled: () => void;
  onCancel?: () => void;
}>) {
  const [phrase, setPhrase] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!open || !sessionId) return;
    let cancelled = false;
    setError(null);
    setLoading(true);
    requestVoiceprintChallenge(kind, sessionId)
      .then((data) => {
        if (cancelled) return;
        setPhrase(data.phrase);
        setChallengeId(data.challengeId);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not start voice enrollment");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, kind, sessionId]);

  const recordAndEnroll = async () => {
    if (!stream || !challengeId || recording) return;
    setError(null);
    setRecording(true);
    setSecondsLeft(Math.round(VOICEPRINT_ENROLL_MS / 1000));
    const tick = window.setInterval(() => {
      setSecondsLeft((n) => Math.max(0, n - 1));
    }, 1000);
    try {
      const clip = await recordWavFromStream(stream, VOICEPRINT_ENROLL_MS, setLevel);
      if (clip.rms < VOICEPRINT_RMS_MIN) {
        throw new Error("We could not hear a clear voice. Move closer and try again.");
      }
      setLoading(true);
      await enrollVoiceprint(kind, sessionId, {
        challengeId,
        audioWavBase64: clip.base64,
      });
      onEnrolled();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Voice enrollment failed");
    } finally {
      window.clearInterval(tick);
      setRecording(false);
      setLoading(false);
      setSecondsLeft(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel?.()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm it is your voice</DialogTitle>
          <DialogDescription>
            Read the sentence on screen. The interviewer will not speak it, so a
            nearby device listening to the speakers cannot hear it. We enroll
            Microsoft WavLM on the server and match later answers to this clip.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="rounded-lg border bg-muted/50 px-4 py-3 text-base font-medium leading-relaxed">
            {loading && !phrase ? "Loading phrase…" : phrase}
          </p>
          {recording ? (
            <p className="text-sm text-muted-foreground">
              Speak now · {secondsLeft}s · mic {Math.min(100, Math.round(level * 400))}%
            </p>
          ) : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
        <DialogFooter>
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={recording}>
              Cancel
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => void recordAndEnroll()}
            disabled={!stream || !challengeId || recording || loading}
          >
            {recording || loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {recording ? "Recording…" : "Checking voice…"}
              </>
            ) : (
              "Read sentence aloud"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
