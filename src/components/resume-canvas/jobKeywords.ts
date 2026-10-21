/** All text values of a resume, one line per field / bullet, markup removed (case kept). */
export function resumePlainText(value: unknown): string {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(value);
  return out
    .join("\n")
    .replace(/<\/(li|p|div)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ");
}

/** Lower-cased resume text for keyword checks that follow live edits. */
export function resumeSearchText(value: unknown): string {
  return resumePlainText(value).toLowerCase();
}

/** Is a job keyword on the resume now? ("REST or gRPC" counts if either is there.) */
export function keywordOnResume(keyword: string, text: string): boolean {
  return keyword
    .split(/\s+or\s+|\s*\/\s*/i)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean)
    .some((k) => new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(text));
}

/** How many times a keyword (or any of its "A or B" forms) appears in lower-cased text. */
export function keywordCount(keyword: string, text: string): number {
  return keyword
    .split(/\s+or\s+|\s*\/\s*/i)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean)
    .reduce((sum, k) => {
      const re = new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[^a-z0-9]|$)`, "g");
      return sum + (text.match(re)?.length ?? 0);
    }, 0);
}
