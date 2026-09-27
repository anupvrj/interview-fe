export const TAB_BLUR_IGNORE_MS = 1500;
export const TAB_BLUR_SCORE_MIN_MS = 3000;

export interface TabFocusContext {
  displayPickerOpen: boolean;
  dialogOpen: boolean;
}

export function shouldEmitTabBlur(
  durationMs: number,
  ctx: TabFocusContext,
): boolean {
  if (ctx.displayPickerOpen || ctx.dialogOpen) return false;
  return durationMs >= TAB_BLUR_IGNORE_MS;
}
