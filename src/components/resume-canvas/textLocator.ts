/**
 * Find a piece of text on the rendered resume pages and return its on-screen
 * rectangles (one per line), so issues and keywords can be highlighted in place.
 */

export interface TextHit {
  rects: DOMRect[];
  /** Nearest editable field, so a click can focus it. */
  field: HTMLElement | null;
}

function normalise(text: string): string {
  return text.replace(/\s+/g, " ").toLowerCase();
}

function isWordChar(ch: string | undefined): boolean {
  return !!ch && /[\p{L}\p{N}]/u.test(ch);
}

/** Visible text nodes of the paginated pages (skips the hidden measuring copy and display:none units). */
function visibleTextNodes(root: HTMLElement): Text[] {
  const nodes: Text[] = [];
  for (const page of Array.from(root.querySelectorAll<HTMLElement>(".resume-page"))) {
    const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent || !node.textContent) return NodeFilter.FILTER_REJECT;
        return parent.getClientRects().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    let n: Node | null;
    while ((n = walker.nextNode())) nodes.push(n as Text);
  }
  return nodes;
}

/**
 * All visible occurrences of `needle` (whitespace/case-insensitive). With `wholeWord`,
 * matches must not sit inside a longer word ("Go" does not match "Google").
 */
export function locateText(root: HTMLElement, needle: string, options: { wholeWord?: boolean; max?: number } = {}): TextHit[] {
  const target = normalise(needle.trim());
  if (target.length < 2) return [];
  const nodes = visibleTextNodes(root);
  // One normalised string for all nodes, with a map back to (node, offset).
  let flat = "";
  const map: Array<{ node: Text; offset: number }> = [];
  let lastWasSpace = true;
  for (const node of nodes) {
    const text = node.textContent ?? "";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (/\s/.test(ch)) {
        if (lastWasSpace) continue;
        flat += " ";
        lastWasSpace = true;
      } else {
        flat += ch.toLowerCase();
        lastWasSpace = false;
      }
      map.push({ node, offset: i });
    }
    // Separate text nodes from different elements so words don't fuse across boundaries.
    if (!lastWasSpace) {
      flat += " ";
      map.push({ node, offset: text.length });
      lastWasSpace = true;
    }
  }

  const hits: TextHit[] = [];
  let from = 0;
  const max = options.max ?? 5;
  while (hits.length < max) {
    const at = flat.indexOf(target, from);
    if (at < 0) break;
    from = at + 1;
    if (options.wholeWord && (isWordChar(flat[at - 1]) || isWordChar(flat[at + target.length]))) continue;
    const start = map[at];
    const end = map[at + target.length - 1];
    if (!start || !end) continue;
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, Math.min(end.offset + 1, end.node.length));
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    if (!rects.length) continue;
    const field = (start.node.parentElement?.closest("[data-rx-path]") as HTMLElement | null) ?? null;
    hits.push({ rects, field });
  }
  return hits;
}
