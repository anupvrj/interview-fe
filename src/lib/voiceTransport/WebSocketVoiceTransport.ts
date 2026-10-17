import { CONNECT_OPEN_TIMEOUT_MS } from "@/lib/interviewReconnect";
import type {
  VoiceTransport,
  VoiceTransportConnectOptions,
  VoiceTransportMessageHandler,
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
      let settled = false;
      const fail = (message: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(openTimer);
        reject(new Error(message));
      };
      // A slow or lossy network can leave the handshake pending indefinitely.
      const openTimer = setTimeout(() => {
        fail("WebSocket connection timed out");
        try {
          ws.close();
        } catch {
          /* never opened */
        }
      }, options.openTimeoutMs ?? CONNECT_OPEN_TIMEOUT_MS);
      ws.onopen = () => {
        if (settled) return;
        settled = true;
        clearTimeout(openTimer);
        resolve(ws);
      };
      ws.onerror = () => fail("WebSocket connection failed");
      ws.onclose = () => fail("WebSocket closed before opening");
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
