"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { institutePrimaryClass } from "@/components/institute/InstituteChrome";
import { StarRatingDisplay } from "@/components/system-design-admin/StarRatingInput";
import type { SystemDesignProblemDetail } from "@/lib/api";
import { cn } from "@/lib/utils";

function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

function ListSection({
  title,
  items,
}: {
  readonly title: string;
  readonly items: string[];
}) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-foreground">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ScenarioBlock({ scenario }: { readonly scenario: string }) {
  if (!scenario.trim()) {
    return (
      <p className="text-sm italic text-muted-foreground">
        No scenario text available.
      </p>
    );
  }
  if (looksLikeHtml(scenario)) {
    return (
      <div
        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: scenario }}
      />
    );
  }
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
      {scenario}
    </p>
  );
}

type SystemDesignProblemPreviewDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly loading?: boolean;
  readonly problem: SystemDesignProblemDetail | null;
  readonly attemptBusy?: boolean;
  readonly onAttempt?: () => void;
};

export function SystemDesignProblemPreviewDialog({
  open,
  onOpenChange,
  loading,
  problem,
  attemptBusy,
  onAttempt,
}: SystemDesignProblemPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading problem…
          </div>
        ) : problem ? (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8 text-xl">{problem.title}</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-2 pt-1">
                  {problem.shortTitle ? (
                    <p className="text-sm text-muted-foreground">
                      {problem.shortTitle}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {problem.category.replace(/_/g, " ")}
                    </Badge>
                    <Badge className="capitalize">{problem.difficulty}</Badge>
                    <StarRatingDisplay value={problem.adminRating} size="md" />
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>

            {problem.askedAt?.length ? (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">
                  Frequently asked at
                </h4>
                <div className="flex flex-wrap gap-1">
                  {problem.askedAt.map((company) => (
                    <Badge key={company} variant="outline">
                      {company}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                Scenario
              </h4>
              <ScenarioBlock scenario={problem.scenario} />
            </div>

            <ListSection
              title="Core requirements"
              items={problem.coreRequirements}
            />
            <ListSection
              title="Scale requirements"
              items={problem.scaleRequirements}
            />
            <ListSection
              title="Considerations"
              items={problem.considerations}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              {onAttempt ? (
                <Button
                  type="button"
                  disabled={attemptBusy}
                  className={cn(institutePrimaryClass)}
                  onClick={onAttempt}
                >
                  {attemptBusy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Attempt now
                </Button>
              ) : null}
            </DialogFooter>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Problem details unavailable.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
