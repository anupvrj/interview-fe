"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  detectBurstInsertion,
  monacoSourceFromFlags,
} from "@/lib/integrity/burstDetector";
import { CLIPBOARD_WARNING, type IntegrityEvent } from "@/lib/integrity/types";

const BURST_DEDUP_MS = 5000;

type MonacoRange = { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };

type MonacoEditor = {
  onDidChangeModelContent: (cb: (e: MonacoChangeEvent) => void) => { dispose: () => void };
  getSelection?: () => MonacoRange | null;
  getModel?: () => { getValueInRange: (range: MonacoRange) => string } | null;
};

type MonacoChangeEvent = {
  isFlush?: boolean;
  isUndoing?: boolean;
  isRedoing?: boolean;
  isEolChange?: boolean;
  changes: Array<{ text: string; rangeLength: number }>;
};

type MonacoNs = {
  KeyMod: { CtrlCmd: number; Shift: number };
  KeyCode: { KeyV: number; Insert: number };
};

export function useCodeSandbox(opts: {
  enabled: boolean;
  editorContainer: HTMLElement | null;
  problemPane?: HTMLElement | null;
  monacoEditor?: MonacoEditor | null;
  monaco?: MonacoNs | null;
  onEvent: (event: IntegrityEvent) => void;
}): { lastInternalClipboard: string } {
  const lastInternalRef = useRef("");
  const keydownTimesRef = useRef<number[]>([]);
  const lastBurstAtRef = useRef(0);
  const composingRef = useRef(false);
  const monacoEditorRef = useRef(opts.monacoEditor);
  const onEventRef = useRef(opts.onEvent);
  onEventRef.current = opts.onEvent;
  monacoEditorRef.current = opts.monacoEditor;

  useEffect(() => {
    if (!opts.enabled || !opts.editorContainer) return;
    const editorEl = opts.editorContainer;
    const problemEl = opts.problemPane ?? null;

    const rememberInternal = (text: string) => {
      lastInternalRef.current = text;
    };

    const emitBlocked = (action: "PASTE" | "COPY" | "CUT") => {
      toast.warning(CLIPBOARD_WARNING);
      onEventRef.current({
        type: "CLIPBOARD_ATTEMPT",
        action,
        timestamp: Date.now(),
        severity: "HIGH",
      });
    };

    const isInside = (target: EventTarget | null, root: HTMLElement | null) =>
      root != null && target instanceof Node && root.contains(target);

    const selectedEditorText = (): string => {
      const editor = monacoEditorRef.current;
      const sel = editor?.getSelection?.();
      const model = editor?.getModel?.();
      if (sel && model) {
        const text = model.getValueInRange(sel);
        if (text) return text;
      }
      return window.getSelection()?.toString() || "";
    };

    const onCopy = (e: ClipboardEvent) => {
      if (isInside(e.target, editorEl) || isInside(e.target, problemEl)) {
        const text =
          selectedEditorText() ||
          e.clipboardData?.getData("text/plain") ||
          "";
        if (text) rememberInternal(text);
      }
    };

    const onCut = (e: ClipboardEvent) => {
      if (isInside(e.target, editorEl)) {
        const text = selectedEditorText();
        if (text) rememberInternal(text);
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      if (!isInside(e.target, editorEl)) return;
      const incoming = e.clipboardData?.getData("text/plain") ?? "";
      if (!incoming || incoming === lastInternalRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      emitBlocked("PASTE");
    };

    const onContextMenu = (e: MouseEvent) => {
      if (!isInside(e.target, editorEl)) return;
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isInside(e.target, editorEl)) return;
      keydownTimesRef.current.push(Date.now());
      if (keydownTimesRef.current.length > 40) {
        keydownTimesRef.current.splice(0, 20);
      }
    };

    const onCompositionStart = () => {
      composingRef.current = true;
    };
    const onCompositionEnd = () => {
      composingRef.current = false;
    };

    editorEl.addEventListener("copy", onCopy);
    editorEl.addEventListener("cut", onCut);
    editorEl.addEventListener("paste", onPaste);
    editorEl.addEventListener("contextmenu", onContextMenu);
    editorEl.addEventListener("keydown", onKeyDown, true);
    editorEl.addEventListener("compositionstart", onCompositionStart);
    editorEl.addEventListener("compositionend", onCompositionEnd);
    problemEl?.addEventListener("copy", onCopy);

    return () => {
      editorEl.removeEventListener("copy", onCopy);
      editorEl.removeEventListener("cut", onCut);
      editorEl.removeEventListener("paste", onPaste);
      editorEl.removeEventListener("contextmenu", onContextMenu);
      editorEl.removeEventListener("keydown", onKeyDown, true);
      editorEl.removeEventListener("compositionstart", onCompositionStart);
      editorEl.removeEventListener("compositionend", onCompositionEnd);
      problemEl?.removeEventListener("copy", onCopy);
    };
  }, [opts.enabled, opts.editorContainer, opts.problemPane]);

  useEffect(() => {
    const editor = opts.monacoEditor;
    if (!opts.enabled || !editor) return;

    const disposable = editor.onDidChangeModelContent((e) => {
      const inserted = e.changes.map((c) => c.text).join("");
      const now = Date.now();
      const recentKeys = keydownTimesRef.current.filter((t) => now - t < 50);
      const burst = detectBurstInsertion({
        insertedText: inserted,
        deltaMs: recentKeys.length > 0 ? now - recentKeys[0] : 0,
        matchingKeydowns: recentKeys.length,
        source: monacoSourceFromFlags({
          isFlushing: e.isFlush,
          isUndoing: e.isUndoing,
          isRedoing: e.isRedoing,
          isEolChange: e.isEolChange,
          composing: composingRef.current,
        }),
      });
      if (!burst.isBurst) return;
      if (now - lastBurstAtRef.current < BURST_DEDUP_MS) return;
      lastBurstAtRef.current = now;
      onEventRef.current({
        type: "BURST_KEYSTROKE_INJECTION",
        deltaMs: burst.deltaMs,
        charCount: burst.charCount,
        timestamp: now,
        severity: "HIGH",
      });
    });

    return () => disposable.dispose();
  }, [opts.enabled, opts.monacoEditor]);

  return { lastInternalClipboard: lastInternalRef.current };
}
