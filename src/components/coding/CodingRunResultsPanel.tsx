"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CodingRunCase = {
  index: number;
  passed: boolean;
  expected?: string;
  actual?: string;
  stderr?: string;
  compileOutput?: string;
  status?: string;
  error?: string;
  visibility?: "public" | "hidden";
};

export type CodingRunPayload = {
  results: CodingRunCase[];
  passed: number;
  total: number;
};

function displayOut(s: string | undefined) {
  if (s === undefined) return "—";
  if (s === "") return "(empty)";
  return s;
}

export function CodingRunResultsPanel({
  payload,
  theme = "light",
  showVisibility = false,
  successHint,
}: Readonly<{
  payload: CodingRunPayload;
  theme?: "light" | "dark";
  showVisibility?: boolean;
  successHint?: string;
}>) {
  const { results, passed, total } = payload;
  const failed = total - passed;
  const allPass = total > 0 && passed === total;
  const allFail = total > 0 && passed === 0;
  const dark = theme === "dark";

  return (
    <section
      aria-label="Test run results"
      className={cn(
        "overflow-hidden rounded-lg border text-sm",
        dark
          ? cn(
              allPass && "border-emerald-500/40 bg-emerald-500/10",
              !allPass && !allFail && total > 0 && "border-amber-500/35 bg-amber-500/10",
              allFail && "border-red-500/40 bg-red-500/10",
              total === 0 && "border-white/10 bg-card/[0.04]",
            )
          : cn(
              allPass && "border-emerald-200 bg-emerald-50/40",
              !allPass && !allFail && total > 0 && "border-amber-200 bg-amber-50/30",
              allFail && "border-red-200 bg-red-50/30",
              total === 0 && "border-border bg-muted/20",
            ),
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 border-b px-3 py-2",
          dark
            ? cn(
                allPass && "border-emerald-500/30 bg-emerald-500/15",
                !allPass && !allFail && total > 0 && "border-amber-500/25 bg-amber-500/10",
                allFail && "border-red-500/30 bg-red-500/15",
                total === 0 && "border-white/10 bg-card/[0.06]",
              )
            : cn(
                allPass && "border-emerald-200/80 bg-emerald-50/80",
                !allPass && !allFail && total > 0 && "border-amber-200/80 bg-amber-50/60",
                allFail && "border-red-200/80 bg-red-50/60",
                total === 0 && "border-border bg-slate-100/80",
              ),
        )}
      >
        {total === 0 ? (
          <span
            className={cn("font-medium", dark ? "text-gray-400" : "text-foreground")}
          >
            No tests were run.
          </span>
        ) : (
          <>
            <span
              className={cn(
                "font-semibold tabular-nums",
                dark
                  ? allPass
                    ? "text-emerald-400"
                    : "text-white"
                  : allPass
                    ? "text-emerald-800"
                    : "text-foreground",
              )}
            >
              {passed} / {total} passed
            </span>
            {failed > 0 && (
              <span
                className={cn(
                  "font-medium tabular-nums",
                  dark ? "text-red-400" : "text-red-700",
                )}
              >
                {failed} failed
              </span>
            )}
            {allPass && successHint ? (
              <span
                className={cn(
                  "text-xs sm:text-sm",
                  dark ? "text-emerald-400/90" : "text-emerald-700",
                )}
              >
                {successHint}
              </span>
            ) : null}
          </>
        )}
      </div>
      <ul
        className={cn(
          "max-h-56 overflow-y-auto",
          dark ? "divide-y divide-white/10" : "divide-y divide-slate-200/80",
        )}
      >
        {results.map((r) => (
          <li
            key={r.index}
            className={cn(
              "space-y-2 px-3 py-3",
              dark
                ? r.passed
                  ? "bg-card/[0.03]"
                  : "bg-card/[0.06]"
                : r.passed
                  ? "bg-card/60"
                  : "bg-card/80",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              {r.passed ? (
                <CheckCircle2
                  className={cn(
                    "h-5 w-5 shrink-0",
                    dark ? "text-emerald-400" : "text-emerald-600",
                  )}
                  aria-hidden
                />
              ) : (
                <XCircle
                  className={cn(
                    "h-5 w-5 shrink-0",
                    dark ? "text-red-400" : "text-red-600",
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  dark ? "text-white" : "text-foreground",
                )}
              >
                Test {r.index + 1}
              </span>
              {showVisibility && r.visibility ? (
                <Badge variant="outline" className="text-xs font-normal">
                  {r.visibility}
                </Badge>
              ) : null}
              <span
                className={cn(
                  "text-sm font-semibold uppercase tracking-wide",
                  r.passed
                    ? dark
                      ? "text-emerald-400"
                      : "text-emerald-700"
                    : dark
                      ? "text-red-400"
                      : "text-red-700",
                )}
              >
                {r.passed ? "Passed" : "Failed"}
              </span>
              {r.status ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-normal",
                    dark && "border-white/20 bg-card/[0.06] text-gray-200",
                  )}
                >
                  {r.status}
                </Badge>
              ) : null}
            </div>

            {(r.expected !== undefined || r.actual !== undefined) && (
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <div
                    className={cn(
                      "mb-0.5 font-sans text-xs font-medium",
                      dark ? "text-gray-400" : "text-muted-foreground",
                    )}
                  >
                    Expected
                  </div>
                  <pre
                    className={cn(
                      "whitespace-pre-wrap break-words rounded border px-2 py-1.5 font-mono text-xs",
                      dark
                        ? r.passed
                          ? "border-emerald-500/35 bg-black/35 text-emerald-200/95"
                          : "border-white/15 bg-black/35 text-gray-200"
                        : r.passed
                          ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                          : "border-border bg-muted/20 text-foreground",
                    )}
                  >
                    {displayOut(r.expected)}
                  </pre>
                </div>
                <div>
                  <div
                    className={cn(
                      "mb-0.5 font-sans text-xs font-medium",
                      dark ? "text-gray-400" : "text-muted-foreground",
                    )}
                  >
                    Your output
                  </div>
                  <pre
                    className={cn(
                      "whitespace-pre-wrap break-words rounded border px-2 py-1.5 font-mono text-xs",
                      dark
                        ? r.passed
                          ? "border-emerald-500/35 bg-black/35 text-emerald-200/95"
                          : "border-red-500/40 bg-red-500/10 text-red-200"
                        : r.passed
                          ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                          : "border-red-200 bg-red-50/90 text-red-900",
                    )}
                  >
                    {displayOut(r.actual)}
                  </pre>
                </div>
              </div>
            )}

            {r.error ? (
              <div
                className={cn(
                  "rounded border px-2 py-1.5 text-xs",
                  dark
                    ? "border-red-900/60 bg-red-950/40 text-red-200"
                    : "border-red-200 bg-red-50 text-red-900",
                )}
              >
                <span
                  className={cn(
                    "font-semibold",
                    dark ? "text-red-300" : "text-red-800",
                  )}
                >
                  Note:{" "}
                </span>
                {r.error}
              </div>
            ) : null}
            {r.stderr ? (
              <div>
                <div
                  className={cn(
                    "mb-0.5 font-sans text-xs font-medium",
                    dark ? "text-gray-400" : "text-muted-foreground",
                  )}
                >
                  stderr
                </div>
                <pre
                  className={cn(
                    "max-h-24 overflow-y-auto whitespace-pre-wrap break-words rounded border px-2 py-1.5 font-mono text-xs",
                    dark
                      ? "border-primary/35 bg-primary/10 text-primary-foreground/90"
                      : "border-amber-200 bg-amber-50/80 text-amber-950",
                  )}
                >
                  {r.stderr.trim() || "(empty)"}
                </pre>
              </div>
            ) : null}
            {r.compileOutput ? (
              <div>
                <div
                  className={cn(
                    "mb-0.5 font-sans text-xs font-medium",
                    dark ? "text-gray-400" : "text-muted-foreground",
                  )}
                >
                  Compiler output
                </div>
                <pre
                  className={cn(
                    "max-h-24 overflow-y-auto whitespace-pre-wrap break-words rounded border px-2 py-1.5 font-mono text-xs",
                    dark
                      ? "border-white/15 bg-black/35 text-gray-300"
                      : "border-border bg-slate-100 text-foreground",
                  )}
                >
                  {r.compileOutput.trim() || "(empty)"}
                </pre>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
