import { useCallback, useRef, useState } from "react";
import {
  cloneResumeEditorSnapshot,
  resumeEditorSnapshotSignature,
  type ResumeEditorSnapshot,
} from "@/lib/resume-editor-history";

const MAX_HISTORY = 50;

export function useResumeEditorHistory() {
  const pastRef = useRef<ResumeEditorSnapshot[]>([]);
  const futureRef = useRef<ResumeEditorSnapshot[]>([]);
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion((value) => value + 1), []);

  const clear = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    bump();
  }, [bump]);

  const canUndo = version >= 0 && pastRef.current.length > 0;
  const canRedo = version >= 0 && futureRef.current.length > 0;

  const record = useCallback(
    (snapshot: ResumeEditorSnapshot) => {
      const cloned = cloneResumeEditorSnapshot(snapshot);
      const signature = resumeEditorSnapshotSignature(cloned);
      const last = pastRef.current[pastRef.current.length - 1];
      if (
        last &&
        resumeEditorSnapshotSignature(last) === signature
      ) {
        return;
      }

      pastRef.current.push(cloned);
      if (pastRef.current.length > MAX_HISTORY) {
        pastRef.current.shift();
      }
      futureRef.current = [];
      bump();
    },
    [bump],
  );

  const undo = useCallback(
    (current: ResumeEditorSnapshot): ResumeEditorSnapshot | null => {
      if (pastRef.current.length === 0) return null;
      futureRef.current.push(cloneResumeEditorSnapshot(current));
      const previous = pastRef.current.pop()!;
      bump();
      return previous;
    },
    [bump],
  );

  const redo = useCallback(
    (current: ResumeEditorSnapshot): ResumeEditorSnapshot | null => {
      if (futureRef.current.length === 0) return null;
      pastRef.current.push(cloneResumeEditorSnapshot(current));
      const next = futureRef.current.pop()!;
      bump();
      return next;
    },
    [bump],
  );

  return {
    record,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    version,
  };
}
