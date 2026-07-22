/**
 * Build a single MediaStream for coding-session recording: screen video + mixed audio * (tab/system audio from screen capture if present + microphone).
 */
export function supportsDisplayMediaCapture(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getDisplayMedia === "function"
  );
}

export function pickRecorderMimeType(): string {
  const preferred = "video/webm;codecs=vp8,opus";
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(preferred)) {
    return preferred;
  }
  for (const alt of ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"]) {
    if (MediaRecorder.isTypeSupported(alt)) return alt;
  }
  return "video/webm";
}

export function combineScreenAndMicForRecording(
  screenStream: MediaStream,
  micMediaStream: MediaStream | null,
): MediaStream {
  const videoTrack = screenStream.getVideoTracks()[0];
  if (!videoTrack) {
    throw new Error("No screen video track");
  }

  const audioTracks: MediaStreamTrack[] = [];
  for (const t of screenStream.getAudioTracks()) {
    audioTracks.push(t);
  }
  if (micMediaStream) {
    for (const t of micMediaStream.getAudioTracks()) {
      if (t.readyState === "live") {
        audioTracks.push(t);
      }
    }
  }

  let finalAudioTrack: MediaStreamTrack | null = null;
  if (audioTracks.length > 1) {
    try {
      const MixCtx = globalThis.AudioContext || (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const mixAudioContext = new MixCtx();
      const mixedDestination = mixAudioContext.createMediaStreamDestination();
      audioTracks.forEach((track) => {
        try {
          const trackStream = new MediaStream([track]);
          const source = mixAudioContext.createMediaStreamSource(trackStream);
          source.connect(mixedDestination);
        } catch {
          /* ignore single track failure */
        }
      });
      const mixed = mixedDestination.stream.getAudioTracks();
      if (mixed.length > 0) {
        finalAudioTrack = mixed[0];
      }
    } catch (e) {
      console.warn("codingSessionRecording: audio mix failed", e);
    }
  } else if (audioTracks.length === 1) {
    finalAudioTrack = audioTracks[0];
  }

  const combined = new MediaStream();
  combined.addTrack(videoTrack);
  if (finalAudioTrack) {
    combined.addTrack(finalAudioTrack);
  }

  return combined;
}
