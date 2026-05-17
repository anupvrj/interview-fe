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
  readOnly?: boolean;
  /** Hide the top-left main menu (hamburger); uses scoped CSS on the wrapper. */
  hideMainMenu?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyExcalidrawApi = any;

/**
 * Idle debounce: each scene change resets this timer; we only PUT after this many ms
 * with no further edits (user stopped drawing / panning / typing).
 */
const WHITEBOARD_SAVE_DEBOUNCE_MS = 1600;

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
  hideMainMenu = false,
}: ExcalidrawBoardProps) {
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
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      void flushPersist(false);
    };
  }, [flushPersist]);

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
    };
    const unsubChange = api.onChange(tickle);
    const unsubPointerUp = api.onPointerUp(() => {
      tickle();
    });
    return () => {
      unsubChange();
      unsubPointerUp();
    };
  }, [excalidrawApi, readOnly, scheduleDebouncedAutosave]);

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
        "excalidraw-container h-full min-h-0 w-full min-w-0",
        hideMainMenu && "excalidraw-hide-main-menu",
      )}
      style={{ background: "#ffffff" }}
    >
      <Excalidraw
        key={sessionId}
        excalidrawAPI={handleApiReady}
        viewModeEnabled={readOnly}
        initialData={initialData}
        UIOptions={uiOptions}
      />
    </div>
  );
}
