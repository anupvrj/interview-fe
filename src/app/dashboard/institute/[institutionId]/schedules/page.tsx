"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  canViewInstitutePage,
  instituteRoleCanManageBatches,
} from "@/lib/institute-access";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/FormField";
import { SearchInput } from "@/components/app/SearchInput";
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
import { Loader2, CalendarClock, ChevronRight, Layers, Users } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { userApi, adminApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/api-errors";
import { dialogPortaledPickerHandlers } from "@/lib/dialog-portaled-picker-handlers";
import { cn, parseQuestionLines, toDatetimeLocalValue } from "@/lib/utils";
import {
  InstituteEmptyState,
  InstituteLoader,
  InstituteTableShell,
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { InstituteSchedulesHero } from "@/components/institute/InstituteSchedulesHero";

const MAX_JOB_DESCRIPTION_CHARS = 32000;

type BatchScheduleRunRow = {
  batchId: string;
  batchName: string;
  runId: string;
  role: string;
  roundType: string | null;
  scheduledAt: string;
  expiresAt: string | null;
  passingScore: number | null;
  candidateCount: number;
  pendingCount: number;
  createdAt: string;
  scheduleGroupId: string | null;
};

type InstitutionBatchRow = {
  _id: string;
  name?: string;
  memberClerkIds?: string[];
};

function batchInitials(name: string | undefined): string {
  const n = (name || "").trim();
  if (!n) return "B";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
  }
  return n.slice(0, 2).toUpperCase();
}

export default function InstituteSchedulesPage() {
  const params = useParams();
  const router = useRouter();
  const institutionId = params.institutionId as string;
  const [profile, setProfile] = useState<any>(null);
  const [batchRuns, setBatchRuns] = useState<BatchScheduleRunRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [listSearch, setListSearch] = useState("");
  const [scheduledFrom, setScheduledFrom] = useState("");
  const [scheduledTo, setScheduledTo] = useState("");

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [institutionBatches, setInstitutionBatches] = useState<InstitutionBatchRow[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [scheduleRole, setScheduleRole] = useState("");
  const [scheduleExperience, setScheduleExperience] = useState("2");
  const [scheduleCompany, setScheduleCompany] = useState("");
  const [scheduleDuration, setScheduleDuration] = useState<"15" | "30">("15");
  const [scheduleQuestionsText, setScheduleQuestionsText] = useState("");
  const [schedulePassingScore, setSchedulePassingScore] = useState("");
  const [scheduleExpiresAt, setScheduleExpiresAt] = useState("");
  const [scheduleJobDescription, setScheduleJobDescription] = useState("");
  const [scheduleRoundType, setScheduleRoundType] =
    useState<InstituteScheduleRoundType>("ai_mock");
  const [scheduleCodingProblemIds, setScheduleCodingProblemIds] = useState<string[]>([]);
  const [scheduleSystemDesignProblemId, setScheduleSystemDesignProblemId] =
    useState("");
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleWizardStep, setScheduleWizardStep] = useState(1);

  const load = useCallback(async () => {
    try {
      const { runs } = await adminApi.listInstitutionBatchScheduleRuns(institutionId);
      setBatchRuns(Array.isArray(runs) ? runs : []);
    } catch (e) {
      console.error(e);
      setBatchRuns([]);
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    userApi
      .getMyProfile()
      .then((p) => {
        setProfile(p);
        if (!canViewInstitutePage(p, institutionId, "schedules")) {
          router.replace("/dashboard");
        }
      })
      .catch(() => router.replace("/dashboard"));
  }, [institutionId, router]);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    load();
  }, [profile, load]);

  useEffect(() => {
    if (!scheduleDialogOpen || !profile) return;
    let cancelled = false;
    (async () => {
      try {
        setBatchesLoading(true);
        const list = await adminApi.listBatches(institutionId);
        if (!cancelled) {
          setInstitutionBatches(Array.isArray(list) ? list : []);
        }
      } catch {
        if (!cancelled) setInstitutionBatches([]);
      } finally {
        if (!cancelled) setBatchesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scheduleDialogOpen, profile, institutionId]);

  const filteredBatches = useMemo(() => {
    const q = batchSearch.trim().toLowerCase();
    const sorted = [...institutionBatches].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }),
    );
    if (!q) return sorted;
    return sorted.filter((b) => (b.name || "").toLowerCase().includes(q));
  }, [institutionBatches, batchSearch]);

  const selectedBatch = useMemo(
    () =>
      selectedBatchId
        ? institutionBatches.find((b) => String(b._id) === selectedBatchId) ?? null
        : null,
    [institutionBatches, selectedBatchId],
  );

  const selectedBatchMemberCount = selectedBatch?.memberClerkIds?.length ?? 0;

  const openScheduleDialog = () => {
    setSelectedBatchId(null);
    setBatchSearch("");
    setInstitutionBatches([]);
    setScheduleRole("");
    setScheduleExperience("2");
    setScheduleCompany("");
    setScheduleDuration("15");
    setScheduleQuestionsText("");
    setSchedulePassingScore("");
    setScheduleJobDescription("");
    setScheduleRoundType("ai_mock");
    setScheduleCodingProblemIds([]);
    setScheduleSystemDesignProblemId("");
    setScheduleWizardStep(1);
    const t = new Date();
    t.setDate(t.getDate() + 1);
    t.setHours(10, 0, 0, 0);
    setScheduleAt(toDatetimeLocalValue(t));
    setScheduleExpiresAt("");
    setScheduleDialogOpen(true);
  };

  const validateScheduleWizardStep = (step: number): boolean =>
    validateInstituteBatchScheduleWizardStep(step, {
      memberCount: selectedBatchMemberCount,
      hasSelectedBatch: !!selectedBatchId,
      scheduleAt,
      role: scheduleRole,
      roundType: scheduleRoundType,
      codingProblemIds: scheduleCodingProblemIds,
      systemDesignProblemId: scheduleSystemDesignProblemId,
    });

  const goScheduleWizardNext = () => {
    if (!validateScheduleWizardStep(scheduleWizardStep)) return;
    setScheduleWizardStep((s) =>
      Math.min(s + 1, INSTITUTE_BATCH_SCHEDULE_WIZARD_STEPS.length),
    );
  };

  const goScheduleWizardBack = () => {
    setScheduleWizardStep((s) => Math.max(s - 1, 1));
  };

  const closeScheduleDialog = () => {
    setScheduleDialogOpen(false);
    setSelectedBatchId(null);
    setBatchSearch("");
    setScheduleJobDescription("");
    setScheduleWizardStep(1);
  };

  const handleCreateSchedule = async () => {
    if (!selectedBatchId || !profile || !scheduleRole.trim() || !scheduleAt) return;
    if (selectedBatchMemberCount === 0) {
      toast.error("Batch has no members", {
        description: "Add candidates to this batch before scheduling.",
      });
      return;
    }
    const exp = Number.parseInt(scheduleExperience, 10);
    if (!Number.isFinite(exp) || exp < 0) {
      toast.error("Enter a valid years of experience (0 or more).");
      return;
    }
    let passingScorePayload: number | undefined;
    if (schedulePassingScore.trim()) {
      const ps = Number.parseFloat(schedulePassingScore.trim());
      if (!Number.isFinite(ps) || ps < 0 || ps > 100) {
        toast.error("Passing score must be a number from 0 to 100.");
        return;
      }
      passingScorePayload = ps;
    }
    const jd = scheduleJobDescription.trim();
    if (jd.length > MAX_JOB_DESCRIPTION_CHARS) {
      toast.error("Job description is too long", {
        description: `Use at most ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters (you have ${jd.length.toLocaleString()}).`,
      });
      return;
    }
    const roundErr = validateInstituteScheduleRound(
      scheduleRoundType,
      scheduleCodingProblemIds,
      scheduleSystemDesignProblemId,
    );
    if (roundErr) {
      toast.error(roundErr);
      return;
    }
    const customQs = parseQuestionLines(scheduleQuestionsText);
    try {
      setScheduleSubmitting(true);
      const result = await adminApi.bulkScheduleBatchInterviews(selectedBatchId, {
        scheduledAt: new Date(scheduleAt).toISOString(),
        ...(scheduleExpiresAt.trim()
          ? { expiresAt: new Date(scheduleExpiresAt).toISOString() }
          : {}),
        role: scheduleRole.trim(),
        experience: exp,
        language: "en",
        targetCompany: scheduleCompany.trim() || undefined,
        interviewDuration: scheduleDuration === "30" ? 30 : 15,
        ...(passingScorePayload !== undefined ? { passingScore: passingScorePayload } : {}),
        ...(jd ? { jobDescription: jd } : {}),
        ...buildInstituteScheduleRoundApiFields(scheduleRoundType, {
          customQuestions: customQs,
          codingProblemIds: scheduleCodingProblemIds,
          systemDesignProblemId: scheduleSystemDesignProblemId,
        }),
      });
      const failLines =
        result.failures?.length > 0
          ? result.failures
              .slice(0, 8)
              .map((f) => f.error)
              .join(" · ")
          : "";
      const batchLabel = selectedBatch?.name?.trim() || "Batch";
      if (result.created === result.total && !failLines) {
        toast.success(`Scheduled ${result.created} interview${result.created === 1 ? "" : "s"}`, {
          description: `Everyone in “${batchLabel}” now has this interview on their dashboard.`,
        });
      } else {
        toast.warning(
          `Scheduled ${result.created} of ${result.total} in “${batchLabel}”`,
          { description: failLines || undefined, duration: failLines ? 10000 : 5000 },
        );
      }
      closeScheduleDialog();
      load();
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, "Failed to schedule interview"));
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const filteredRuns = useMemo(() => {
    let list = batchRuns;
    const q = listSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((run) => {
        const batch = run.batchName.toLowerCase();
        const role = run.role.toLowerCase();
        return batch.includes(q) || role.includes(q);
      });
    }
    if (scheduledFrom.trim()) {
      const fromMs = new Date(scheduledFrom).getTime();
      if (!Number.isNaN(fromMs)) {
        list = list.filter((run) => new Date(run.scheduledAt).getTime() >= fromMs);
      }
    }
    if (scheduledTo.trim()) {
      const toMs = new Date(scheduledTo).getTime();
      if (!Number.isNaN(toMs)) {
        list = list.filter((run) => new Date(run.scheduledAt).getTime() <= toMs);
      }
    }
    return list;
  }, [batchRuns, listSearch, scheduledFrom, scheduledTo]);

  const hasActiveFilters =
    listSearch.trim() !== "" ||
    scheduledFrom.trim() !== "" ||
    scheduledTo.trim() !== "";

  const pendingInterviewTotal = useMemo(
    () => batchRuns.reduce((sum, run) => sum + run.pendingCount, 0),
    [batchRuns],
  );

  const runDetailHref = (run: BatchScheduleRunRow) =>
    `/dashboard/institute/${institutionId}/batches/${run.batchId}/runs/${encodeURIComponent(run.runId)}`;

  if (!profile) {
    return <InstituteLoader />;
  }

  const canScheduleBatch = instituteRoleCanManageBatches(profile.accessRole);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <InstituteSchedulesHero
        roundCount={batchRuns.length}
        pendingInterviewCount={pendingInterviewTotal}
        loading={loading}
      />

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold text-foreground">
                Schedule directory
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {!loading && batchRuns.length > 0
                  ? hasActiveFilters
                    ? `${filteredRuns.length} of ${batchRuns.length} batch round${batchRuns.length === 1 ? "" : "s"} match your filters.`
                    : "Each row is one batch interview round — open it to see every candidate, scores, and edit or cancel the run."
                  : "Schedule interviews for a batch; each member gets their own slot under that round."}
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:min-w-[min(100%,32rem)] lg:flex-1 lg:max-w-2xl">
              <SearchInput
                id="sch-filter-batch"
                leadingIcon={Layers}
                placeholder="Search batch or role…"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                containerClassName="max-w-none w-full min-w-0 flex-1 border-border bg-card shadow-sm"
              />
              {canScheduleBatch ? (
                <Button
                  type="button"
                  onClick={openScheduleDialog}
                  className={cn(institutePrimaryClass, "h-11 shrink-0 gap-2 sm:w-auto")}
                >
                  <CalendarClock className="h-4 w-4" />
                  Schedule batch
                </Button>
              ) : null}
            </div>
          </div>
          {!loading && batchRuns.length > 0 ? (
            <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
              <Input
                id="sch-filter-from"
                type="datetime-local"
                aria-label="Scheduled from"
                value={scheduledFrom}
                onChange={(e) => setScheduledFrom(e.target.value)}
                className="h-11 w-full min-w-0 border-border bg-card shadow-sm sm:max-w-[220px]"
              />
              <Input
                id="sch-filter-to"
                type="datetime-local"
                aria-label="Scheduled to"
                value={scheduledTo}
                onChange={(e) => setScheduledTo(e.target.value)}
                className="h-11 w-full min-w-0 border-border bg-card shadow-sm sm:max-w-[220px]"
              />
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  className={cn(instituteSecondaryClass, "h-11 shrink-0")}
                  onClick={() => {
                    setListSearch("");
                    setScheduledFrom("");
                    setScheduledTo("");
                  }}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-9 w-9 animate-spin text-[#7367F0]" />
            </div>
          ) : batchRuns.length === 0 ? (
            <div className="px-4 py-6 sm:px-6">
              <InstituteEmptyState
                icon={CalendarClock}
                title="No pending batch rounds"
                description="Use Schedule batch to create an interview round for everyone in a cohort."
                action={
                  canScheduleBatch ? (
                    <Button
                      onClick={openScheduleDialog}
                      className={cn(institutePrimaryClass, "gap-2")}
                    >
                      <CalendarClock className="h-4 w-4" />
                      Schedule batch
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="px-4 py-6 sm:px-6">
              <InstituteEmptyState
                icon={CalendarClock}
                title="No matches"
                description="Try a different batch name, role, or adjust the scheduled date range."
                action={
                  <Button
                    variant="outline"
                    className={instituteSecondaryClass}
                    onClick={() => {
                      setListSearch("");
                      setScheduledFrom("");
                      setScheduledTo("");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <InstituteTableShell>
              <Table className="w-full min-w-[880px]">
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-6 font-semibold text-foreground">Batch</TableHead>
                    <TableHead className="font-semibold text-foreground">Role</TableHead>
                    <TableHead className="font-semibold text-foreground">Round</TableHead>
                    <TableHead className="font-semibold text-foreground">Scheduled</TableHead>
                    <TableHead className="font-semibold text-foreground">Expire by</TableHead>
                    <TableHead className="font-semibold text-foreground">Candidates</TableHead>
                    <TableHead className="w-[88px] min-w-[88px] pr-6 text-right font-semibold text-foreground">
                      Open
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRuns.map((run) => (
                    <TableRow
                      key={`${run.batchId}-${run.runId}`}
                      className="group cursor-pointer border-border align-middle transition-colors hover:bg-muted/40"
                      onClick={() => router.push(runDetailHref(run))}
                    >
                      <TableCell className="pl-6 align-middle">
                        <div className="flex items-center gap-3 py-2">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-sm font-bold text-white shadow-md shadow-primary/15 ring-2 ring-white"
                            aria-hidden
                          >
                            {batchInitials(run.batchName)}
                          </div>
                          <p className="min-w-0 max-w-[200px] truncate font-semibold text-foreground">
                            {run.batchName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate align-middle font-medium text-foreground">
                        {run.role}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground align-middle">
                        {instituteScheduleRoundLabel(
                          (run.roundType as InstituteScheduleRoundType | null) ?? undefined,
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-foreground align-middle">
                        {new Date(run.scheduledAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground align-middle">
                        {run.expiresAt ? new Date(run.expiresAt).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {run.pendingCount}/{run.candidateCount}
                        </span>
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
                          title="Open batch round"
                          aria-label={`Open ${run.batchName} round`}
                        >
                          <Link href={runDetailHref(run)}>
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

      <Dialog
        open={scheduleDialogOpen}
        onOpenChange={(o) => {
          if (!o) closeScheduleDialog();
        }}
      >
        <DialogContent
          className="max-h-[90vh] gap-4 overflow-y-auto border-border/80 sm:max-w-xl"
          {...dialogPortaledPickerHandlers}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Schedule batch interviews</DialogTitle>
            <DialogDescription>
              Choose batch and timing, set role context, then pick interview content. Each member
              gets their own schedule (saved resume required to start).
            </DialogDescription>
          </DialogHeader>

          <InstituteBatchScheduleWizardForm
            idPrefix="inst-sch"
            wizardStep={scheduleWizardStep}
            disabled={scheduleSubmitting}
            batchSummary={
              selectedBatch
                ? {
                    name: selectedBatch.name?.trim() || "Untitled batch",
                    memberCount: selectedBatchMemberCount,
                  }
                : null
            }
            batchPicker={
              <FormField
                label="Batch"
                htmlFor="inst-sch-batch-search"
                required
                hint={
                  selectedBatch
                    ? `${selectedBatchMemberCount} member${selectedBatchMemberCount === 1 ? "" : "s"} will be scheduled.`
                    : "Type a batch name to search — matches appear below."
                }
              >
                <SearchInput
                  id="inst-sch-batch-search"
                  placeholder="Search batches by name…"
                  value={batchSearch}
                  onChange={(e) => {
                    setBatchSearch(e.target.value);
                    setSelectedBatchId(null);
                  }}
                  disabled={batchesLoading || scheduleSubmitting}
                  containerClassName="max-w-none w-full border-border bg-card shadow-sm"
                />
                {batchesLoading ? (
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading batches…
                  </p>
                ) : institutionBatches.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No batches yet.{" "}
                    <Link
                      href={`/dashboard/institute/${institutionId}/batches`}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Create a batch
                    </Link>{" "}
                    and add members first.
                  </p>
                ) : selectedBatch ? (
                  <p className="mt-2 rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-sm text-foreground">
                    Selected:{" "}
                    <span className="font-medium">
                      {selectedBatch.name?.trim() || "Untitled batch"}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {selectedBatchMemberCount} member
                      {selectedBatchMemberCount === 1 ? "" : "s"}
                    </span>
                  </p>
                ) : batchSearch.trim().length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Start typing to find a batch.
                  </p>
                ) : filteredBatches.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No batches match your search.
                  </p>
                ) : (
                  <ul className="mt-2 max-h-44 overflow-y-auto rounded-md border border-border bg-card">
                    {filteredBatches.map((b) => {
                      const id = String(b._id);
                      const count = b.memberClerkIds?.length ?? 0;
                      const selected = selectedBatchId === id;
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/30",
                              selected &&
                                "bg-primary/5 ring-1 ring-inset ring-primary/20",
                            )}
                            onClick={() => setSelectedBatchId(id)}
                          >
                            <span className="min-w-0 truncate font-medium text-foreground">
                              {b.name?.trim() || "Untitled batch"}
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {count} member{count === 1 ? "" : "s"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </FormField>
            }
            roundType={scheduleRoundType}
            onRoundTypeChange={setScheduleRoundType}
            scheduleAt={scheduleAt}
            onScheduleAtChange={setScheduleAt}
            expiresAt={scheduleExpiresAt}
            onExpiresAtChange={setScheduleExpiresAt}
            role={scheduleRole}
            onRoleChange={setScheduleRole}
            experience={scheduleExperience}
            onExperienceChange={setScheduleExperience}
            company={scheduleCompany}
            onCompanyChange={setScheduleCompany}
            jobDescription={scheduleJobDescription}
            onJobDescriptionChange={setScheduleJobDescription}
            maxJobDescriptionChars={MAX_JOB_DESCRIPTION_CHARS}
            duration={scheduleDuration}
            onDurationChange={setScheduleDuration}
            questionsText={scheduleQuestionsText}
            onQuestionsTextChange={setScheduleQuestionsText}
            passingScore={schedulePassingScore}
            onPassingScoreChange={setSchedulePassingScore}
            codingProblemIds={scheduleCodingProblemIds}
            onCodingProblemIdsChange={setScheduleCodingProblemIds}
            systemDesignProblemId={scheduleSystemDesignProblemId}
            onSystemDesignProblemIdChange={setScheduleSystemDesignProblemId}
          />
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={closeScheduleDialog}
                disabled={scheduleSubmitting}
              >
                Cancel
              </Button>
              {scheduleWizardStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  className={instituteSecondaryClass}
                  onClick={goScheduleWizardBack}
                  disabled={scheduleSubmitting}
                >
                  Back
                </Button>
              ) : null}
            </div>
            {scheduleWizardStep < INSTITUTE_BATCH_SCHEDULE_WIZARD_STEPS.length ? (
              <Button
                type="button"
                onClick={goScheduleWizardNext}
                disabled={scheduleSubmitting}
                className={cn(institutePrimaryClass, "w-full sm:w-auto")}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  if (!validateScheduleWizardStep(3)) {
                    setScheduleWizardStep(3);
                    return;
                  }
                  void handleCreateSchedule();
                }}
                disabled={
                  scheduleSubmitting ||
                  !selectedBatchId ||
                  selectedBatchMemberCount === 0 ||
                  !scheduleRole.trim() ||
                  !scheduleAt
                }
                className={cn(institutePrimaryClass, "w-full sm:w-auto")}
              >
                {scheduleSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : selectedBatchMemberCount > 0 ? (
                  `Schedule ${selectedBatchMemberCount} interview${selectedBatchMemberCount === 1 ? "" : "s"}`
                ) : (
                  "Schedule batch"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
