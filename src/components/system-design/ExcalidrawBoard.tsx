"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Excalidraw,
  exportToBlob,
  hashElementsVersion,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import { systemDesignApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ExcalidrawBoardProps {
  sessionId: string;
  /** JSON from `serializeAsJSON(..., "database")` — loaded from session on resume. */
  initialSnapshotJson?: string | null;
  onExportRef?: (fn: () => Promise<string | null>) => void;
  /** Disables autosave and change handlers. */
  readOnly?: boolean;
  /**
   * Excalidraw view mode (hides toolbar when true). Defaults to `readOnly` when omitted.
   * Use `false` during pre-start preview so the toolbar remains visible under the overlay.
   */
  viewModeEnabled?: boolean;
  /** Centered overlay rendered above the canvas but below Excalidraw UI (z-index). */
  overlay?: React.ReactNode;
  /** Hide the top-left main menu (hamburger); uses scoped CSS on the wrapper. */
  hideMainMenu?: boolean;
  /** Fires on real scene edits — used to signal candidate liveness (throttled downstream). */
  onActivity?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyExcalidrawApi = any;

/**
 * Idle debounce: each scene change resets this timer; we only PUT after this many ms
 * with no further edits (user stopped drawing / panning / typing).
 */
const WHITEBOARD_SAVE_DEBOUNCE_MS = 1600;

/**
 * Safety-net autosave interval: covers crashes / hard reloads where the debounce
 * timer and `beforeunload` never fire. No-op when the scene fingerprint is unchanged.
 */
const WHITEBOARD_SAVE_INTERVAL_MS = 20_000;

/** Tracks real scene edits vs viewport-only churn. Uses Excalidraw's element-version hash + files map. */
function fingerprintScene(
  elements: Parameters<typeof hashElementsVersion>[0],
  files: Record<string, unknown>,
): string {
  const fv = `${hashElementsVersion(elements)}`;
  const fk = Object.keys(files).sort().join(",");
  return `${fv}|${fk}`;
}

const LOCAL_APP_PARTIAL = {
  viewBackgroundColor: "#ffffff",
  currentItemFontFamily: 1 as const,
};

export default function ExcalidrawBoard({
  sessionId,
  initialSnapshotJson = null,
  onExportRef,
  readOnly = false,
  viewModeEnabled,
  overlay,
  hideMainMenu = false,
  onActivity,
}: ExcalidrawBoardProps) {
  const isViewMode = viewModeEnabled ?? readOnly;
  const [excalidrawApi, setExcalidrawApi] = useState<AnyExcalidrawApi>(null);
  const apiRef = useRef<AnyExcalidrawApi>(null);
  const saveTimerRef = useRef<number | null>(null);
  const lastPersistedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    lastPersistedFingerprintRef.current = null;
  }, [sessionId]);

  /** Pass saved JSON through official init path — async `initializeScene` overwrites imperative `updateScene` if hydration runs too early after refresh. */
  const initialData = useMemo(() => {
    const raw =
      typeof initialSnapshotJson === "string" ? initialSnapshotJson.trim() : "";
    const fallback = { appState: { ...LOCAL_APP_PARTIAL } };
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return fallback;
    }
  }, [initialSnapshotJson]);

  const uiOptions = useMemo(
    () =>
      ({
        canvasActions: {
          export: false,
          loadScene: !readOnly,
          saveToActiveFile: false,
          saveAsImage: true,
        },
      }) as const,
    [readOnly],
  );

  const handleApiReady = useCallback((api: AnyExcalidrawApi) => {
    setExcalidrawApi(api);
  }, []);

  useEffect(() => {
    if (excalidrawApi) {
      apiRef.current = excalidrawApi;
    }
  }, [excalidrawApi]);

  const flushPersist = useCallback(
    async (force: boolean) => {
      const api = apiRef.current;
      if (!api || readOnly || !sessionId) return;
      try {
        const elements = api.getSceneElementsIncludingDeleted();
        const appState = api.getAppState();
        const files = api.getFiles() as Record<string, unknown>;
        const fp = fingerprintScene(elements, files);

        if (!force && fp === lastPersistedFingerprintRef.current) {
          return;
        }

        const json = serializeAsJSON(
          elements as unknown as Parameters<typeof serializeAsJSON>[0],
          appState,
          files as Parameters<typeof serializeAsJSON>[2],
          "database",
        );
        await systemDesignApi.saveWhiteboardSnapshot(sessionId, json);
        lastPersistedFingerprintRef.current = fp;
      } catch (e) {
        console.warn("[ExcalidrawBoard] Failed to autosave whiteboard", e);
      }
    },
    [readOnly, sessionId],
  );

  /** Debounced autosave: waits until edits are idle, then PUTs if the scene changed. */
  const scheduleDebouncedAutosave = useCallback(() => {
    if (readOnly) return;
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void flushPersist(false);
    }, WHITEBOARD_SAVE_DEBOUNCE_MS);
  }, [flushPersist, readOnly]);

  useEffect(() => {
    const onUnload = () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      void flushPersist(true);
    };
    // `visibilitychange` (tab hidden) and `pagehide` (mobile / bfcache / crash) are
    // more reliable than `beforeunload` alone, which is skipped in several teardown paths.
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") void flushPersist(false);
    };
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      void flushPersist(false);
    };
  }, [flushPersist]);

  useEffect(() => {
    if (readOnly) return undefined;
    const id = window.setInterval(() => {
      void flushPersist(false);
    }, WHITEBOARD_SAVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [flushPersist, readOnly]);

  useEffect(() => {
    const api = excalidrawApi;
    if (!api) return;
    const t = window.setTimeout(() => {
      try {
        lastPersistedFingerprintRef.current = fingerprintScene(
          api.getSceneElementsIncludingDeleted(),
          api.getFiles() as Record<string, unknown>,
        );
      } catch {
        /* scene not ready yet */
      }
      if (typeof api.scrollToContent === "function") {
        try {
          api.scrollToContent();
        } catch {
          /* optional */
        }
      }
    }, 0);
    return () => clearTimeout(t);
  }, [excalidrawApi, initialSnapshotJson]);

  /**
   * Imperative hooks (not JSX props) so they work with memoized Excalidraw.
   * - onChange: any scene mutation during a stroke
   * - onPointerUp: stroke / drag finished — restarts the same idle timer so we save soon after the user stops
   */
  useEffect(() => {
    const api = excalidrawApi;
    if (!api || readOnly) return undefined;
    const tickle = () => {
      scheduleDebouncedAutosave();
      onActivity?.();
    };
    const unsubChange = api.onChange(tickle);
    const unsubPointerUp = api.onPointerUp(() => {
      tickle();
    });
    return () => {
      unsubChange();
      unsubPointerUp();
    };
  }, [excalidrawApi, readOnly, scheduleDebouncedAutosave, onActivity]);

  useEffect(() => {
    if (!onExportRef) return;
    onExportRef(async () => {
      const api = apiRef.current;
      if (!api) return null;
      const elements = api
        .getSceneElements()
        .filter((el: { isDeleted?: boolean }) => !el.isDeleted);
      if (!elements.length) return null;
      const appState = api.getAppState();
      try {
        const blob = await exportToBlob({
          elements,
          appState: { ...appState, exportWithDarkMode: false },
          mimeType: "image/png",
          getDimensions: () => ({ width: 1280, height: 960, scale: 1 }),
        });
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(",")[1] ?? "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    });
  }, [onExportRef]);

  return (
    <div
      className={cn(
        "excalidraw-container relative h-full min-h-0 w-full min-w-0",
        hideMainMenu && "excalidraw-hide-main-menu",
      )}
      style={{ background: "#ffffff" }}
    >
      <Excalidraw
        key={sessionId}
        excalidrawAPI={handleApiReady}
        viewModeEnabled={isViewMode}
        initialData={initialData}
        UIOptions={uiOptions}
      />
      {overlay ? (
        <div className="excalidraw-prestart-shell absolute inset-0 z-[10]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[#0b1220]/25"
          />
          <div
            aria-hidden
            className="excalidraw-prestart-shield absolute inset-0 z-[1] cursor-not-allowed bg-transparent"
          />
          <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center px-4">
            {overlay}
          </div>
        </div>
      ) : null}
    </div>
  );
}
