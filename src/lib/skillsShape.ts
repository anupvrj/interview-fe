/**
 * Skills stored as { skills: [...] } (an older import shape, ~20 resumes) — every design
 * reads skills as a list or text, so this one printed an empty "Skills" heading and the
 * editor showed no chips (adding one then replaced the whole object). Unwrap it to the
 * list it holds. Grouped skills ({ technical, soft }, …) are left as they are.
 */
export function unwrapSkills(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const inner = (value as { skills?: unknown }).skills;
    if (Array.isArray(inner) || typeof inner === "string") return inner;
  }
  return value;
}
