/**
 * Gated debug logging for resume pagination / preview issues.
 * Enable in the browser: localStorage.setItem('DEBUG_RESUME_PAGINATION', '1')
 * Or set NEXT_PUBLIC_DEBUG_RESUME_PAGINATION=1 at build time.
 */

export function isResumePaginationDebugEnabled(): boolean {
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_DEBUG_RESUME_PAGINATION === "1"
  ) {
    return true;
  }
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage?.getItem("DEBUG_RESUME_PAGINATION") === "1";
  } catch {
    return false;
  }
}

export function debugResumePagination(
  phase: string,
  payload?: Record<string, unknown>,
): void {
  if (!isResumePaginationDebugEnabled()) return;
  if (payload !== undefined) {
    console.log(`[resume-pagination] ${phase}`, payload);
  } else {
    console.log(`[resume-pagination] ${phase}`);
  }
}
