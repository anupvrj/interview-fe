import { isLiveKitConfiguredOnClient } from "@/lib/voiceProviders";
import { WebRtcVoiceTransport } from "./WebRtcVoiceTransport";
import { WebSocketVoiceTransport } from "./WebSocketVoiceTransport";
import type {
  VoiceAudioTransportMode,
  VoiceTransport,
  VoiceTransportMessageHandler,
  WebRtcAudioCallbacks,
} from "./types";

export function resolveAudioTransportMode(
  preferred?: VoiceAudioTransportMode,
): VoiceAudioTransportMode {
  if (preferred === "webrtc" && isLiveKitConfiguredOnClient()) {
    return "webrtc";
  }
  return "websocket";
}

export function createVoiceTransport(
  mode: VoiceAudioTransportMode,
  onMessage: VoiceTransportMessageHandler,
  webrtcCallbacks?: WebRtcAudioCallbacks,
): VoiceTransport {
  if (mode === "webrtc") {
    const transport = new WebRtcVoiceTransport(onMessage);
    if (webrtcCallbacks) transport.setAudioCallbacks(webrtcCallbacks);
    return transport;
  }
  return new WebSocketVoiceTransport(onMessage);
}
