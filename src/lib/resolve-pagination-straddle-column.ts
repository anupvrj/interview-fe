/** Wider of [data-resume-left-column] / [data-resume-right-column] drives straddling; null if equal width (use all boxes). */
function isLayoutElement(n: unknown): n is HTMLElement {
  return (
    typeof n === "object" &&
    n !== null &&
    "getBoundingClientRect" in n &&
    typeof (n as HTMLElement).getBoundingClientRect === "function"
  );
}

export function resolvePaginationStraddleColumn(
  container: HTMLElement,
): HTMLElement | null {
  const left = container.querySelector("[data-resume-left-column]");
  const right = container.querySelector("[data-resume-right-column]");
  if (!isLayoutElement(left) || !isLayoutElement(right)) {
    return null;
  }

  const lw = left.getBoundingClientRect().width;
  const rw = right.getBoundingClientRect().width;
  if (Math.abs(lw - rw) < 1) return null;

  return lw > rw ? left : right;
}
