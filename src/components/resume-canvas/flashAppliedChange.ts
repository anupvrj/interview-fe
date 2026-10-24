import type { SuggestionAt } from "@/lib/suggestionApply";

/**
 * After a suggestion goes in: scroll the page to it and give it a short green glow, so the
 * change is easy to review. The page re-renders (and may re-paginate) after the edit, so
 * this waits for the field to show the new text before looking.
 */
export function flashAppliedChange(at: SuggestionAt, text: string, { timeoutMs = 1500 } = {}): void {
  if (typeof document === "undefined") return;
  const wanted = text.replace(/\s+/g, " ").trim().toLowerCase().slice(0, 40);
  const started = Date.now();

  const find = (): HTMLElement | null => {
    const fields = Array.from(document.querySelectorAll<HTMLElement>(`.resume-page [data-rx-path="${CSS.escape(at.path)}"]`)).filter(
      (el) => el.getClientRects().length > 0,
    );
    if (!fields.length) return null;
    if (at.index === null) return fields[0];
    // A field split across pages continues its bullets on the next page.
    const blocks = fields.flatMap((field) => {
      const lis = Array.from(field.querySelectorAll<HTMLElement>("li"));
      return lis.length ? lis : Array.from(field.querySelectorAll<HTMLElement>("p"));
    });
    const byText = blocks.find((b) => (b.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase().startsWith(wanted));
    return byText ?? blocks[at.index] ?? fields[0];
  };

  const tick = () => {
    const el = find();
    const ready = el && (el.textContent ?? "").replace(/\s+/g, " ").toLowerCase().includes(wanted.slice(0, 20));
    if (!ready && Date.now() - started < timeoutMs) {
      window.setTimeout(tick, 80);
      return;
    }
    if (!el) return; // not on the page (hidden section): nothing to show
    scrollIntoClearView(el);
    el.classList.remove("rx-applied-flash");
    void el.offsetWidth; // restart the animation if it's flashed twice in a row
    el.classList.add("rx-applied-flash");
    window.setTimeout(() => el.classList.remove("rx-applied-flash"), 3400);
  };
  window.setTimeout(tick, 60);
}


/** The nearest ancestor that scrolls vertically (the canvas), or null for the window. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

/**
 * Center `el` in the part of the screen you can actually see: on phones a panel sheet
 * covers the bottom of the page, so "center of the scroller" would be under it.
 */
function scrollIntoClearView(el: HTMLElement): void {
  const scroller = scrollParent(el);
  const box = scroller?.getBoundingClientRect();
  const top = Math.max(0, box?.top ?? 0);
  let bottom = Math.min(window.innerHeight, box?.bottom ?? window.innerHeight);
  // A fixed panel over the lower part of the screen (bottom sheet / tab bar).
  const probe = typeof document.elementsFromPoint === "function" ? document.elementsFromPoint(window.innerWidth / 2, bottom - 4) : [];
  for (const node of probe) {
    let cover: Element | null = node;
    while (cover && cover !== document.body && getComputedStyle(cover).position !== "fixed") cover = cover.parentElement;
    if (!cover || cover === document.body || cover.contains(el)) continue;
    const coverTop = cover.getBoundingClientRect().top;
    if (coverTop > top + 40) bottom = Math.min(bottom, coverTop);
    break;
  }
  const rect = el.getBoundingClientRect();
  const delta = rect.top + rect.height / 2 - (top + bottom) / 2;
  if (Math.abs(delta) < 4) return;
  if (scroller) scroller.scrollBy({ top: delta, behavior: "smooth" });
  else window.scrollBy({ top: delta, behavior: "smooth" });
}
