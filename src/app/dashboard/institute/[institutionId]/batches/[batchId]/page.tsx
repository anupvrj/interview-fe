"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InterviewQuestionsField } from "@/components/institute/InterviewQuestionsField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  ArrowLeft,
  Trash2,
  UserPlus,
  Upload,
  CalendarClock,
  Search,
  Pencil,
  BarChart2,
  Trophy,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Users,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { userApi, adminApi, type User } from "@/lib/api";
import { apiErrorMessage, isConflictError } from "@/lib/api-errors";
import {
  cn,
  formatDate,
  parseQuestionLines,
  toDatetimeLocalValue,
} from "@/lib/utils";
import {
  InstituteEmptyState,
  InstituteLoader,
  InstitutePageHeader,
  InstituteStatCard,
  InstituteTableShell,
  instituteFilterBarClass,
  institutePanelClass,
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";

const MAX_JOB_DESCRIPTION_CHARS = 32000;

function memberInitials(name: string | undefined, email: string | undefined): string {
  const n = (name || "").trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts.at(0)?.[0] ?? "";
      const b = parts.at(-1)?.[0] ?? "";
      return `${a}${b}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const local = (email || "").split("@")[0] || "?";
  return local.slice(0, 2).toUpperCase();
}

function parseEmailsFromText(text: string): string[] {
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const set = new Set<string>();
  for (const m of text.matchAll(re)) {
    set.add(m[0].toLowerCase());
  }
  return Array.from(set);
}

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const institutionId = params.institutionId as string;
  const batchId = params.batchId as string;

  const [profile, setProfile] = useState<any>(null);
  const [batch, setBatch] = useState<any>(null);
  const [members, setMembers] = useState<{ clerkId: string; email: string; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [addingEmails, setAddingEmails] = useState(false);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [schAt, setSchAt] = useState("");
  const [schExpires, setSchExpires] = useState("");
  const [schRole, setSchRole] = useState("Software Engineer");
  const [schExp, setSchExp] = useState("2");
  const [schLang, setSchLang] = useState<"en" | "hi">("en");
  const [schCo, setSchCo] = useState("");
  const [schJobDescription, setSchJobDescription] = useState("");
  const [schDur, setSchDur] = useState<"15" | "30">("15");
  const [schQuestionsText, setSchQuestionsText] = useState("");
  const [schPassingScore, setSchPassingScore] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const [addUsersOpen, setAddUsersOpen] = useState(false);
  const [editBatchOpen, setEditBatchOpen] = useState(false);

  const [performance, setPerformance] = useState<Awaited<
    ReturnType<typeof adminApi.getBatchPerformance>
  > | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [scheduleRuns, setScheduleRuns] = useState<
    Awaited<ReturnType<typeof adminApi.listBatchScheduleRuns>>["runs"]
  >([]);
  const [runsLoading, setRunsLoading] = useState(false);

  const loadBatch = useCallback(async () => {
    const data = await adminApi.getBatch(batchId);
    setBatch(data);
    setMembers(Array.isArray(data.members) ? data.members : []);
    setEditName(data.name || "");
  }, [batchId]);

  useEffect(() => {
    userApi.getMyProfile().then(setProfile).catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (
      profile.accessRole !== "institution_admin" &&
      profile.accessRole !== "super_admin"
    ) {
      router.replace("/dashboard");
      return;
    }
    if (
      profile.accessRole === "institution_admin" &&
      profile.institutionId &&
      String(profile.institutionId) !== institutionId
    ) {
      router.replace("/dashboard");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        await loadBatch();
      } catch {
        router.replace(`/dashboard/institute/${institutionId}/batches`);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile, institutionId, batchId, router, loadBatch]);

  useEffect(() => {
    if (!profile || loading || !batch) return;
    let cancelled = false;
    (async () => {
      try {
        setPerfLoading(true);
        setRunsLoading(true);
        const [p, runsRes] = await Promise.all([
          adminApi.getBatchPerformance(batchId),
          adminApi.listBatchScheduleRuns(batchId),
        ]);
        if (!cancelled) {
          setPerformance(p);
          setScheduleRuns(runsRes.runs);
        }
      } catch {
        if (!cancelled) {
          setPerformance(null);
          setScheduleRuns([]);
        }
      } finally {
        if (!cancelled) {
          setPerfLoading(false);
          setRunsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, loading, batch, batchId]);

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        setSearching(true);
        const { data } = await adminApi.listUsers({
          limit: 15,
          skip: 0,
          search: q.trim(),
          ...(profile?.accessRole === "super_admin" ? { institutionId } : {}),
        });
        const inBatch = new Set(members.map((m) => m.clerkId));
        setSearchResults(
          (data as User[]).filter((u) => u.clerkId && !inBatch.has(u.clerkId))
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [institutionId, profile?.accessRole, members]
  );

  useEffect(() => {
    const t = setTimeout(() => runSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, runSearch]);

  const handleAddEmails = async () => {
    const emails = parseEmailsFromText(emailInput);
    if (emails.length === 0) {
      toast.error("No valid emails", {
        description: "Enter at least one valid email address.",
      });
      return;
    }
    try {
      setAddingEmails(true);
      const res = await adminApi.addBatchMembers(batchId, { emails });
      const skipped = res.skipped?.length
        ? res.skipped.map((s) => `${s.email}: ${s.reason}`).join("; ")
        : "";
      toast.success(
        `Added ${res.added?.length ?? 0} member${(res.added?.length ?? 0) === 1 ? "" : "s"}`,
        skipped
          ? {
              description: `Skipped: ${skipped}`,
              duration: 8000,
            }
          : { duration: 4000 }
      );
      setEmailInput("");
      await loadBatch();
    } catch (err: unknown) {
      toast.error("Couldn’t add members", {
        description: apiErrorMessage(err, "Failed to add members."),
        duration: 6000,
      });
    } finally {
      setAddingEmails(false);
    }
  };

  const handleCsv = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const emails = parseEmailsFromText(text);
    if (emails.length === 0) {
      toast.error("No emails in file", {
        description: "We couldn’t find any email addresses in that file.",
      });
      return;
    }
    try {
      setAddingEmails(true);
      const res = await adminApi.addBatchMembers(batchId, { emails });
      const skipped = res.skipped?.length
        ? res.skipped
            .slice(0, 8)
            .map((s) => `${s.email}: ${s.reason}`)
            .join("; ") + (res.skipped.length > 8 ? "…" : "")
        : "";
      toast.success(
        `Added ${res.added?.length ?? 0} from file (${emails.length} found)`,
        skipped
          ? { description: `Skipped: ${skipped}`, duration: 8000 }
          : { duration: 4000 }
      );
      await loadBatch();
    } catch (err: unknown) {
      toast.error("Import failed", {
        description: apiErrorMessage(err, "Could not import emails from file."),
        duration: 6000,
      });
    } finally {
      setAddingEmails(false);
    }
  };

  const handleAddClerk = async (u: User) => {
    try {
      await adminApi.addBatchMembers(batchId, { clerkIds: [u.clerkId] });
      setSearch("");
      setSearchResults([]);
      await loadBatch();
    } catch (err: unknown) {
      toast.error("Couldn’t add member", {
        description: apiErrorMessage(err, "Failed to add."),
        duration: 6000,
      });
    }
  };

  const handleRemove = async (clerkId: string) => {
    if (!confirm("Remove this person from the batch?")) return;
    try {
      await adminApi.removeBatchMember(batchId, clerkId);
      await loadBatch();
    } catch (err: unknown) {
      toast.error("Couldn’t remove member", {
        description: apiErrorMessage(err, "Failed to remove."),
        duration: 6000,
      });
    }
  };

  const handleSaveName = async () => {
    const n = editName.trim();
    if (!n) return;
    try {
      setSavingName(true);
      await adminApi.updateBatch(batchId, n);
      await loadBatch();
      setEditBatchOpen(false);
      toast.success("Batch renamed", {
        description: "The batch name was updated.",
      });
    } catch (err: unknown) {
      const msg = apiErrorMessage(err, "Failed to rename batch.");
      if (isConflictError(err)) {
        toast.error("Name already in use", {
          description: msg,
          duration: 6000,
        });
      } else {
        toast.error("Couldn’t rename batch", {
          description: msg,
          duration: 6000,
        });
      }
    } finally {
      setSavingName(false);
    }
  };

  const openBulkSchedule = () => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    t.setHours(10, 0, 0, 0);
    setSchAt(toDatetimeLocalValue(t));
    const exp = new Date(t);
    exp.setDate(exp.getDate() + 7);
    exp.setHours(23, 59, 0, 0);
    setSchExpires(toDatetimeLocalValue(exp));
    setSchQuestionsText("");
    setSchJobDescription("");
    setSchPassingScore("");
    setBulkOpen(true);
  };

  const handleBulkSchedule = async () => {
    if (!schRole.trim() || !schAt) return;
    const expY = Number.parseInt(schExp, 10);
    if (!Number.isFinite(expY) || expY < 0) {
      toast.error("Invalid experience", {
        description: "Enter a valid number of years of experience (0 or more).",
      });
      return;
    }
    if (members.length === 0) {
      toast.error("No members in batch", {
        description: "Add at least one member before scheduling interviews.",
      });
      return;
    }
    let passingScorePayload: number | undefined;
    if (schPassingScore.trim()) {
      const ps = Number.parseFloat(schPassingScore.trim());
      if (!Number.isFinite(ps) || ps < 0 || ps > 100) {
        toast.error("Invalid passing score", {
          description: "Passing score must be a number from 0 to 100.",
        });
        return;
      }
      passingScorePayload = ps;
    }
    const jd = schJobDescription.trim();
    if (jd.length > MAX_JOB_DESCRIPTION_CHARS) {
      toast.error("Job description too long", {
        description: `Use at most ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters (you have ${jd.length.toLocaleString()}).`,
      });
      return;
    }
    const customQs = parseQuestionLines(schQuestionsText);
    try {
      setBulkSubmitting(true);
      const result = await adminApi.bulkScheduleBatchInterviews(batchId, {
        scheduledAt: new Date(schAt).toISOString(),
        ...(schExpires.trim() ? { expiresAt: new Date(schExpires).toISOString() } : {}),
        role: schRole.trim(),
        experience: expY,
        language: schLang,
        targetCompany: schCo.trim() || undefined,
        interviewDuration: schDur === "30" ? 30 : 15,
        ...(customQs.length > 0 ? { customQuestions: customQs } : {}),
        ...(passingScorePayload !== undefined ? { passingScore: passingScorePayload } : {}),
        ...(jd ? { jobDescription: jd } : {}),
      });
      const failLines =
        result.failures?.length > 0
          ? result.failures
              .slice(0, 12)
              .map((f) => `${f.clerkId}: ${f.error}`)
              .join("\n") + (result.failures.length > 12 ? "\n…" : "")
          : "";
      if (result.created === result.total && !failLines) {
        toast.success(`Scheduled ${result.created} interview${result.created === 1 ? "" : "s"}`, {
          description: "Everyone in this batch now has a scheduled interview.",
          duration: 5000,
        });
      } else {
        toast.warning(
          `Scheduled ${result.created} of ${result.total} interview${result.total === 1 ? "" : "s"}`,
          {
            description: failLines
              ? `Some could not be scheduled:\n${failLines}`
              : undefined,
            duration: failLines ? 12000 : 5000,
          }
        );
      }
      setBulkOpen(false);
      try {
        const [p, runsRes] = await Promise.all([
          adminApi.getBatchPerformance(batchId),
          adminApi.listBatchScheduleRuns(batchId),
        ]);
        setPerformance(p);
        setScheduleRuns(runsRes.runs);
      } catch {
        /* ignore */
      }
    } catch (err: unknown) {
      toast.error("Bulk schedule failed", {
        description: apiErrorMessage(err, "Could not schedule interviews for this batch."),
        duration: 6000,
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!confirm("Delete this batch? Members are not deleted from your institution.")) return;
    try {
      await adminApi.deleteBatch(batchId);
      router.push(`/dashboard/institute/${institutionId}/batches`);
    } catch (err: unknown) {
      toast.error("Couldn’t delete batch", {
        description: apiErrorMessage(err, "Failed to delete batch."),
        duration: 6000,
      });
    }
  };

  if (!profile) {
    return <InstituteLoader />;
  }

  if (loading || !batch) {
    return (
      <div className="space-y-8">
        <Button
          variant="outline"
          size="sm"
          asChild
          className={cn(
            instituteSecondaryClass,
            "-ml-1 h-9 gap-2 rounded-full border-slate-200 px-4 shadow-sm transition-all hover:border-border/80"
          )}
        >
          <Link href={`/dashboard/institute/${institutionId}/batches`}>
            <ArrowLeft className="h-4 w-4" />
            Batches
          </Link>
        </Button>
        <div className="space-y-3">
          <div className="h-9 w-56 animate-pulse rounded-lg bg-slate-200/80" />
          <div className="h-4 max-w-md animate-pulse rounded bg-slate-100" />
        </div>
        <div className={cn(instituteFilterBarClass, "grid gap-3 sm:grid-cols-3")}>
          <div className="h-28 animate-pulse rounded-xl bg-slate-100/90" />
          <div className="h-28 animate-pulse rounded-xl bg-slate-100/90" />
          <div className="h-28 animate-pulse rounded-xl bg-slate-100/90" />
        </div>
        <Card className={cn(institutePanelClass, "overflow-hidden")}>
          <CardContent className="flex min-h-[200px] items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const runDetailHref = (runId: string) =>
    `/dashboard/institute/${institutionId}/batches/${batchId}/runs/${encodeURIComponent(runId)}`;

  return (
    <div className="space-y-8">
      <Button
        variant="outline"
        size="sm"
        asChild
        className={cn(
          instituteSecondaryClass,
          "-ml-1 h-9 gap-2 rounded-full border-slate-200 px-4 shadow-sm transition-all hover:border-border/80"
        )}
      >
        <Link href={`/dashboard/institute/${institutionId}/batches`}>
          <ArrowLeft className="h-4 w-4" />
          Batches
        </Link>
      </Button>

      <InstitutePageHeader
        badge="Batch"
        title={batch.name}
        description="Manage members, schedule interview rounds, and track cohort performance."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(instituteSecondaryClass, "h-9 gap-2")}
              onClick={() => setAddUsersOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Add users
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(instituteSecondaryClass, "h-9 gap-2")}
              onClick={() => {
                setEditName(batch.name || "");
                setEditBatchOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              size="sm"
              className={cn(institutePrimaryClass, "h-9 gap-2 shadow-lg")}
              onClick={openBulkSchedule}
              disabled={members.length === 0}
            >
              <CalendarClock className="h-4 w-4" />
              Schedule for batch
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              title="Delete batch"
              onClick={handleDeleteBatch}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div
        className={cn(
          instituteFilterBarClass,
          "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        <InstituteStatCard
          layout="horizontal"
          icon={Users}
          label="Members"
          value={members.length}
          footer="In this cohort"
        />
        <InstituteStatCard
          layout="horizontal"
          icon={CalendarClock}
          label="Scheduled rounds"
          value={runsLoading ? "—" : scheduleRuns.length}
          footer={runsLoading ? "Loading…" : "Bulk schedule runs"}
        />
        <InstituteStatCard
          layout="horizontal"
          icon={Clock}
          label="Last updated"
          value={batch.updatedAt ? formatDate(batch.updatedAt) : "—"}
          footer="Renames and membership"
        />
      </div>

      <Card className={cn(institutePanelClass, "overflow-hidden shadow-xl")}>
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/50 via-white to-indigo-50/30">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
                  <CalendarClock className="h-4 w-4 text-white" />
                </span>
                Scheduled interview rounds
              </CardTitle>
              <CardDescription className="mt-1.5">
                Each bulk schedule is a round. Open a round for scores, pass counts, and candidate
                detail.
              </CardDescription>
            </div>
            {!runsLoading && scheduleRuns.length > 0 ? (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border/80 bg-white/90 px-3 py-1 text-xs font-medium text-primary shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                {scheduleRuns.length} round{scheduleRuns.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {runsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
            </div>
          ) : scheduleRuns.length === 0 ? (
            <div className="px-4 py-6 sm:px-6">
              <InstituteEmptyState
                icon={CalendarClock}
                title="No rounds yet"
                description={
                  <>
                    Use <span className="font-semibold text-slate-800">Schedule for batch</span> to
                    create the first interview round for everyone in this cohort.
                  </>
                }
                action={
                  <Button
                    size="sm"
                    className={cn(institutePrimaryClass, "gap-2 shadow-lg")}
                    onClick={openBulkSchedule}
                    disabled={members.length === 0}
                  >
                    <CalendarClock className="h-4 w-4" />
                    Schedule for batch
                  </Button>
                }
              />
            </div>
          ) : (
            <InstituteTableShell>
              <Table className="w-full min-w-[720px]">
                <TableHeader>
                  <TableRow className="border-b border-slate-200/80 bg-slate-50/90 hover:bg-slate-50/90">
                    <TableHead className="pl-6 align-middle font-semibold text-slate-700">
                      Role
                    </TableHead>
                    <TableHead className="hidden align-middle font-semibold text-slate-700 sm:table-cell">
                      Scheduled for
                    </TableHead>
                    <TableHead className="align-middle font-semibold text-slate-700">
                      Candidates
                    </TableHead>
                    <TableHead className="hidden text-right align-middle font-semibold text-slate-700 md:table-cell">
                      Pass at
                    </TableHead>
                    <TableHead className="w-[128px] min-w-[128px] pr-6 text-right align-middle font-semibold text-slate-700">
                      Open
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduleRuns.map((run) => (
                    <TableRow
                      key={run.runId}
                      className="group cursor-pointer border-slate-100 align-middle transition-colors hover:bg-gradient-to-r hover:bg-muted/50 hover:to-transparent"
                      onClick={() => router.push(runDetailHref(run.runId))}
                    >
                      <TableCell className="pl-6 align-middle">
                        <span className="font-semibold text-slate-900">{run.role}</span>
                      </TableCell>
                      <TableCell className="hidden align-middle text-sm text-slate-600 sm:table-cell whitespace-nowrap">
                        {new Date(run.scheduledAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/90 px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-800">
                          <Users className="h-3.5 w-3.5 text-slate-500" />
                          {run.candidateCount}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-right align-middle tabular-nums md:table-cell">
                        {run.passingScore != null ? `${run.passingScore}` : "—"}
                      </TableCell>
                      <TableCell
                        className="w-[128px] min-w-[128px] pr-6 text-right align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            instituteSecondaryClass,
                            "h-8 gap-1 px-3 opacity-90 transition group-hover:opacity-100"
                          )}
                          asChild
                        >
                          <Link href={runDetailHref(run.runId)}>
                            Open
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </InstituteTableShell>
          )}
        </CardContent>
      </Card>

      <Card className={cn(institutePanelClass, "overflow-hidden shadow-xl")}>
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/50 via-white to-indigo-50/30">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
                  <BarChart2 className="h-4 w-4 text-white" />
                </span>
                Performance &amp; leaderboard
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-3xl">
                Scores reflect <span className="font-medium text-slate-700">bulk-scheduled</span>{" "}
                interviews for this batch. At interview start we use each candidate&apos;s{" "}
                <span className="font-medium text-slate-700">resume</span> and{" "}
                <span className="font-medium text-slate-700">profile experience</span>. Rankings
                update when reports are ready.
              </CardDescription>
            </div>
            {!perfLoading && performance && performance.topPerformers.length > 0 ? (
              <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50/90 px-3 py-1 text-xs font-medium text-amber-900 shadow-sm">
                <Trophy className="h-3.5 w-3.5 text-amber-600" />
                Leaderboard
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {perfLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
            </div>
          ) : performance ? (
            <div className="space-y-6 p-4 sm:p-6">
              {performance.schedulesWithBatchTag === 0 ? (
                <p className="rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-amber-50/40 px-4 py-3 text-sm text-amber-950 shadow-sm">
                  No schedules are linked to this batch yet. Run{" "}
                  <span className="font-semibold">Schedule for batch</span> — new schedules are
                  tagged so results aggregate here.
                </p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-gradient-to-br from-card to-card p-4 shadow-sm transition hover:border-border/50 hover:shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Average score
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                    {performance.averageScore != null
                      ? performance.averageScore.toFixed(1)
                      : "—"}
                    {performance.averageScore != null ? (
                      <span className="text-base font-semibold text-slate-500"> /100</span>
                    ) : null}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-gradient-to-br from-card to-card p-4 shadow-sm transition hover:border-border/50 hover:shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Highest score
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                    {performance.highestScore != null ? performance.highestScore : "—"}
                    {performance.highestScore != null ? (
                      <span className="text-base font-semibold text-slate-500"> /100</span>
                    ) : null}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50/90 to-white p-4 shadow-sm transition hover:border-slate-300/60 hover:shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reports ready
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                    {performance.reportsCompleted}
                  </p>
                  <p className="text-xs text-slate-500">of {performance.interviewsStarted} started</p>
                </div>
                <div className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50/90 to-white p-4 shadow-sm transition hover:border-slate-300/60 hover:shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Awaiting report
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                    {performance.inProgress.length}
                  </p>
                  <p className="text-xs text-slate-500">started, not ready yet</p>
                </div>
              </div>

              {performance.gradedWithThreshold > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-sm transition hover:shadow-md">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                      Passed (threshold)
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-950">
                      {performance.totalPassed}
                    </p>
                    <p className="text-xs text-emerald-900/75">
                      of {performance.gradedWithThreshold} graded with pass line
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-200/80 bg-gradient-to-br from-rose-50/90 to-white p-4 shadow-sm transition hover:shadow-md">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-800">
                      Did not pass
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-rose-950">
                      {performance.totalFailed}
                    </p>
                    <p className="text-xs text-rose-900/75">
                      of {performance.gradedWithThreshold} graded with pass line
                    </p>
                  </div>
                </div>
              ) : null}

              {performance.topPerformers.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Trophy className="h-4 w-4 text-amber-600" />
                    Top performers
                  </h3>
                  <InstituteTableShell className="rounded-lg">
                    <Table className="w-full min-w-[640px]">
                      <TableHeader>
                        <TableRow className="border-b border-slate-200/80 bg-slate-50/90 hover:bg-slate-50/90">
                          <TableHead className="w-14 pl-4 font-semibold text-slate-700">#</TableHead>
                          <TableHead className="font-semibold text-slate-700">Candidate</TableHead>
                          <TableHead className="text-right font-semibold text-slate-700">Score</TableHead>
                          <TableHead className="hidden font-semibold text-slate-700 sm:table-cell">
                            Scheduled
                          </TableHead>
                          <TableHead className="w-[100px] min-w-[100px] pr-4 text-right font-semibold text-slate-700">
                            Report
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performance.topPerformers.map((row) => (
                          <TableRow
                            key={`${row.interviewId}-${row.rank}`}
                            className="group border-slate-100 transition-colors hover:bg-gradient-to-r hover:from-muted/40 hover:to-transparent"
                          >
                            <TableCell className="pl-4 align-middle">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                                {row.rank}
                              </span>
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-indigo-100 text-xs font-bold text-primary shadow-inner ring-2 ring-white"
                                  aria-hidden
                                >
                                  {memberInitials(
                                    row.name ?? undefined,
                                    row.email ?? undefined
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate font-semibold text-slate-900">
                                    {row.name || row.email || row.clerkId}
                                  </div>
                                  {row.name && row.email ? (
                                    <div className="truncate text-xs text-slate-500">{row.email}</div>
                                  ) : null}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right align-middle">
                              <span className="inline-flex min-w-[3rem] justify-end rounded-full bg-muted/30 px-2.5 py-0.5 text-sm font-bold tabular-nums text-primary ring-1 ring-border">
                                {row.overallScore}
                              </span>
                            </TableCell>
                            <TableCell className="hidden align-middle text-sm text-slate-600 sm:table-cell whitespace-nowrap">
                              {new Date(row.scheduledAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="pr-4 text-right align-middle">
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(instituteSecondaryClass, "h-8 gap-1 px-3")}
                                asChild
                              >
                                <Link
                                  href={`/dashboard/institute/${institutionId}/candidates/${encodeURIComponent(row.clerkId)}/reports/${encodeURIComponent(row.interviewId)}`}
                                >
                                  View
                                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </InstituteTableShell>
                </div>
              ) : performance.schedulesWithBatchTag > 0 && performance.interviewsStarted === 0 ? (
                <p className="rounded-lg border border-slate-200/80 bg-slate-50/50 px-4 py-3 text-sm text-slate-600">
                  Interviews are scheduled — candidates have not started yet. Scores appear after they
                  finish and the report is generated.
                </p>
              ) : performance.interviewsStarted > 0 && performance.reportsCompleted === 0 ? (
                <p className="rounded-lg border border-slate-200/80 bg-slate-50/50 px-4 py-3 text-sm text-slate-600">
                  {performance.inProgress.length} interview
                  {performance.inProgress.length === 1 ? " has" : "s have"} started; overall scores
                  appear when processing finishes.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              Could not load performance data.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addUsersOpen} onOpenChange={setAddUsersOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/80 sm:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Add users</DialogTitle>
            <DialogDescription>
              Add people who are already in your institution to this batch.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-2 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
              <h4 className="text-sm font-bold text-slate-900">Add by email</h4>
              <p className="mt-1 text-xs text-slate-500">
                Paste one or many emails (comma, space, or newline). Only users already in your
                institution are added.
              </p>
              <textarea
                className="mt-2 min-h-[88px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                placeholder="a@x.com, b@y.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <Button
                className={cn(institutePrimaryClass, "mt-3 gap-2 shadow-md")}
                onClick={handleAddEmails}
                disabled={addingEmails}
              >
                {addingEmails ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Add to batch
              </Button>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 sm:border-l-0">
              <h4 className="text-sm font-bold text-slate-900">Import CSV</h4>
              <p className="mt-1 text-xs text-slate-500">
                Any column with email addresses works — we extract all addresses from the file.
              </p>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-white px-4 py-8 transition hover:border-border hover:bg-muted/30">
                <Upload className="mb-2 h-8 w-8 text-primary/70" />
                <span className="text-sm font-semibold text-slate-800">Choose CSV file</span>
                <span className="mt-1 text-xs text-slate-500">Drop or click to upload</span>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  className="hidden"
                  onChange={(e) => handleCsv(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div className="sm:col-span-2">
              <div className="rounded-xl border border-border bg-gradient-to-br from-muted/50 to-white p-4">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Search className="h-4 w-4 text-primary" />
                  Search candidates
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  Find users in your institution by name or email and add them to this batch
                </p>
                <Input
                  className="mt-2 h-11 border-slate-200 shadow-sm"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {searching ? (
                  <div className="mt-4 flex justify-center py-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul className="mt-3 max-h-52 space-y-1 overflow-auto rounded-lg border border-border bg-card p-2 shadow-inner">
                    {searchResults.map((u) => (
                      <li
                        key={u._id}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm transition hover:bg-muted/60"
                      >
                        <span className="min-w-0">
                          <span className="font-semibold text-slate-900">{u.name}</span>
                          <span className="text-slate-500"> · {u.email}</span>
                        </span>
                        <Button
                          size="sm"
                          className={cn(institutePrimaryClass, "shrink-0 gap-1")}
                          onClick={() => handleAddClerk(u)}
                        >
                          Add
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : search.trim() ? (
                  <p className="mt-3 text-sm text-slate-500">No matches (or already in batch)</p>
                ) : null}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className={instituteSecondaryClass}
              onClick={() => setAddUsersOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editBatchOpen}
        onOpenChange={(open) => {
          setEditBatchOpen(open);
          if (open && batch) setEditName(batch.name || "");
        }}
      >
        <DialogContent className="border-border/80 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit batch</DialogTitle>
            <DialogDescription>
              Change the name of this batch. The new name must be unique within your institution
              (case-insensitive).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="dlg-bn">Batch name</Label>
              <Input
                id="dlg-bn"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 h-11 border-slate-200 shadow-sm"
                placeholder="Batch name"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              className={instituteSecondaryClass}
              onClick={() => setEditBatchOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className={institutePrimaryClass}
              onClick={handleSaveName}
              disabled={
                savingName || !editName.trim() || editName.trim() === batch.name
              }
            >
              {savingName ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className={cn(institutePanelClass, "overflow-hidden shadow-xl")}>
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/50 via-white to-indigo-50/30">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
                  <Layers className="h-4 w-4 text-white" />
                </span>
                Members
              </CardTitle>
              <CardDescription className="mt-1.5">
                <span className="font-semibold text-slate-800">{members.length}</span>{" "}
                {members.length === 1 ? "person" : "people"} in this cohort — open reports or remove
                from the batch.
              </CardDescription>
            </div>
            {members.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                className={cn(instituteSecondaryClass, "shrink-0 gap-2")}
                onClick={() => setAddUsersOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                Add users
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {members.length === 0 ? (
            <div className="px-4 py-6 sm:px-6">
              <InstituteEmptyState
                icon={Users}
                title="No members yet"
                description="Add people from your institution by email, CSV, or search — then schedule interviews for the whole batch."
                action={
                  <Button
                    size="sm"
                    className={cn(institutePrimaryClass, "gap-2 shadow-lg")}
                    onClick={() => setAddUsersOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Add users
                  </Button>
                }
              />
            </div>
          ) : (
            <InstituteTableShell>
              <Table className="w-full min-w-[560px]">
                <TableHeader>
                  <TableRow className="border-b border-slate-200/80 bg-slate-50/90 hover:bg-slate-50/90">
                    <TableHead className="pl-6 align-middle font-semibold text-slate-700">
                      Candidate
                    </TableHead>
                    <TableHead className="w-[120px] min-w-[120px] text-right align-middle font-semibold text-slate-700">
                      Reports
                    </TableHead>
                    <TableHead className="w-[100px] min-w-[100px] pr-6 text-right align-middle font-semibold text-slate-700">
                      Remove
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow
                      key={m.clerkId}
                      className="group border-slate-100 align-middle transition-colors hover:bg-gradient-to-r hover:bg-muted/50 hover:to-transparent"
                    >
                      <TableCell className="pl-6 align-middle">
                        <div className="flex items-center gap-3 py-0.5">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/80 text-xs font-bold text-primary shadow-inner ring-2 ring-white"
                            aria-hidden
                          >
                            {memberInitials(m.name, m.email)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">{m.name}</div>
                            <div className="truncate text-xs text-slate-500">{m.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right align-middle">
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(instituteSecondaryClass, "h-8 gap-1 px-3 opacity-90 transition group-hover:opacity-100")}
                          asChild
                        >
                          <Link
                            href={`/dashboard/institute/${institutionId}/candidates/${encodeURIComponent(m.clerkId)}/reports`}
                          >
                            Open
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell className="pr-6 text-right align-middle">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-red-200/80 text-red-600 opacity-90 transition hover:bg-red-50 group-hover:opacity-100"
                          title="Remove from batch"
                          onClick={() => handleRemove(m.clerkId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </InstituteTableShell>
          )}
        </CardContent>
      </Card>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/80 sm:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Bulk schedule interviews</DialogTitle>
            <DialogDescription>
              Creates one scheduled interview per member with the same role, time, and settings
              (same rules as individual scheduling).
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-3">
            <div className="min-w-0">
              <Label htmlFor="bulk-at">Date & time</Label>
              <Input
                id="bulk-at"
                type="datetime-local"
                value={schAt}
                onChange={(e) => setSchAt(e.target.value)}
                className="mt-1 w-full"
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="bulk-ex">Expire deadline (optional)</Label>
              <Input
                id="bulk-ex"
                type="datetime-local"
                value={schExpires}
                onChange={(e) => setSchExpires(e.target.value)}
                className="mt-1 w-full"
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="bulk-role">Role</Label>
              <Input
                id="bulk-role"
                value={schRole}
                onChange={(e) => setSchRole(e.target.value)}
                className="mt-1 w-full"
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="bulk-exp">Years of experience</Label>
              <Input
                id="bulk-exp"
                type="number"
                min={0}
                value={schExp}
                onChange={(e) => setSchExp(e.target.value)}
                className="mt-1 w-full"
              />
            </div>
            <div className="min-w-0">
              <Label>Language</Label>
              <select
                className="app-control mt-1 w-full bg-card"
                value={schLang}
                onChange={(e) => setSchLang(e.target.value as "en" | "hi")}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <div className="min-w-0">
              <Label>Duration</Label>
              <select
                className="app-control mt-1 w-full bg-card"
                value={schDur}
                onChange={(e) => setSchDur(e.target.value as "15" | "30")}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
            <div className="min-w-0">
              <Label htmlFor="bulk-co">Target company (optional)</Label>
              <Input
                id="bulk-co"
                value={schCo}
                onChange={(e) => setSchCo(e.target.value)}
                className="mt-1 w-full"
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="bulk-pass">Passing score (optional)</Label>
              <Input
                id="bulk-pass"
                type="number"
                min={0}
                max={100}
                step={1}
                value={schPassingScore}
                onChange={(e) => setSchPassingScore(e.target.value)}
                placeholder="0–100"
                className="mt-1 w-full"
              />
            </div>
            <div className="min-w-0 sm:col-span-2">
              <Label htmlFor="bulk-jd">Job description (optional)</Label>
              <Textarea
                id="bulk-jd"
                value={schJobDescription}
                onChange={(e) => setSchJobDescription(e.target.value)}
                placeholder="Paste the role’s JD — the AI uses it when the candidate starts the interview."
                className="mt-1 min-h-[100px] resize-y text-sm"
                disabled={bulkSubmitting}
                maxLength={MAX_JOB_DESCRIPTION_CHARS}
              />
              <p className="mt-1 text-xs text-slate-500">
                Stored on each schedule and passed into the interview context (max{" "}
                {MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters).
              </p>
            </div>
            <div className="min-w-0 sm:col-span-2">
              <Label htmlFor="bulk-q" className="mb-1 block">
                Interview questions (optional)
              </Label>
              <InterviewQuestionsField
                id="bulk-q"
                value={schQuestionsText}
                onChange={setSchQuestionsText}
                disabled={bulkSubmitting}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className={instituteSecondaryClass}
              onClick={() => setBulkOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkSchedule}
              disabled={bulkSubmitting || !schAt || !schRole.trim()}
              className={cn(institutePrimaryClass, "shadow-md")}
            >
              {bulkSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Schedule for all"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
