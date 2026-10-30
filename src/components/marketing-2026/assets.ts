/** Public prefix for copied prototype media. Never re-render these files. */
export const MK26_PUBLIC = "/marketing-2026";
export const MK26_CACHE = "13";

export function mk26Path(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean.startsWith(`${MK26_PUBLIC}/`) ? clean : `${MK26_PUBLIC}${clean}`;
}

/** Cache-busted URL for `<video>` / `<img>` (not `next/image`). */
export function mk26Asset(path: string): string {
  const prefixed = mk26Path(path);
  const join = prefixed.includes("?") ? "&" : "?";
  return `${prefixed}${join}v=${MK26_CACHE}`;
}
