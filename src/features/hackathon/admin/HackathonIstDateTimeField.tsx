"use client";

import { Input } from "@/components/ui/input";
import { formatIst } from "../copy";
import { HackathonAdminField, hackathonAdminControlClass } from "./HackathonAdminField";
import { combineIstInput, istDateAndTimeToIso, splitIstInput } from "./time";

export function HackathonIstDateTimeField({
  id,
  label,
  hint,
  value,
  onChange,
  disabled,
  previewVerb = "Scheduled",
}: Readonly<{
  id: string;
  label: string;
  hint?: string;
  /** Combined `YYYY-MM-DDTHH:mm` in IST (same as legacy datetime-local form state). */
  value: string;
  onChange: (combined: string) => void;
  disabled?: boolean;
  previewVerb?: string;
}>) {
  const { date, time } = splitIstInput(value);
  const iso = istDateAndTimeToIso(date, time);
  const preview = iso ? `${previewVerb} ${formatIst(iso)}` : null;

  const patch = (nextDate: string, nextTime: string) => {
    if (!nextDate && !nextTime) {
      onChange("");
      return;
    }
    if (!nextDate) {
      onChange("");
      return;
    }
    if (!nextTime) {
      onChange(`${nextDate}T`);
      return;
    }
    onChange(combineIstInput(nextDate, nextTime));
  };

  return (
    <HackathonAdminField
      id={id}
      label={`${label} (IST)`}
      hint={hint ?? "India Standard Time (UTC+5:30)."}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          id={id}
          type="date"
          className={hackathonAdminControlClass}
          value={date}
          disabled={disabled}
          onChange={(e) => patch(e.target.value, time)}
        />
        <Input
          id={`${id}-time`}
          type="time"
          className={hackathonAdminControlClass}
          value={time}
          disabled={disabled}
          onChange={(e) => patch(date, e.target.value)}
        />
      </div>
      {preview ? <p className="mt-1.5 text-xs font-medium text-foreground">{preview}</p> : null}
      {date && time && !iso ? (
        <p className="mt-1 text-xs text-destructive">Enter a valid date and time.</p>
      ) : null}
    </HackathonAdminField>
  );
}
