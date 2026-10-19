"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PopupSwitch({
  on,
  onChange,
  disabled,
  label,
}: Readonly<{ on: boolean; onChange: (next: boolean) => void; disabled?: boolean; label: string }>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        on ? "bg-[#7367F0]" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none mt-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-[1.35rem]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

/** Label + helper text on the left, switch on the right. */
export function ToggleRow({
  label,
  hint,
  on,
  onChange,
  disabled,
}: Readonly<{ label: string; hint?: string; on: boolean; onChange: (next: boolean) => void; disabled?: boolean }>) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <PopupSwitch on={on} onChange={onChange} disabled={disabled} label={label} />
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  action,
}: Readonly<{ title: string; description?: string; children: ReactNode; action?: ReactNode }>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className="grid gap-4 [&>*]:min-w-0">{children}</CardContent>
    </Card>
  );
}
