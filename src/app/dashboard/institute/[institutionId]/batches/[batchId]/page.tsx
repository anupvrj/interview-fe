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
import { FormField } from "@/components/app/FormField";
import { Textarea } from "@/components/ui/textarea";
import {
  INSTITUTE_BATCH_SCHEDULE_WIZARD_STEPS,
  InstituteBatchScheduleWizardForm,
  validateInstituteBatchScheduleWizardStep,
} from "@/components/institute/InstituteBatchScheduleWizard";
import {
  buildInstituteScheduleRoundApiFields,
  instituteScheduleRoundLabel,
  validateInstituteScheduleRound,
  type InstituteScheduleRoundType,
} from "@/lib/institute-schedule-round";
import { InstituteBatchDetailHero } from "@/components/institute/InstituteBatchDetailHero";
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
  Users,
  Target,
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { toast } from "sonner";
import { userApi, adminApi, type User } from "@/lib/api";
import { apiErrorMessage, isConflictError } from "@/lib/api-errors";
import {
  cn,
  formatDate,
  parseQuestionLines,
  toDatetimeLocalValue,
} from "@/lib/utils";
import { dialogPortaledPickerHandlers } from "@/lib/dialog-portaled-picker-handlers";
import {
  InstituteEmptyState,
  InstituteLoader,
  InstituteTableShell,
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";

const instituteCardClass =
  "overflow-hidden rounded-xl border border-border/60 bg-card shadow-card";
import {
  canViewInstitutePage,
  instituteRoleCanManageBatches,
} from "@/lib/institute-access";

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

function batchDateSubtitle(batch: {
  startDate?: string | Date | null;
  endDate?: string | Date | null;
}): string | null {
  const start = batch.startDate ? formatDate(String(batch.startDate)) : null;
  const end = batch.endDate ? formatDate(String(batch.endDate)) : null;
  if (start && end) return `${start} – ${end}`;
  if (start) return `Starts ${start}`;
  if (end) return `Ends ${end}`;
  return null;
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
  const [editMaxStudents, setEditMaxStudents] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [addingEmails, setAddingEmails] = useState(false);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [schAt, setSchAt] = useState("");
  const [schExpires, setSchExpires] = useState("");
  const [schRole, setSchRole] = useState("");
  const [schExp, setSchExp] = useState("2");
  const [schCo, setSchCo] = useState("");
  const [schJobDescription, setSchJobDescription] = useState("");
  const [schDur, setSchDur] = useState<"15" | "30">("15");
  const [schQuestionsText, setSchQuestionsText] = useState("");
  const [schPassingScore, setSchPassingScore] = useState("");
  const [schRoundType, setSchRoundType] =
    useState<InstituteScheduleRoundType>("ai_mock");
  const [schCodingProblemIds, setSchCodingProblemIds] = useState<string[]>([]);
  const [schSystemDesignProblemId, setSchSystemDesignProblemId] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkWizardStep, setBulkWizardStep] = useState(1);

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
    if (!canViewInstitutePage(profile, institutionId, "batches")) {
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
    const maxParsed = editMaxStudents.trim()
      ? Number.parseInt(editMaxStudents, 10)
      : null;
    if (editMaxStudents.trim() && (!Number.isFinite(maxParsed!) || maxParsed! < 0)) {
      toast.error("Max students must be a non-negative number.");
      return;
    }
    try {
      setSavingName(true);
      await adminApi.updateBatch(batchId, {
        name: n,
        maxStudents: maxParsed,
        startDate: editStartDate || null,
        endDate: editEndDate || null,
      });
      await loadBatch();
      setEditBatchOpen(false);
      toast.success("Batch updated", {
        description: "Batch details were saved.",
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
    setSchExpires("");
    setSchQuestionsText("");
    setSchJobDescription("");
    setSchPassingScore("");
    setSchRoundType("ai_mock");
    setSchCodingProblemIds([]);
    setSchSystemDesignProblemId("");
    setBulkWizardStep(1);
    setBulkOpen(true);
  };

  const closeBulkDialog = () => {
    setBulkOpen(false);
    setBulkWizardStep(1);
  };

  const bulkMemberCount = members.length;

  const bulkBatchSummary = batch
    ? {
        name: batch.name?.trim() || "Untitled batch",
        memberCount: bulkMemberCount,
      }
    : null;

  const validateBulkWizardStep = (step: number): boolean =>
    validateInstituteBatchScheduleWizardStep(step, {
      memberCount: bulkMemberCount,
      hasSelectedBatch: !!batch,
      scheduleAt: schAt,
      role: schRole,
      roundType: schRoundType,
      codingProblemIds: schCodingProblemIds,
      systemDesignProblemId: schSystemDesignProblemId,
    });

  const goBulkWizardNext = () => {
    if (!validateBulkWizardStep(bulkWizardStep)) return;
    setBulkWizardStep((s) =>
      Math.min(s + 1, INSTITUTE_BATCH_SCHEDULE_WIZARD_STEPS.length),
    );
  };

  const goBulkWizardBack = () => {
    setBulkWizardStep((s) => Math.max(s - 1, 1));
  };

  const handleBulkSchedule = async () => {
    if (!validateBulkWizardStep(3)) {
      setBulkWizardStep(3);
      return;
    }
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
    const roundErr = validateInstituteScheduleRound(
      schRoundType,
      schCodingProblemIds,
      schSystemDesignProblemId,
    );
    if (roundErr) {
      toast.error(roundErr);
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
        language: "en",
        targetCompany: schCo.trim() || undefined,
        interviewDuration: schDur === "30" ? 30 : 15,
        ...(passingScorePayload !== undefined ? { passingScore: passingScorePayload } : {}),
        ...(jd ? { jobDescription: jd } : {}),
        ...buildInstituteScheduleRoundApiFields(schRoundType, {
          customQuestions: customQs,
          codingProblemIds: schCodingProblemIds,
          systemDesignProblemId: schSystemDesignProblemId,
        }),
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
      closeBulkDialog();
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
      <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
        <Button
          variant="outline"
          size="sm"
          asChild
          className={cn(instituteSecondaryClass, "h-9 gap-2 px-3")}
        >
          <Link href={`/dashboard/institute/${institutionId}/batches`}>
            <ArrowLeft className="h-4 w-4" />
            Batches
          </Link>
        </Button>
        <div className="h-[7.5rem] animate-pulse rounded-2xl bg-muted/60" />
        <Card className={instituteCardClass}>
          <CardContent className="flex min-h-[200px] items-center justify-center py-16">
            <Loader2 className="h-9 w-9 animate-spin text-[#7367F0]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const runDetailHref = (runId: string) =>
    `/dashboard/institute/${institutionId}/batches/${batchId}/runs/${encodeURIComponent(runId)}`;

  const heroSubtitle = batchDateSubtitle(batch);
  const reportsCompleted =
    perfLoading || !performance ? null : performance.reportsCompleted;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <Button
        variant="outline"
        size="sm"
        asChild
        className={cn(instituteSecondaryClass, "h-9 gap-2 px-3")}
      >
        <Link href={`/dashboard/institute/${institutionId}/batches`}>
          <ArrowLeft className="h-4 w-4" />
          Batches
        </Link>
      </Button>

      <InstituteBatchDetailHero
        batchName={batch.name || "Untitled batch"}
        memberCount={members.length}
        scheduledRounds={runsLoading ? undefined : scheduleRuns.length}
        reportsCompleted={reportsCompleted}
        subtitle={heroSubtitle}
        loading={runsLoading && perfLoading}
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(instituteSecondaryClass, "h-10 gap-2")}
          onClick={() => setAddUsersOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          Add users
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn(instituteSecondaryClass, "h-10 gap-2")}
          onClick={() => {
            setEditName(batch.name || "");
            setEditBatchOpen(true);
          }}
        >
          <Pencil className="h-4 w-4" />
          Edit batch
        </Button>
        <Button
          size="sm"
          className={cn(institutePrimaryClass, "h-10 gap-2")}
          onClick={openBulkSchedule}
          disabled={members.length === 0}
        >
          <CalendarClock className="h-4 w-4" />
          Schedule for batch
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn(instituteSecondaryClass, "h-10 gap-2")}
          asChild
        >
          <Link href={`/dashboard/institute/${institutionId}/batches/${batchId}/report`}>
            <BarChart2 className="h-4 w-4" />
            Report
          </Link>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          title="Delete batch"
          onClick={handleDeleteBatch}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Card className={instituteCardClass}>
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground">
              Performance &amp; leaderboard
            </CardTitle>
            <CardDescription className="mt-1 max-w-3xl text-sm">
              Scores from bulk-scheduled interviews in this cohort. Rankings update when reports
              are ready.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {perfLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-9 w-9 animate-spin text-[#7367F0]" />
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                <DashboardStatCard
                  theme="violet"
                  label="Average score"
                  icon={Target}
                  value={
                    performance.averageScore != null
                      ? `${performance.averageScore.toFixed(1)}/100`
                      : "—"
                  }
                  progress={
                    performance.averageScore != null
                      ? Math.round(performance.averageScore)
                      : undefined
                  }
                  hint={<span>Batch cohort average</span>}
                />
                <DashboardStatCard
                  theme="amber"
                  label="Highest score"
                  icon={Trophy}
                  value={
                    performance.highestScore != null
                      ? `${performance.highestScore}/100`
                      : "—"
                  }
                  progress={
                    performance.highestScore != null
                      ? performance.highestScore
                      : undefined
                  }
                  hint={<span>Top score in this batch</span>}
                />
                <DashboardStatCard
                  theme="emerald"
                  label="Reports ready"
                  icon={FileCheck}
                  value={performance.reportsCompleted}
                  hint={
                    <span>
                      of {performance.interviewsStarted} interview
                      {performance.interviewsStarted === 1 ? "" : "s"} started
                    </span>
                  }
                />
                <DashboardStatCard
                  theme="sky"
                  label="Awaiting report"
                  icon={Clock}
                  value={performance.inProgress.length}
                  hint={<span>Started, not ready yet</span>}
                />
              </div>

              {performance.gradedWithThreshold > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <DashboardStatCard
                    theme="emerald"
                    label="Passed (threshold)"
                    icon={CheckCircle}
                    value={performance.totalPassed}
                    hint={
                      <span>
                        of {performance.gradedWithThreshold} graded with pass line
                      </span>
                    }
                  />
                  <DashboardStatCard
                    theme="rose"
                    label="Did not pass"
                    icon={XCircle}
                    value={performance.totalFailed}
                    hint={
                      <span>
                        of {performance.gradedWithThreshold} graded with pass line
                      </span>
                    }
                  />
                </div>
              ) : null}

              {performance.topPerformers.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Trophy className="h-4 w-4 text-amber-600" />
                    Top performers
                  </h3>
                  <InstituteTableShell className="rounded-lg">
                    <Table className="w-full min-w-[640px]">
                      <TableHeader>
                        <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                          <TableHead className="w-14 pl-4 font-semibold text-foreground">#</TableHead>
                          <TableHead className="font-semibold text-foreground">Candidate</TableHead>
                          <TableHead className="text-right font-semibold text-foreground">Score</TableHead>
                          <TableHead className="hidden font-semibold text-foreground sm:table-cell">
                            Scheduled
                          </TableHead>
                          <TableHead className="w-[100px] min-w-[100px] pr-4 text-right font-semibold text-foreground">
                            Report
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performance.topPerformers.map((row) => (
                          <TableRow
                            key={`${row.interviewId}-${row.rank}`}
                            className="group border-border transition-colors hover:bg-gradient-to-r hover:from-muted/40 hover:to-transparent"
                          >
                            <TableCell className="pl-4 align-middle">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-muted-foreground">
                                {row.rank}
                              </span>
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-sm font-bold text-white shadow-md shadow-primary/15 ring-2 ring-white"
                                  aria-hidden
                                >
                                  {memberInitials(
                                    row.name ?? undefined,
                                    row.email ?? undefined
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate font-semibold text-foreground">
                                    {row.name || row.email || row.clerkId}
                                  </div>
                                  {row.name && row.email ? (
                                    <div className="truncate text-xs text-muted-foreground">{row.email}</div>
                                  ) : null}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right align-middle">
                              <span className="inline-flex min-w-[3rem] justify-end rounded-full bg-muted/30 px-2.5 py-0.5 text-sm font-bold tabular-nums text-primary ring-1 ring-border">
                                {row.overallScore}
                              </span>
                            </TableCell>
                            <TableCell className="hidden align-middle text-sm text-muted-foreground sm:table-cell whitespace-nowrap">
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
                <p className="rounded-xl border border-[#7367F0]/20 bg-card px-4 py-3 text-sm text-muted-foreground shadow-card">
                  Interviews are scheduled — candidates have not started yet. Scores appear after they
                  finish and the report is generated.
                </p>
              ) : performance.interviewsStarted > 0 && performance.reportsCompleted === 0 ? (
                <p className="rounded-xl border border-[#7367F0]/20 bg-card px-4 py-3 text-sm text-muted-foreground shadow-card">
                  {performance.inProgress.length} interview
                  {performance.inProgress.length === 1 ? " has" : "s have"} started; overall scores
                  appear when processing finishes.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              Could not load performance data.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={instituteCardClass}>
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground">
              Interview rounds
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              {runsLoading
                ? "Loading scheduled rounds…"
                : scheduleRuns.length > 0
                  ? `${scheduleRuns.length} bulk schedule run${scheduleRuns.length === 1 ? "" : "s"} — open a round for scores and candidate detail.`
                  : "Schedule a round for everyone in this cohort."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {runsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-9 w-9 animate-spin text-[#7367F0]" />
            </div>
          ) : scheduleRuns.length === 0 ? (
            <div className="px-4 py-6 sm:px-6">
              <InstituteEmptyState
                icon={CalendarClock}
                title="No rounds yet"
                description={
                  <>
                    Use <span className="font-semibold text-foreground">Schedule for batch</span> to
                    create the first interview round for everyone in this cohort.
                  </>
                }
                action={
                  <Button
                    size="sm"
                    className={cn(institutePrimaryClass, "gap-2")}
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
                  <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-6 align-middle font-semibold text-foreground">
                      Role
                    </TableHead>
                    <TableHead className="align-middle font-semibold text-foreground">
                      Round
                    </TableHead>
                    <TableHead className="hidden align-middle font-semibold text-foreground sm:table-cell">
                      Scheduled
                    </TableHead>
                    <TableHead className="align-middle font-semibold text-foreground">
                      Candidates
                    </TableHead>
                    <TableHead className="hidden text-right align-middle font-semibold text-foreground md:table-cell">
                      Pass at
                    </TableHead>
                    <TableHead className="w-[88px] min-w-[88px] pr-6 text-right align-middle font-semibold text-foreground">
                      Open
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduleRuns.map((run) => (
                    <TableRow
                      key={run.runId}
                      className="group cursor-pointer border-border align-middle transition-colors hover:bg-muted/40"
                      onClick={() => router.push(runDetailHref(run.runId))}
                    >
                      <TableCell className="pl-6 align-middle">
                        <span className="font-semibold text-foreground">{run.role}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground align-middle">
                        {instituteScheduleRoundLabel(
                          (run.roundType as InstituteScheduleRoundType | null) ?? undefined,
                        )}
                      </TableCell>
                      <TableCell className="hidden align-middle whitespace-nowrap text-sm text-foreground sm:table-cell">
                        {new Date(run.scheduledAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {run.candidateCount}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-right align-middle tabular-nums md:table-cell">
                        {run.passingScore != null ? `${run.passingScore}` : "—"}
                      </TableCell>
                      <TableCell
                        className="w-[88px] min-w-[88px] pr-6 text-right align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(instituteSecondaryClass, "h-8 w-8 shrink-0 p-0")}
                          asChild
                          title="Open round"
                          aria-label={`Open ${run.role} round`}
                        >
                          <Link href={runDetailHref(run.runId)}>
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

      <Dialog open={addUsersOpen} onOpenChange={setAddUsersOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/80 sm:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Add users</DialogTitle>
            <DialogDescription>
              Add people who are already in your institution to this batch.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-2 sm:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-muted/20/40 p-4">
              <h4 className="text-sm font-bold text-foreground">Add by email</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Paste one or many emails (comma, space, or newline). Only users already in your
                institution are added.
              </p>
              <textarea
                className="mt-2 min-h-[88px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
            <div className="rounded-xl border border-border/80 bg-muted/20/40 p-4 sm:border-l-0">
              <h4 className="text-sm font-bold text-foreground">Import CSV</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Any column with email addresses works — we extract all addresses from the file.
              </p>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-card px-4 py-8 transition hover:border-border hover:bg-muted/30">
                <Upload className="mb-2 h-8 w-8 text-primary/70" />
                <span className="text-sm font-semibold text-foreground">Choose CSV file</span>
                <span className="mt-1 text-xs text-muted-foreground">Drop or click to upload</span>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  className="hidden"
                  onChange={(e) => handleCsv(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div className="sm:col-span-2">
              <div className="rounded-xl border border-border bg-gradient-to-br from-muted/40 to-card p-4">
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Search className="h-4 w-4 text-primary" />
                  Search candidates
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Find users in your institution by name or email and add them to this batch
                </p>
                <Input
                  className="mt-2 h-11 border-border shadow-sm"
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
                          <span className="font-semibold text-foreground">{u.name}</span>
                          <span className="text-muted-foreground"> · {u.email}</span>
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
                  <p className="mt-3 text-sm text-muted-foreground">No matches (or already in batch)</p>
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
          if (open && batch) {
            setEditName(batch.name || "");
            setEditMaxStudents(
              batch.maxStudents != null ? String(batch.maxStudents) : "",
            );
            setEditStartDate(
              batch.startDate ? String(batch.startDate).slice(0, 10) : "",
            );
            setEditEndDate(
              batch.endDate ? String(batch.endDate).slice(0, 10) : "",
            );
          }
        }}
      >
        <DialogContent className="border-border/80 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit batch</DialogTitle>
            <DialogDescription>
              Update batch name, capacity, and cohort dates. Names must be unique within your
              institution (case-insensitive).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <FormField label="Batch name" htmlFor="dlg-bn" required className="sm:col-span-2">
              <Input
                id="dlg-bn"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-11 border-border shadow-sm"
                placeholder="e.g. Placement batch Jan 2026"
              />
            </FormField>
            <FormField
              label="Max students"
              htmlFor="dlg-max"
              hint="Optional cap for roster size"
            >
              <Input
                id="dlg-max"
                type="number"
                min={0}
                value={editMaxStudents}
                onChange={(e) => setEditMaxStudents(e.target.value)}
                className="h-11 border-border shadow-sm"
                placeholder="No limit"
              />
            </FormField>
            <FormField label="Start date" htmlFor="dlg-start">
              <Input
                id="dlg-start"
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="h-11 border-border shadow-sm"
              />
            </FormField>
            <FormField label="End date" htmlFor="dlg-end">
              <Input
                id="dlg-end"
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="h-11 border-border shadow-sm"
              />
            </FormField>
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
              disabled={savingName || !editName.trim() || !instituteRoleCanManageBatches(profile?.accessRole)}
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

      <Card className={instituteCardClass}>
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold text-foreground">Members</CardTitle>
              <CardDescription className="mt-1 text-sm">
                {members.length > 0
                  ? `${members.length} ${members.length === 1 ? "person" : "people"} in this cohort — open reports or remove from the batch.`
                  : "Add people from your institution to schedule interviews for the whole batch."}
              </CardDescription>
            </div>
            {members.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                className={cn(instituteSecondaryClass, "h-10 shrink-0 gap-2")}
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
                    className={cn(institutePrimaryClass, "gap-2")}
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
                  <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-6 align-middle font-semibold text-foreground">
                      Candidate
                    </TableHead>
                    <TableHead className="w-[120px] min-w-[120px] text-right align-middle font-semibold text-foreground">
                      Reports
                    </TableHead>
                    <TableHead className="w-[100px] min-w-[100px] pr-6 text-right align-middle font-semibold text-foreground">
                      Remove
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow
                      key={m.clerkId}
                      className="group border-border align-middle transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="pl-6 align-middle">
                        <div className="flex items-center gap-3 py-0.5">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-sm font-bold text-white shadow-md shadow-primary/15 ring-2 ring-white"
                            aria-hidden
                          >
                            {memberInitials(m.name, m.email)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-foreground">{m.name}</div>
                            <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right align-middle">
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(instituteSecondaryClass, "h-8 w-8 shrink-0 p-0")}
                          asChild
                          title="Open reports"
                          aria-label={`Open reports for ${m.name || m.email}`}
                        >
                          <Link
                            href={`/dashboard/institute/${institutionId}/candidates/${encodeURIComponent(m.clerkId)}/reports`}
                          >
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

      <Dialog
        open={bulkOpen}
        onOpenChange={(o) => {
          if (!o) closeBulkDialog();
        }}
      >
        <DialogContent
          className="max-h-[90vh] gap-4 overflow-y-auto border-border/80 sm:max-w-xl"
          {...dialogPortaledPickerHandlers}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Bulk schedule interviews</DialogTitle>
            <DialogDescription>
              Same 3-step flow as institute scheduling: timing and type, role context, then
              interview content. Creates one schedule per member (saved resume required to start).
            </DialogDescription>
          </DialogHeader>

          <InstituteBatchScheduleWizardForm
            idPrefix="bulk"
            wizardStep={bulkWizardStep}
            disabled={bulkSubmitting}
            fixedBatch={bulkBatchSummary}
            batchSummary={bulkBatchSummary}
            roundType={schRoundType}
            onRoundTypeChange={setSchRoundType}
            scheduleAt={schAt}
            onScheduleAtChange={setSchAt}
            expiresAt={schExpires}
            onExpiresAtChange={setSchExpires}
            role={schRole}
            onRoleChange={setSchRole}
            experience={schExp}
            onExperienceChange={setSchExp}
            company={schCo}
            onCompanyChange={setSchCo}
            jobDescription={schJobDescription}
            onJobDescriptionChange={setSchJobDescription}
            maxJobDescriptionChars={MAX_JOB_DESCRIPTION_CHARS}
            duration={schDur}
            onDurationChange={setSchDur}
            questionsText={schQuestionsText}
            onQuestionsTextChange={setSchQuestionsText}
            passingScore={schPassingScore}
            onPassingScoreChange={setSchPassingScore}
            codingProblemIds={schCodingProblemIds}
            onCodingProblemIdsChange={setSchCodingProblemIds}
            systemDesignProblemId={schSystemDesignProblemId}
            onSystemDesignProblemIdChange={setSchSystemDesignProblemId}
          />

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className={instituteSecondaryClass}
                onClick={closeBulkDialog}
                disabled={bulkSubmitting}
              >
                Cancel
              </Button>
              {bulkWizardStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  className={instituteSecondaryClass}
                  onClick={goBulkWizardBack}
                  disabled={bulkSubmitting}
                >
                  Back
                </Button>
              ) : null}
            </div>
            {bulkWizardStep < INSTITUTE_BATCH_SCHEDULE_WIZARD_STEPS.length ? (
              <Button
                type="button"
                onClick={goBulkWizardNext}
                disabled={bulkSubmitting}
                className={cn(institutePrimaryClass, "w-full sm:w-auto")}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void handleBulkSchedule()}
                disabled={
                  bulkSubmitting ||
                  bulkMemberCount === 0 ||
                  !schAt ||
                  !schRole.trim()
                }
                className={cn(institutePrimaryClass, "w-full sm:w-auto shadow-md")}
              >
                {bulkSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : bulkMemberCount > 0 ? (
                  `Schedule ${bulkMemberCount} interview${bulkMemberCount === 1 ? "" : "s"}`
                ) : (
                  "Schedule for all"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
