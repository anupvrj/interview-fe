import { afterEach, describe, expect, it, vi } from "vitest";
import { WebSocketVoiceTransport } from "../WebSocketVoiceTransport";

class FakeSocket {
  static latest: FakeSocket | null = null;
  static OPEN = 1;
  url: string;
  readyState = 0;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  closed = false;

  constructor(url: string) {
    this.url = url;
    FakeSocket.latest = this;
  }

  send(_data: string) {}

  close() {
    this.closed = true;
    this.readyState = 3;
    this.onclose?.();
  }

  open() {
    this.readyState = 1;
    this.onopen?.();
  }
}

describe("WebSocketVoiceTransport", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    FakeSocket.latest = null;
  });

  it("resolves once the socket opens and delivers messages", async () => {
    vi.stubGlobal("WebSocket", FakeSocket);
    const messages: Array<Record<string, unknown>> = [];
    const transport = new WebSocketVoiceTransport((data) => messages.push(data));
    const pending = transport.connectControl({ controlUrl: "ws://interview.example/socket" });
    FakeSocket.latest!.open();
    const ws = await pending;
    expect(ws).toBe(FakeSocket.latest);
    FakeSocket.latest!.onmessage?.({ data: JSON.stringify({ type: "connected" }) });
    expect(messages).toEqual([{ type: "connected" }]);
    expect(transport.isControlOpen()).toBe(true);
  });

  it("rejects and closes a socket that never opens", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", FakeSocket);
    const transport = new WebSocketVoiceTransport(() => undefined);
    const pending = transport.connectControl({
      controlUrl: "ws://interview.example/socket",
      openTimeoutMs: 50,
    });
    const rejected = expect(pending).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(50);
    await rejected;
    expect(FakeSocket.latest!.closed).toBe(true);
  });

  it("a late open after the timeout does not resolve the attempt", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", FakeSocket);
    const transport = new WebSocketVoiceTransport(() => undefined);
    const pending = transport.connectControl({
      controlUrl: "ws://interview.example/socket",
      openTimeoutMs: 50,
    });
    pending.catch(() => undefined);
    await vi.advanceTimersByTimeAsync(50);
    expect(() => FakeSocket.latest!.open()).not.toThrow();
    await expect(pending).rejects.toThrow(/timed out/);
  });
});
