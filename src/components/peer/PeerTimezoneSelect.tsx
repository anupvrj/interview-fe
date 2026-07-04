"use client";

import { useState } from "react";
import { Globe2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { peerTimezoneOptionsIncluding } from "@/components/peer/peerSlotTime";

type PeerTimezoneSelectProps = {
  timezone: string;
  onChange: (timezone: string) => void | Promise<void>;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
};

export function PeerTimezoneSelect({
  timezone,
  onChange,
  disabled,
  compact,
  className,
}: PeerTimezoneSelectProps) {
  const options = peerTimezoneOptionsIncluding(timezone);

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {!compact ? (
        <Label htmlFor="peer-timezone" className="text-xs font-medium text-muted-foreground">
          Your timezone
        </Label>
      ) : null}
      <div className="flex items-center gap-2">
        <Globe2 className="h-4 w-4 shrink-0 text-[#7367F0]" aria-hidden />
        <AppSelect
          id="peer-timezone"
          value={timezone}
          onChange={(v) => void onChange(v)}
          disabled={disabled}
          className="min-w-0 flex-1 text-sm"
          options={options.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </div>
      {!compact ? (
        <p className="text-[11px] text-muted-foreground">
          Slot and booking times are shown in this timezone.
        </p>
      ) : null}
    </div>
  );
}

export function PeerTimezoneBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[#7367F0]/20 bg-[#7367F0]/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#7367F0]",
        className,
      )}
    >
      <Globe2 className="h-3 w-3 shrink-0" aria-hidden />
      Times in {label}
    </span>
  );
}

export function PeerTimezoneSettingsButton({
  timezone,
  timezoneLabel,
  onChange,
  disabled,
  saving,
  className,
  compact,
}: {
  timezone: string;
  timezoneLabel: string;
  onChange: (timezone: string) => void | Promise<void>;
  disabled?: boolean;
  saving?: boolean;
  className?: string;
  /** Compact label for grouped header actions (icon + "Timezone" on all breakpoints). */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-label={`Timezone: ${timezoneLabel}`}
        className={cn("h-10 gap-1.5", className)}
      >
        <Globe2 className="h-4 w-4 shrink-0 text-[#7367F0]" />
        {compact ? (
          <>
            <span className="truncate text-xs font-semibold sm:text-sm">Timezone</span>
            <span className="hidden min-w-0 truncate text-muted-foreground sm:inline sm:max-w-[10rem]">
              {timezoneLabel}
            </span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Timezone</span>
            <span className="max-w-[8rem] truncate text-muted-foreground sm:max-w-[10rem]">
              {timezoneLabel}
            </span>
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
          <div className="border-b border-border/60 bg-gradient-to-br from-[#7367F0]/10 to-transparent px-6 py-5">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle>Set your timezone</DialogTitle>
              <DialogDescription>
                Slot times are created and shown in this timezone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-5">
            <PeerTimezoneSelect
              timezone={timezone}
              onChange={onChange}
              disabled={disabled || saving}
            />
          </div>
          <div className="flex justify-end border-t border-border/60 bg-muted/20 px-6 py-4">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
