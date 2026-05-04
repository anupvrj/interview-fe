"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  systemDesignApi,
  type SystemDesignProblemSummary,
  type SystemDesignSession,
} from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import {
  institutePrimaryClass,
} from "@/components/institute/InstituteChrome";
import {
  Layers,
  Loader2,
  Plus,
  Sparkles,
  Clock,
  CheckCircle,
  ChevronRight,
  ArrowRight,
  NetworkIcon,
} from "lucide-react";
import { toast } from "sonner";

const difficultyClass: Record<string, string> = {
  easy: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  hard: "bg-red-100 text-red-700 border-red-200",
};

export default function SystemDesignPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [sessions, setSessions] = useState<SystemDesignSession[]>([]);
  const [problems, setProblems] = useState<SystemDesignProblemSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      systemDesignApi.listMySessions().catch(() => []),
      systemDesignApi.listProblems().catch(() => []),
    ]).then(([s, p]) => {
      setSessions(s);
      setProblems(p);
    }).finally(() => setLoadingSessions(false));
  }, [isLoaded, user]);

  const handleStart = async () => {
    setCreating(true);
    try {
      const session = await systemDesignApi.createSession(selectedProblemId ?? undefined);
      router.push(`/dashboard/system-design/${session.sessionId}`);
    } catch {
      toast.error("Could not start session. Please try again.");
      setCreating(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[rgb(37,99,235)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-8 pt-2">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/95 via-white to-slate-50/90 px-5 py-5 shadow-sm dark:border-violet-900/40 dark:from-violet-950/30 dark:via-card dark:to-slate-950/25">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
              <Sparkles className="h-3 w-3" aria-hidden />
              AI-powered
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-foreground sm:text-2xl">
              System Design Practice
            </h1>
            <p className="max-w-xl text-sm font-medium leading-snug text-slate-600 dark:text-slate-300">
              Draw architectures on an interactive whiteboard, get real-time AI feedback, and sharpen your system design skills.
            </p>
          </div>
          <Button
            size="sm"
            className={cn("h-9 gap-2 px-4", institutePrimaryClass)}
            onClick={() => setStartDialogOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Start new session
          </Button>
        </div>
      </section>

      {/* How it works */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            icon: Layers,
            title: "Get a problem",
            desc: "Pick from 10+ real system design questions or get a random one.",
          },
          {
            icon: NetworkIcon,
            title: "Design on canvas",
            desc: "Use the whiteboard to draw components, connections, and data flows.",
          },
          {
            icon: Sparkles,
            title: "AI feedback & score",
            desc: "Submit your diagram for instant AI critique, then get a final score.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-border dark:bg-card"
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/15">
              <Icon className="h-4 w-4 text-violet-600 dark:text-violet-300" aria-hidden />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-foreground">{title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
          </div>
        ))}
      </div>

      {/* Past sessions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 dark:text-foreground">
            Past sessions
          </h2>
        </div>

        {loadingSessions ? (
          <div className="flex min-h-[8rem] items-center justify-center rounded-xl border border-slate-200/80 bg-white dark:border-border dark:bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex min-h-[8rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 dark:border-border dark:bg-card/50">
            <NetworkIcon className="h-6 w-6 text-slate-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No sessions yet — start your first one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.sessionId}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 transition-shadow hover:shadow-sm dark:border-border dark:bg-card"
                onClick={() => router.push(`/dashboard/system-design/${s.sessionId}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") router.push(`/dashboard/system-design/${s.sessionId}`); }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-foreground">
                      {problems.find((p) => p.id === s.problemId)?.title ?? s.problemId}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        s.status === "completed"
                          ? "border-green-200 bg-green-100 text-green-700"
                          : "border-yellow-200 bg-yellow-100 text-yellow-700",
                      )}
                    >
                      {s.status}
                    </span>
                    {s.score !== undefined && (
                      <span className="text-xs font-medium text-slate-500">
                        Score: <span className="font-bold text-violet-600">{s.score}/100</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(s.createdAt)}
                    </span>
                    <span>{s.chatHistory?.length ?? 0} messages</span>
                    <span>{s.feedbackHistory?.length ?? 0} feedback rounds</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.status === "completed" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <span className="text-xs font-medium text-violet-600 dark:text-violet-400">Resume</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start dialog */}
      <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start a design session</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Choose a problem or get a random one. You can draw on the whiteboard and get AI feedback.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 space-y-1.5 overflow-y-auto py-1 pr-1">
            <button
              type="button"
              className={cn(
                "w-full rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
                selectedProblemId === null
                  ? "border-violet-400 bg-violet-50 dark:border-violet-500 dark:bg-violet-500/15"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-border dark:bg-card dark:hover:bg-muted/30",
              )}
              onClick={() => setSelectedProblemId(null)}
            >
              <span className="font-semibold text-slate-800 dark:text-foreground">🎲 Random problem</span>
              <p className="mt-0.5 text-xs text-slate-500">Let the AI surprise you</p>
            </button>

            {problems.map((p) => (
              <button
                key={p.id}
                type="button"
                className={cn(
                  "w-full rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
                  selectedProblemId === p.id
                    ? "border-violet-400 bg-violet-50 dark:border-violet-500 dark:bg-violet-500/15"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-border dark:bg-card dark:hover:bg-muted/30",
                )}
                onClick={() => setSelectedProblemId(p.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800 dark:text-foreground">{p.title}</span>
                  <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", difficultyClass[p.difficulty])}>
                    {p.difficulty}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{p.category}</p>
              </button>
            ))}
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStartDialogOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className={cn("gap-2", institutePrimaryClass)}
              onClick={handleStart}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Start session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
