import { BENIGN_ACTIVE_INTERVIEW_WS_CLOSE_CODES } from "@/lib/interviewWebSocketPolicy";

/** How many times to try the socket again before ending the interview. */
export const RECONNECT_MAX_ATTEMPTS = 5;
/** Wait this long before each of those tries. */
export const RECONNECT_ATTEMPT_DELAY_MS = 10_000;
export const CLIENT_HEARTBEAT_MS = 5_000;
/** No message from the server for this long means the connection is dead even if the socket looks open. */
export const SERVER_SILENCE_TIMEOUT_MS = 20_000;
/** Our own close code for a connection we gave up on; treated like a network drop. */
export const CLIENT_DEAD_SOCKET_CLOSE_CODE = 4000;
/** Clear a stuck "AI speaking" state this long after its last audio should have finished. */
export const AI_PLAYBACK_STUCK_MS = 8_000;
/** After time is up, wait at most this long for the AI's farewell before ending anyway. */
export const TIME_UP_GRACE_MS = 20_000;
export const COMPLETE_RETRY_DELAYS_MS = [2_000, 5_000, 10_000];
/** Give up on a WebSocket that never finishes opening. */
export const CONNECT_OPEN_TIMEOUT_MS = 15_000;

/** Every attempt waits the same ten seconds. */
export function reconnectDelayMs(_attempt: number): number {
  return RECONNECT_ATTEMPT_DELAY_MS;
}

/** Stop once five online attempts have already run. */
export function shouldStopReconnect(attemptsSoFar: number): boolean {
  return attemptsSoFar >= RECONNECT_MAX_ATTEMPTS;
}

export function isServerSilent(lastMessageAt: number, now: number): boolean {
  return now - lastMessageAt > SERVER_SILENCE_TIMEOUT_MS;
}

/** Network drops, proxy closes, and our own dead-socket close should reconnect. A server error should not. */
export function isRetryableInterviewClose(code: number): boolean {
  return (
    BENIGN_ACTIVE_INTERVIEW_WS_CLOSE_CODES.has(code) ||
    code === 0 ||
    code === CLIENT_DEAD_SOCKET_CLOSE_CODE
  );
}

export function isAiPlaybackStuck(audioQueuedUntil: number, now: number): boolean {
  return now >= audioQueuedUntil + AI_PLAYBACK_STUCK_MS;
}

export interface SavedInterviewTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/** What a reload should put back on screen. Empty transcript and a missing clock stay empty. */
export function savedInterviewProgress(data: {
  realtimeTranscript?: Array<{ role?: string; content?: string; timestamp?: string }>;
  session?: { activeElapsedSec?: number };
}): { transcript: SavedInterviewTurn[]; lastAssistant: string | null; elapsedSec: number | null } {
  const transcript: SavedInterviewTurn[] = [];
  for (const turn of data.realtimeTranscript ?? []) {
    const content = turn.content?.trim();
    if ((turn.role === "user" || turn.role === "assistant") && content) {
      transcript.push({
        role: turn.role,
        content,
        timestamp: new Date(turn.timestamp ?? Date.now()),
      });
    }
  }
  const lastAssistant = [...transcript].reverse().find((turn) => turn.role === "assistant");
  const activeSec = data.session?.activeElapsedSec;
  return {
    transcript,
    lastAssistant: lastAssistant?.content ?? null,
    elapsedSec: typeof activeSec === "number" && activeSec > 0 ? activeSec : null,
  };
}
