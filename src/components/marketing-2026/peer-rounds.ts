/**
 * Peer round types and their price caps. The caps are whatever admin set on the backend
 * (`InterviewType.maxPriceCap`, served by the public `GET /peer/interview-types`); the list below is only
 * the fallback for when the API can't be reached, and supplies the short labels the marketing pages use.
 */
export type PeerRound = { key: string; k: string; min: number; cap: number };

export const FALLBACK_ROUNDS: PeerRound[] = [
  { key: "general_screening", k: "Screening", min: 30, cap: 300 },
  { key: "live_coding", k: "Live coding", min: 60, cap: 700 },
  { key: "system_design", k: "System design", min: 60, cap: 700 },
  { key: "managerial", k: "Managerial", min: 45, cap: 500 },
  { key: "salary_negotiation", k: "Salary negotiation", min: 30, cap: 500 },
  { key: "culture_fit_hr", k: "Culture fit / HR", min: 30, cap: 300 },
];

type ApiType = { key: string; name: string; maxPriceCap: number; defaultDurationMins: number; order?: number };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";

/** Server-side: live caps from the backend, refreshed every 5 minutes; falls back quietly if the API is down. */
export async function getPeerRounds(): Promise<PeerRound[]> {
  try {
    const res = await fetch(`${API_URL}/peer/interview-types`, { next: { revalidate: 300 } });
    if (!res.ok) return FALLBACK_ROUNDS;
    const body = (await res.json()) as { data?: ApiType[] };
    const types = (body.data ?? []).filter((t) => t.key && t.maxPriceCap > 0);
    if (types.length === 0) return FALLBACK_ROUNDS;
    const label = new Map(FALLBACK_ROUNDS.map((r) => [r.key, r.k]));
    return [...types]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((t) => ({ key: t.key, k: label.get(t.key) ?? t.name, min: t.defaultDurationMins, cap: t.maxPriceCap }));
  } catch {
    return FALLBACK_ROUNDS;
  }
}

/** How a round reads inside a sentence: "culture fit or HR", not "culture fit / hr". */
export const roundProse = (k: string) => k.toLowerCase().replace(" / hr", " or HR");

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
export const countWord = (n: number) => WORDS[n] ?? String(n);

/** "₹300 for screening and culture fit / hr, ₹500 for …": rounds grouped by cap, cheapest first. */
export function capSentence(rounds: PeerRound[]): string {
  const byCap = new Map<number, string[]>();
  for (const r of rounds) byCap.set(r.cap, [...(byCap.get(r.cap) ?? []), roundProse(r.k)]);
  const parts = [...byCap.entries()].sort((a, b) => a[0] - b[0]).map(([cap, ks]) => {
    const names = ks.length > 1 ? `${ks.slice(0, -1).join(", ")} and ${ks[ks.length - 1]}` : ks[0];
    return `₹${cap.toLocaleString("en-IN")} for ${names}`;
  });
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}` : parts[0] ?? "";
}
