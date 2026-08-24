"use client";

import { useEffect, useState } from "react";
import { Award, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InterviewOptIns, IxScoreSnapshot } from "@/lib/api";
import {
  formatInterviewList,
  getNonOptedInterviewLabels,
  hasAllInterviewOptIns,
} from "@/lib/ix-score-constants";
import { InterviewOptInsEditor } from "@/components/ix-score/InterviewOptInsEditor";
import {
  dismissIxOptInBanner,
  isIxOptInBannerDismissed,
} from "@/lib/ix-opt-in-banner-cookie";

type IxOptInBannerProps = {
  optIns: InterviewOptIns;
  onSaved: (snapshot: IxScoreSnapshot) => void;
  className?: string;
};

export function IxOptInBanner({ optIns, onSaved, className }: IxOptInBannerProps) {
  const [open, setOpen] = useState(false);
  /** null = cookie not read yet (avoid flash) */
  const [hidden, setHidden] = useState<boolean | null>(null);

  useEffect(() => {
    setHidden(isIxOptInBannerDismissed());
  }, []);

  const handleDismiss = () => {
    dismissIxOptInBanner();
    setHidden(true);
  };

  if (hidden === null || hidden || hasAllInterviewOptIns(optIns)) return null;

  const nonOptedLabels = getNonOptedInterviewLabels(optIns);
  const listText = formatInterviewList(nonOptedLabels);

  return (
    <>
      <div
        className={
          className ??
          "ix-report-enter relative flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 pr-10 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:pr-4"
        }
      >
        <button
          type="button"
          aria-label="Dismiss iX Report preferences reminder"
          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7367F0]/10 text-[#7367F0]">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              If you are also practising{" "}
              <span className="text-[#7367F0]">{listText}</span>, update your
              interview preferences to include them in your iX Report.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <button
                type="button"
                className="font-medium text-[#7367F0] underline-offset-2 hover:underline"
                onClick={() => setOpen(true)}
              >
                Update here
              </button>{" "}
              to select the interview types you want on your report card.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={handleDismiss}
          >
            Ignore
          </Button>
          <Button
            type="button"
            size="sm"
            className="shrink-0 bg-[#7367F0] hover:bg-[#6e62e5]"
            onClick={() => setOpen(true)}
          >
            Update preferences
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Interview preferences</DialogTitle>
            <DialogDescription>
              Choose which interview types appear on your iX Report. Currently
              not selected: {listText}.
            </DialogDescription>
          </DialogHeader>
          <InterviewOptInsEditor
            initialOptIns={optIns}
            onSaved={(snapshot) => {
              onSaved(snapshot);
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
