/** Human-paced typing progress for the coding round film (ported from coding-round.tsx). */
export const CODING_DEMO_CODE = `def two_sum(numbers, target):
    left, right = 0, len(numbers) - 1
    while left < right:
        total = numbers[left] + numbers[right]
        if total == target:
            return [left + 1, right + 1]
        if total < target:
            left += 1
        else:
            right -= 1
    return []`;

export const CODING_DEMO_EFFORT = (() => {
  const code = CODING_DEMO_CODE;
  const a: number[] = [];
  let n = 0;
  for (let i = 0; i < code.length; i++) {
    n += 1;
    if (code[i] === "\n") n += code[i - 1] === ":" ? 12 : 7;
    a.push(n);
  }
  return a;
})();

export function typedAt(t: number, effort = CODING_DEMO_EFFORT): number {
  const goal = t * effort[effort.length - 1];
  let i = 0;
  while (i < effort.length && effort[i] <= goal) i += 1;
  return i;
}
