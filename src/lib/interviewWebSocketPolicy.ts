/**
 * Browser WebSocket close codes treated as non-blocking during an active interview.
 * Proxies (Railway, CDNs) often drop with 1006; 1001/1005 are common clean-ish closes.
 * 1011 (server internal error) can result from a Fastify unhandled exception or a
 * Railway process restart — the session is still recoverable via reconnect.
 * For all these codes: auto-reconnect silently; only escalate to the blocking
 * "Connection Lost" dialog if the reconnect itself also fails.
 */
export const BENIGN_ACTIVE_INTERVIEW_WS_CLOSE_CODES: ReadonlySet<number> =
  new Set([1000, 1001, 1005, 1006, 1007, 1011]);
