/**
 * "Plain text" preview: the resume as plain text in reading order, the way a parser
 * reads our text-based PDF — headings, then lines, bullets as " - ". Columns come
 * out one after the other, which is also how most ATS read two-column layouts.
 */

const BLOCK = new Set([
  "DIV", "P", "LI", "UL", "OL", "H1", "H2", "H3", "H4", "H5", "H6", "SECTION", "HEADER", "TABLE", "TR", "BR",
]);

/** Section titles (the name is an H1 and stays a plain line). */
function isHeading(el: HTMLElement): boolean {
  return /^H[2-6]$/.test(el.tagName) || /section-header/.test(String(el.className));
}

export function atsPlainText(pages: HTMLElement[]): string {
  const lines: string[] = [];
  let current = "";
  const flush = () => {
    const text = current.replace(/\s+/g, " ").trim();
    if (text) lines.push(text);
    current = "";
  };

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      current += node.textContent ?? "";
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    // Hidden units (other pages' content, measuring copies) are not in the PDF.
    if (el.getClientRects().length === 0 && el.tagName !== "BR") return;
    if (el.tagName === "SVG" || el.tagName === "svg" || el.tagName === "IMG" || el.tagName === "STYLE") return;
    const block = BLOCK.has(el.tagName);
    if (block) flush();
    if (el.tagName === "LI") current += " - ";
    if (isHeading(el)) {
      const title = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      if (title) {
        lines.push("", title, "=".repeat(Math.min(Math.max(title.length, 6), 40)));
      }
      return;
    }
    el.childNodes.forEach(walk);
    if (block) flush();
  };

  pages.forEach((page) => {
    page.childNodes.forEach(walk);
    flush();
  });

  // Collapse runs of blank lines.
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
