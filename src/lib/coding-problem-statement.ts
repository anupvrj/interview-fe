export type StatementBlock =
  | { type: "text"; content: string }
  | { type: "image"; url: string; alt?: string };

const IMAGE_LINE_RE = /^\[image:\s*(.+?)\s*\]$/i;
const MARKDOWN_IMAGE_RE = /^!\[([^\]]*)\]\(([^)]+)\)$/;

/** Parse plain-text statements with `[image: url]` or `![alt](url)` lines. */
export function parseCodingProblemStatement(statement: string): StatementBlock[] {
  if (!statement) return [];

  const blocks: StatementBlock[] = [];
  const lines = statement.split("\n");
  let textBuffer: string[] = [];

  const flushText = () => {
    if (textBuffer.length === 0) return;
    blocks.push({ type: "text", content: textBuffer.join("\n") });
    textBuffer = [];
  };

  for (const line of lines) {
    const imageMatch = line.match(IMAGE_LINE_RE);
    if (imageMatch) {
      flushText();
      blocks.push({ type: "image", url: imageMatch[1].trim() });
      continue;
    }

    const mdMatch = line.match(MARKDOWN_IMAGE_RE);
    if (mdMatch) {
      flushText();
      blocks.push({
        type: "image",
        url: mdMatch[2].trim(),
        alt: mdMatch[1] || undefined,
      });
      continue;
    }

    textBuffer.push(line);
  }

  flushText();
  return blocks;
}

export function formatStatementImageMarker(url: string): string {
  return `[image: ${url.trim()}]`;
}

/** Insert an image marker at the cursor, or append when no cursor is provided. */
export function insertStatementImage(
  statement: string,
  url: string,
  selectionStart?: number,
  selectionEnd?: number,
): { value: string; cursor: number } {
  const marker = formatStatementImageMarker(url);

  if (
    selectionStart === undefined ||
    selectionEnd === undefined ||
    Number.isNaN(selectionStart)
  ) {
    const trimmed = statement.trimEnd();
    const prefix = trimmed.length > 0 ? `${trimmed}\n\n` : "";
    const value = `${prefix}${marker}\n`;
    return { value, cursor: value.length };
  }

  const before = statement.slice(0, selectionStart);
  const after = statement.slice(selectionEnd);
  const needsLeadingBreak = before.length > 0 && !before.endsWith("\n");
  const needsTrailingBreak = after.length > 0 && !after.startsWith("\n");
  const insert = `${needsLeadingBreak ? "\n" : ""}${marker}${needsTrailingBreak ? "\n" : ""}`;
  const value = before + insert + after;
  const cursor = before.length + insert.length;
  return { value, cursor };
}
