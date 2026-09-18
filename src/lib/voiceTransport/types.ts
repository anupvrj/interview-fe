export type VoiceTransportMessageHandler = (data: Record<string, unknown>) => void;

export interface VoiceTransportConnectOptions {
  /** WebSocket URL for control and audio messages. */
  controlUrl: string;
  interviewId?: string;
  userId?: string;
}

export interface VoiceTransport {
  readonly mode: "websocket";
  connectControl(options: VoiceTransportConnectOptions): Promise<WebSocket>;
  sendControl(payload: Record<string, unknown>): void;
  disconnect(endMessage?: Record<string, unknown>): void;
  isControlOpen(): boolean;
  isAudioActive(): boolean;
}
