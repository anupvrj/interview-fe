/**
 * A copy of unsaved resume edits in this browser, so a reload, a crash or a lost connection
 * doesn't throw work away. Written while there are unsaved changes, cleared once the server
 * has them, and restored on load only if the server copy hasn't moved on since (same revision)
 * — a newer save from another tab or device always wins.
 */

const key = (resumeId: string) => `rx:draft:v1:${resumeId}`;
/** Older than this, a leftover copy is more likely stale than wanted. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface EditorDraft<R = unknown, S = unknown, L = unknown> {
  /** Server revision the edits were made on. */
  revision: number | null;
  savedAt: number;
  resume: R;
  sections: S;
  layout: L;
}

export function saveEditorDraft<R, S, L>(resumeId: string, draft: Omit<EditorDraft<R, S, L>, "savedAt">): void {
  try {
    window.localStorage.setItem(key(resumeId), JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    /* storage full or blocked: autosave still runs, there's just no backup */
  }
}

export function readEditorDraft<R, S, L>(resumeId: string): EditorDraft<R, S, L> | null {
  try {
    const raw = window.localStorage.getItem(key(resumeId));
    if (!raw) return null;
    const draft = JSON.parse(raw) as EditorDraft<R, S, L>;
    if (!draft || typeof draft.savedAt !== "number" || Date.now() - draft.savedAt > MAX_AGE_MS) {
      clearEditorDraft(resumeId);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function clearEditorDraft(resumeId: string): void {
  try {
    window.localStorage.removeItem(key(resumeId));
  } catch {
    /* ignore */
  }
}

/** Where the user was: canvas scroll, open panel, selected item. Per tab (sessionStorage). */
export interface EditorPlace {
  scrollTop: number;
  panel: string | null;
  focus: { sectionId: string; index: number | null } | null;
  /** Field that had the caret (data-rx-path). */
  field: string | null;
}
const placeKey = (resumeId: string) => `rx:place:v1:${resumeId}`;

export function saveEditorPlace(resumeId: string, place: EditorPlace): void {
  try {
    window.sessionStorage.setItem(placeKey(resumeId), JSON.stringify(place));
  } catch {
    /* ignore */
  }
}

export function readEditorPlace(resumeId: string): EditorPlace | null {
  try {
    const raw = window.sessionStorage.getItem(placeKey(resumeId));
    return raw ? (JSON.parse(raw) as EditorPlace) : null;
  } catch {
    return null;
  }
}
