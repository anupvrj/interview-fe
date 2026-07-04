"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_META } from "@/lib/roles";
import { useActiveRole } from "@/components/roles/ActiveRoleProvider";

type RoleSwitcherProps = {
  className?: string;
};

export function RoleSwitcher({ className }: Readonly<RoleSwitcherProps>) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const ctx = useActiveRole();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!ctx || !ctx.activeRole || ctx.availableRoles.length <= 1) return null;

  const { activeRole, availableRoles, setActiveRole } = ctx;
  const currentMeta = ROLE_META[activeRole];
  const CurrentIcon = currentMeta.icon;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Switch role"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        )}
      >
        <CurrentIcon className="h-4 w-4 shrink-0 text-[#7367F0]" />
        <span className="hidden max-w-[8rem] truncate sm:inline">
          {currentMeta.label}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[80] w-60 pt-2">
          <div
            id={menuId}
            role="menu"
            aria-label="Switch role"
            className="overflow-hidden rounded-xl border border-border bg-card shadow-header"
          >
            <p className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Continue as
            </p>
            <div className="space-y-0.5 p-1.5">
              {availableRoles.map((role) => {
                const meta = ROLE_META[role];
                const Icon = meta.icon;
                const isActive = role === activeRole;
                return (
                  <button
                    key={role}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    onClick={() => {
                      setOpen(false);
                      if (!isActive) setActiveRole(role);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/50",
                      isActive && "bg-muted/40",
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#7367F0]/10 text-[#7367F0]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                      {meta.label}
                    </span>
                    {isActive ? (
                      <Check className="h-4 w-4 shrink-0 text-[#7367F0]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
