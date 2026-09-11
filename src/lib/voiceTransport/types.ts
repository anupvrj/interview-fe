export type VoiceAudioTransportMode = "websocket" | "webrtc";

export type VoiceTransportMessageHandler = (data: Record<string, unknown>) => void;

export interface VoiceTransportConnectOptions {
  /** WebSocket URL for control messages (always used). */
  controlUrl: string;
  interviewId?: string;
  userId?: string;
}

export interface VoiceTransport {
  readonly mode: VoiceAudioTransportMode;
  connectControl(options: VoiceTransportConnectOptions): Promise<WebSocket>;
  /** Connect WebRTC audio path (LiveKit). No-op for websocket-only mode. */
  connectAudio?(options: {
    interviewId: string;
    userId: string;
  }): Promise<void>;
  sendControl(payload: Record<string, unknown>): void;
  /** Toggle LiveKit mic when WebRTC audio is active. No-op for websocket-only mode. */
  setMicrophoneEnabled?(enabled: boolean): void;
  /** Mute LiveKit agent playback on barge-in. No-op for websocket-only mode. */
  stopAgentPlayback?(): void;
  disconnect(endMessage?: Record<string, unknown>): void;
  isControlOpen(): boolean;
  isAudioActive(): boolean;
}

export type WebRtcAudioCallbacks = {
  onAgentTrack?: (element: HTMLAudioElement) => void;
  onAgentSpeaking?: (speaking: boolean) => void;
  onAudioReady?: () => void;
  onError?: (message: string) => void;
};
