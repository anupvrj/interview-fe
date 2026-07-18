"use client";

import { Loader2 } from "lucide-react";
import { AppSelect } from "@/components/ui/app-select";
import type { CandidateStatus } from "@/lib/api";
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_ORDER,
} from "@/lib/recruiter";
import { cn } from "@/lib/utils";

const CANDIDATE_STATUS_OPTIONS = CANDIDATE_STATUS_ORDER.map((status) => ({
  value: status,
  label: CANDIDATE_STATUS_LABELS[status],
}));

export function CandidateStatusInlineSelect({
  id = "candidate-status",
  value,
  onChange,
  saving = false,
  disabled = false,
  className,
}: Readonly<{
  id?: string;
  value: CandidateStatus;
  onChange: (status: CandidateStatus) => void;
  saving?: boolean;
  disabled?: boolean;
  className?: string;
}>) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <AppSelect
        id={id}
        value={value}
        onChange={(next) => onChange(next as CandidateStatus)}
        options={CANDIDATE_STATUS_OPTIONS}
        disabled={disabled || saving}
        className="h-10 w-full min-w-[9.5rem] bg-card"
        aria-label="Job status"
      />
      {saving ? (
        <Loader2 className="pointer-events-none absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}
