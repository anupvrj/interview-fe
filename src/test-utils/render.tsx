/**
 * Minimal React test renderer for jsdom tests (no extra dependency): mount, act, find by text.
 */
import type { ReactElement } from "react";
import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export type Rendered = {
  container: HTMLElement;
  rerender: (ui: ReactElement) => void;
  unmount: () => void;
};

const mounted: Rendered[] = [];

export function render(ui: ReactElement): Rendered {
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: Root;
  act(() => {
    root = createRoot(container);
    root.render(ui);
  });
  const out: Rendered = {
    container,
    rerender: (next) => act(() => root.render(next)),
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
  mounted.push(out);
  return out;
}

/** Unmount everything rendered so far (call in afterEach). */
export function cleanup(): void {
  while (mounted.length) mounted.pop()!.unmount();
  document.body.innerHTML = "";
}

/** Body text (portals included). */
export const text = (): string => document.body.textContent ?? "";

/** A button (or link) whose text or aria-label contains `label`. */
export function button(label: string | RegExp): HTMLElement {
  const match = (s: string | null) => !!s && (typeof label === "string" ? s.includes(label) : label.test(s));
  const el = Array.from(document.querySelectorAll<HTMLElement>("button, a")).find(
    (b) => match(b.textContent) || match(b.getAttribute("aria-label")),
  );
  if (!el) throw new Error(`No button matching ${label}. Body: ${text().slice(0, 300)}`);
  return el;
}

export function click(el: HTMLElement): void {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

export function key(k: string): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: k }));
  });
}

/** Let effects, rAF and short timers run (real timers). */
export async function flush(ms = 50): Promise<void> {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

export { act };
