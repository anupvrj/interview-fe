/** Match interview-core: strip junk so job search never gets e.g. `]` as location. */
export function sanitizeJobBoardLocation(raw: string | undefined | null): string {
  if (raw == null) return "";
  let s = String(raw)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
  s = s.replace(/^[\s\[\](){}]+/, "").replace(/[\s\[\](){}]+$/, "");
  if (s.length < 2) return "";
  if (/^[\]\[}{().,;:_\-:]+$/.test(s)) return "";
  return s.slice(0, 200);
}
