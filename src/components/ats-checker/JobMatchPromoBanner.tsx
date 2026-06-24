"use client";

import { useState } from "react";
import { Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const MIN_JD_LENGTH = 50;

interface JobMatchPromoBannerProps {
  initialJobDescription?: string;
  loading?: boolean;
  onRunJobMatch?: (jobDescription: string) => void | Promise<void>;
}

export function JobMatchPromoBanner({
  initialJobDescription = "",
  loading = false,
  onRunJobMatch,
}: JobMatchPromoBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    const trimmed = jobDescription.trim();
    if (trimmed.length < MIN_JD_LENGTH) {
      setError(
        `Paste at least ${MIN_JD_LENGTH} characters of the job description to run Job Match.`,
      );
      return;
    }

    if (!onRunJobMatch) {
      setError("Job Match analysis is unavailable on this page.");
      return;
    }

    setError(null);
    try {
      await onRunJobMatch(trimmed);
      setExpanded(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to run Job Match analysis.",
      );
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">
              Unlock Job Match insights
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Check your ATS score with a job description to see how well your
              resume matches the role — experience fit, must-have skills,
              education, and responsibilities.
            </p>
          </div>
        </div>

        {!expanded && (
          <Button
            type="button"
            variant="outline"
            className="w-full border-primary/40 sm:w-auto sm:self-start"
            disabled={loading || !onRunJobMatch}
            onClick={() => setExpanded(true)}
          >
            Run ATS check with job description
          </Button>
        )}

        {expanded && (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <label
              htmlFor="job-match-description"
              className="text-sm font-medium text-foreground"
            >
              Job description
            </label>
            <textarea
              id="job-match-description"
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
              placeholder="Paste the job description here to unlock Job Match analysis..."
              className="w-full min-h-[140px] resize-y rounded-xl border border-border bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={() => {
                  setExpanded(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-primary text-white hover:bg-primary/90"
                disabled={loading || !onRunJobMatch}
                onClick={() => void handleRun()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  "Run Job Match analysis"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
