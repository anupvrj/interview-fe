"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ixScoreApi, type IxScoreSnapshot } from "@/lib/api";
import { appCard, appPrimaryButton } from "@/lib/app-theme";
import { IxScoreRing } from "@/components/ix-score/IxScoreRing";
import { InterviewOptInsEditor } from "@/components/ix-score/InterviewOptInsEditor";
import { ixScoreColorClass } from "@/lib/ix-score-colors";
import { cn } from "@/lib/utils";

export function IxScoreSummaryCard() {
  const [snapshot, setSnapshot] = useState<IxScoreSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => {
    void ixScoreApi
      .getSnapshot()
      .then(setSnapshot)
      .catch(() => setSnapshot(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={cn(appCard, "flex items-center justify-center p-8")}>
        <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  const overall = snapshot?.overall.average ?? null;

  return (
    <div className={cn(appCard, "overflow-hidden")}>
      <div className="border-b border-border/60 bg-gradient-to-br from-[#7367F0]/10 via-card to-card px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <IxScoreRing score={overall} size="md" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                iX Score
              </p>
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  ixScoreColorClass(overall),
                )}
              >
                {overall != null ? `${overall} / 100` : "—"}
              </p>
              {snapshot && snapshot.overall.maxRaw > 100 && overall != null && (
                <p className="text-xs text-muted-foreground">
                  {snapshot.overall.rawSum} / {snapshot.overall.maxRaw}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="mr-1.5 h-4 w-4" />
                  Interview opts
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Interview preferences</DialogTitle>
                  <DialogDescription>
                    Choose which interview types count toward your iX Report.
                  </DialogDescription>
                </DialogHeader>
                {snapshot && (
                  <InterviewOptInsEditor
                    initialOptIns={snapshot.optIns}
                    onSaved={(s) => {
                      setSnapshot(s);
                      setPrefsOpen(false);
                    }}
                    onCancel={() => setPrefsOpen(false)}
                    compact
                  />
                )}
              </DialogContent>
            </Dialog>
            <Button asChild className={appPrimaryButton} size="sm">
              <Link href="/dashboard/ix-report">
                View detailed report
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
