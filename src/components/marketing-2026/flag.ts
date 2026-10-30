/** `NEXT_PUBLIC_MARKETING_2026=0` rolls a page back to its legacy body. */
export function isMarketing2026Enabled(): boolean {
  return process.env.NEXT_PUBLIC_MARKETING_2026 !== "0";
}
