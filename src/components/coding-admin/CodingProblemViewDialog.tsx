"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { AdminCodingProblemDetail } from "@/lib/api";
import { CodingProblemStatement } from "@/components/coding/CodingProblemStatement";
import { Loader2 } from "lucide-react";

function countPublicTests(problem: AdminCodingProblemDetail): number {
  return (
    problem.designMeta?.publicCases?.length ??
    problem.snippetMeta?.publicCases?.length ??
    problem.publicTests.length
  );
}

function countHiddenTests(problem: AdminCodingProblemDetail): number {
  return (
    problem.designMeta?.hiddenCases?.length ??
    problem.snippetMeta?.hiddenCases?.length ??
    problem.hiddenTests.length
  );
}

interface CodingProblemViewDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly problem: AdminCodingProblemDetail | null;
  readonly loading?: boolean;
}

export function CodingProblemViewDialog({
  open,
  onOpenChange,
  problem,
  loading,
}: CodingProblemViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{problem?.title ?? "Problem"}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : problem ? (
          <div className="space-y-4 text-sm">
            <p className="font-mono text-xs text-muted-foreground">
              {problem.problemId}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge>{problem.difficulty}</Badge>
              <Badge variant={problem.isActive ? "default" : "secondary"}>
                {problem.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">
                public: {countPublicTests(problem)}
              </Badge>
              <Badge variant="outline">
                hidden: {countHiddenTests(problem)}
              </Badge>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Statement
              </p>
              <div className="rounded-md bg-muted/40 p-3 text-xs">
                <CodingProblemStatement statement={problem.statement} />
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Public tests (preview)
              </p>
              {problem.publicTests.map((tc, i) => (
                <div key={i} className="mb-2 rounded border p-2 font-mono text-xs">
                  <div>in: {JSON.stringify(tc.input)}</div>
                  <div>out: {JSON.stringify(tc.expectedOutput)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
