/** Shared helpers for blog raw HTML blocks stored in TipTap content. */

export type RawHtmlBlockAttrs = {
  html: string;
  className?: string;
  label?: string;
};

const RAW_HTML_BLOCK_ATTR = "data-raw-html-block";
const B64_PREFIX = "b64:";

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

/** Encode block HTML for safe storage in a data-html attribute. */
export function encodeRawHtmlBlockAttr(html: string): string {
  if (typeof globalThis.btoa === "function") {
    return B64_PREFIX + globalThis.btoa(unescape(encodeURIComponent(html)));
  }
  return encodeURIComponent(html);
}

/** Decode block HTML from a data-html attribute. */
export function decodeRawHtmlBlockAttr(value: string): string {
  if (value.startsWith(B64_PREFIX) && typeof globalThis.atob === "function") {
    return decodeURIComponent(
      escape(globalThis.atob(value.slice(B64_PREFIX.length))),
    );
  }
  if (value.includes("%3C") || value.includes("%3E")) {
    try {
      return decodeURIComponent(value);
    } catch {
      return decodeHtmlEntities(value);
    }
  }
  return decodeHtmlEntities(value);
}

/** Expand serialized raw HTML blocks for blog preview / public display. */
export function prepareBlogHtmlForDisplay(html: string): string {
  if (!html?.includes(RAW_HTML_BLOCK_ATTR)) return html;

  let result = html;

  // Primary: HTML stored in data-html attribute (TipTap serialization).
  result = result.replace(
    /<div\b[^>]*\bdata-raw-html-block(?:="[^"]*")?[^>]*\bdata-html="([^"]*)"[^>]*>\s*<\/div>/gi,
    (_, encoded: string) => decodeRawHtmlBlockAttr(encoded),
  );

  // Fallback: inner HTML inside the wrapper (manual paste / legacy).
  result = result.replace(
    /<div\b[^>]*\bdata-raw-html-block(?:="[^"]*")?[^>]*>([\s\S]*?)<\/div>/gi,
    (_, inner: string) => inner.trim(),
  );

  return result;
}

export const RAW_HTML_BLOCK_DEFAULT_HTML = "<p>Paste or write HTML here.</p>";
