/**
 * Put sections in the order that suits the person's career stage (Resume Writer v2's
 * recommendedOrder): freshers lead with education, licensed roles with licences. Only sections in
 * the main column move, and only among the slots main-column sections already hold — sidebar
 * sections of a two-column design stay where the design put them. Unknown types keep their order.
 */
export function reorderSections<T extends { type: string; column?: string }>(order: T[], recommended: string[] | undefined): T[] {
  if (!recommended?.length || !Array.isArray(order)) return order;
  const rank = (t: string, i: number) => {
    const r = recommended.indexOf(t);
    return r >= 0 ? r : 1000 + i;
  };
  const isMain = (s: T) => !s.column || s.column === "left" || s.column === "main";
  const slots = order.map((s, i) => (isMain(s) && s.type !== "personalInfo" ? i : -1)).filter((i) => i >= 0);
  const items = slots.map((i) => order[i]).map((s, k) => ({ s, k })).sort((a, b) => rank(a.s.type, a.k) - rank(b.s.type, b.k) || a.k - b.k);
  const out = [...order];
  slots.forEach((slot, k) => {
    out[slot] = items[k].s;
  });
  return out;
}
