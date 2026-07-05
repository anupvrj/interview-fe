"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { InterviewOptIns, IxScoreSnapshot } from "@/lib/api";
import { ixScoreApi } from "@/lib/api";
import {
  IX_CATEGORY_KEYS,
  IX_CATEGORY_META,
  normalizeInterviewOptIns,
} from "@/lib/ix-score-constants";
import { appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error-message";

type InterviewOptInsEditorProps = {
  initialOptIns: Partial<InterviewOptIns> | InterviewOptIns;
  onSaved?: (snapshot: IxScoreSnapshot) => void;
  onCancel?: () => void;
  compact?: boolean;
};

export function InterviewOptInsEditor({
  initialOptIns,
  onSaved,
  onCancel,
  compact = false,
}: InterviewOptInsEditorProps) {
  const [optIns, setOptIns] = useState<InterviewOptIns>(
    normalizeInterviewOptIns(initialOptIns),
  );
  const [saving, setSaving] = useState(false);

  const toggle = (key: keyof InterviewOptIns) => {
    setOptIns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const enabled = IX_CATEGORY_KEYS.filter((k) => next[k]);
      if (enabled.length === 0) {
        toast.error("At least one interview type must stay selected");
        return prev;
      }
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const snapshot = await ixScoreApi.updateInterviewOptIns(optIns);
      toast.success("Interview preferences updated");
      onSaved?.(snapshot);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to update preferences"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div className="grid gap-3 sm:grid-cols-2">
        {IX_CATEGORY_KEYS.map((key) => {
          const meta = IX_CATEGORY_META[key];
          const active = optIns[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                active
                  ? "border-[#7367F0] bg-[#7367F0]/5 shadow-sm"
                  : "border-border/80 bg-card hover:border-[#7367F0]/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <Label className="cursor-pointer text-sm font-semibold">
                  {meta.label}
                </Label>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                    active
                      ? "bg-[#7367F0] text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {active ? "On" : "Off"}
                </span>
              </div>
              {!compact && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {meta.description}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          className={appPrimaryButton}
          disabled={saving}
          onClick={() => void save()}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save preferences
        </Button>
      </div>
    </div>
  );
}
