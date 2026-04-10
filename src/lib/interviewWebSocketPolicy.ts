/**
 * Browser WebSocket close codes treated as non-blocking during an active interview.
 * Proxies (Railway, CDNs) often drop with 1006;1001/1005 are common clean-ish closes.
 * User can still use "Resume" — avoid the blocking "Connection Lost" dialog for these.
 */
export const BENIGN_ACTIVE_INTERVIEW_WS_CLOSE_CODES: ReadonlySet<number> =
  new Set([1000, 1001, 1005, 1006]);
