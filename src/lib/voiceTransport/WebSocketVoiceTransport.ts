import { API_URL } from "@/lib/api";
import type {
  VoiceTransport,
  VoiceTransportConnectOptions,
  VoiceTransportMessageHandler,
  WebRtcAudioCallbacks,
} from "./types";

export class WebSocketVoiceTransport implements VoiceTransport {
  readonly mode = "websocket" as const;
  private ws: WebSocket | null = null;
  private onMessage: VoiceTransportMessageHandler;

  constructor(onMessage: VoiceTransportMessageHandler) {
    this.onMessage = onMessage;
  }

  connectControl(options: VoiceTransportConnectOptions): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(options.controlUrl);
      this.ws = ws;
      ws.onopen = () => resolve(ws);
      ws.onerror = () => reject(new Error("WebSocket connection failed"));
      ws.onmessage = (event) => {
        try {
          this.onMessage(JSON.parse(String(event.data)));
        } catch {
          /* ignore malformed frames */
        }
      };
    });
  }

  sendControl(payload: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  disconnect(endMessage?: Record<string, unknown>): void {
    if (endMessage) this.sendControl(endMessage);
    this.ws?.close();
    this.ws = null;
  }

  isControlOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  isAudioActive(): boolean {
    return this.isControlOpen();
  }
}
