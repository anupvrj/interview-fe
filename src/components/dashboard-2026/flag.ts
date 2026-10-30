/** `NEXT_PUBLIC_DASHBOARD_2026=0` rolls the logged-in pages back to their legacy bodies. */
export function isDashboard2026Enabled(): boolean {
  return process.env.NEXT_PUBLIC_DASHBOARD_2026 !== "0";
}
