import { WebSocketVoiceTransport } from "./WebSocketVoiceTransport";
import type {
  VoiceTransport,
  VoiceTransportMessageHandler,
} from "./types";

export function createVoiceTransport(
  onMessage: VoiceTransportMessageHandler,
): VoiceTransport {
  return new WebSocketVoiceTransport(onMessage);
}
