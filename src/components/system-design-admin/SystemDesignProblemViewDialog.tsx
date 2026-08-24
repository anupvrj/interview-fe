"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { StarRatingDisplay } from "@/components/system-design-admin/StarRatingInput";
import type { AdminSystemDesignProblemDetail } from "@/lib/api";

function ListSection({
  title,
  items,
}: {
  readonly title: string;
  readonly items: string[];
}) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={`${title}-${i}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function HtmlSection({
  title,
  html,
}: {
  readonly title: string;
  readonly html?: string;
}) {
  if (!html?.trim()) return null;
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      <div
        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

interface SystemDesignProblemViewDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly loading?: boolean;
  readonly problem: AdminSystemDesignProblemDetail | null;
}

export function SystemDesignProblemViewDialog({
  open,
  onOpenChange,
  loading,
  problem,
}: SystemDesignProblemViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : problem ? (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8 text-xl">{problem.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="secondary">{problem.category}</Badge>
                <Badge>{problem.difficulty}</Badge>
                {!problem.isActive ? (
                  <Badge variant="outline">Inactive</Badge>
                ) : null}
                <StarRatingDisplay value={problem.adminRating} size="md" />
              </div>
              <p className="text-sm text-muted-foreground">{problem.shortTitle}</p>
            </DialogHeader>

            <div className="rounded-md bg-muted/40 p-3 text-center text-sm">
              <div className="text-lg font-semibold tabular-nums">
                {problem.stats.attemptCount}
              </div>
              <div className="text-xs text-muted-foreground">Attempts</div>
            </div>

            {problem.askedAt?.length ? (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Companies</h4>
                <div className="flex flex-wrap gap-1">
                  {problem.askedAt.map((c) => (
                    <Badge key={c} variant="outline">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <HtmlSection title="Scenario" html={problem.scenario} />

            <ListSection title="Core requirements" items={problem.coreRequirements} />
            <ListSection
              title="Out of scope (functional)"
              items={problem.outOfScopeFunctional}
            />
            <ListSection
              title="Scale / reliability"
              items={problem.scaleRequirements}
            />
            <ListSection
              title="Out of scope (non-functional)"
              items={problem.outOfScopeNonFunctional}
            />
            <ListSection title="Core entities" items={problem.coreEntities} />
            <ListSection title="API hints" items={problem.apiHints} />
            <ListSection title="Considerations" items={problem.considerations} />

            <HtmlSection title="Mid level expectations" html={problem.levelExpectations?.mid} />
            <HtmlSection title="Senior level expectations" html={problem.levelExpectations?.senior} />
            <HtmlSection title="Staff+ expectations" html={problem.levelExpectations?.staff} />

            <div className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
              <div className="grid gap-1 sm:grid-cols-2">
                <div>
                  <span className="font-medium text-foreground">Problem ID:</span>{" "}
                  {problem.problemId}
                </div>
                <div>
                  <span className="font-medium text-foreground">Knowledge doc:</span>{" "}
                  {problem.knowledgeDocId}
                </div>
                <div>
                  <span className="font-medium text-foreground">Created:</span>{" "}
                  {new Date(problem.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium text-foreground">Updated:</span>{" "}
                  {new Date(problem.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            Problem not found.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
