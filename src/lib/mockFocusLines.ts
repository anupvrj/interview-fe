/**
 * A resume line (and its practice questions) carried from the AI Coach to the mock-interview
 * setup, so the interviewer asks about it first. Kept in this tab only.
 */
export type MockFocusLine = { text: string; questions: string[] };
const KEY = "it:mock-focus-lines";

export function saveMockFocusLines(lines: MockFocusLine[]): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(lines.slice(0, 3)));
  } catch {
    /* storage unavailable: the interview just won't start with this line */
  }
}

export function readMockFocusLines(): MockFocusLine[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as MockFocusLine[];
    return Array.isArray(v) ? v.filter((l) => typeof l?.text === "string" && l.text.trim()).slice(0, 3) : [];
  } catch {
    return [];
  }
}

export function clearMockFocusLines(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
