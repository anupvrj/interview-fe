import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from "livekit-client";
import { API_URL } from "@/lib/api";
import { WebSocketVoiceTransport } from "./WebSocketVoiceTransport";
import type {
  VoiceTransport,
  VoiceTransportConnectOptions,
  VoiceTransportMessageHandler,
  WebRtcAudioCallbacks,
} from "./types";

type LiveKitTokenResponse = {
  success: boolean;
  data?: {
    token: string;
    url: string;
    roomName: string;
    identity: string;
  };
  message?: string;
};

/**
 * Hybrid transport: WebSocket for control + LiveKit WebRTC for audio.
 */
export class WebRtcVoiceTransport implements VoiceTransport {
  readonly mode = "webrtc" as const;
  private control: WebSocketVoiceTransport;
  private room: Room | null = null;
  private agentAudioEl: HTMLAudioElement | null = null;
  private audioReady = false;
  private audioCallbacks: WebRtcAudioCallbacks = {};

  constructor(onMessage: VoiceTransportMessageHandler) {
    this.control = new WebSocketVoiceTransport(onMessage);
  }

  setAudioCallbacks(callbacks: WebRtcAudioCallbacks): void {
    this.audioCallbacks = callbacks;
  }

  connectControl(options: VoiceTransportConnectOptions): Promise<WebSocket> {
    return this.control.connectControl(options);
  }

  async connectAudio(options: {
    interviewId: string;
    userId: string;
  }): Promise<void> {
    const params = new URLSearchParams({
      interviewId: options.interviewId,
      userId: options.userId,
      role: "candidate",
    });
    const response = await fetch(`${API_URL}/voice/livekit/token?${params}`);
    const payload = (await response.json()) as LiveKitTokenResponse;
    if (!response.ok || !payload.success || !payload.data) {
      throw new Error(payload.message ?? "Failed to obtain LiveKit token");
    }

    const { token, url } = payload.data;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    this.room = room;

    room.on(
      RoomEvent.TrackSubscribed,
      (
        track: RemoteTrack,
        _publication: RemoteTrackPublication,
        participant: RemoteParticipant,
      ) => {
        if (track.kind !== Track.Kind.Audio) return;
        if (!participant.identity.startsWith("agent-")) return;
        const element = track.attach() as HTMLAudioElement;
        element.autoplay = true;
        this.agentAudioEl = element;
        this.audioCallbacks.onAgentTrack?.(element);
      },
    );

    room.on(RoomEvent.Disconnected, () => {
      this.audioReady = false;
    });

    await room.connect(url, token);
    await room.localParticipant.setMicrophoneEnabled(true);
    this.audioReady = true;
    this.audioCallbacks.onAudioReady?.();
    this.control.sendControl({ type: "webrtc_audio_ready" });
  }

  sendControl(payload: Record<string, unknown>): void {
    this.control.sendControl(payload);
  }

  setMicrophoneEnabled(enabled: boolean): void {
    void this.room?.localParticipant.setMicrophoneEnabled(enabled);
  }

  disconnect(endMessage?: Record<string, unknown>): void {
    if (this.agentAudioEl) {
      this.agentAudioEl.pause();
      this.agentAudioEl.srcObject = null;
      this.agentAudioEl = null;
    }
    void this.room?.disconnect();
    this.room = null;
    this.audioReady = false;
    this.control.disconnect(endMessage);
  }

  isControlOpen(): boolean {
    return this.control.isControlOpen();
  }

  isAudioActive(): boolean {
    return this.audioReady;
  }
}
