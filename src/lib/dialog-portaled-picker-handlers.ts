type OutsideEvent = {
  preventDefault: () => void;
  target: EventTarget | null;
  detail?: { originalEvent?: { target?: EventTarget | null } };
};

function outsideEventTarget(event: OutsideEvent): EventTarget | null {
  return event.detail?.originalEvent?.target ?? event.target;
}

/** Radix Select, JobRoleSelect, and similar portaled pickers inside Dialog. */
export function isPortaledPickerTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("[data-radix-select-content]") ||
      target.closest("[data-radix-popper-content-wrapper]") ||
      target.closest("[data-institute-inline-dropdown]") ||
      target.closest("[data-job-role-dropdown]") ||
      target.closest('[role="listbox"]'),
  );
}

/** Spread onto DialogContent when the form uses portaled selects or role autocomplete. */
export const dialogPortaledPickerHandlers = {
  onPointerDownOutside: (event: OutsideEvent) => {
    if (isPortaledPickerTarget(outsideEventTarget(event))) {
      event.preventDefault();
    }
  },
  onInteractOutside: (event: OutsideEvent) => {
    if (isPortaledPickerTarget(outsideEventTarget(event))) {
      event.preventDefault();
    }
  },
  onFocusOutside: (event: OutsideEvent) => {
    if (isPortaledPickerTarget(outsideEventTarget(event))) {
      event.preventDefault();
    }
  },
};
