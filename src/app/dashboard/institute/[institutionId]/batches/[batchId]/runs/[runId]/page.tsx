"use client";

import { useCallback, useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Pencil, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { parseQuestionLines, toDatetimeLocalValue } from "@/lib/utils";
import { JobRoleSelect } from "@/components/career/JobRoleSelect";
import {
  canViewInstitutePage,
  instituteRoleCanManageBatches,
} from "@/lib/institute-access";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Trophy,
  ExternalLink,
  Users,
  CalendarClock,
  BarChart3,
  UserCheck,
  FileCheck,
} from "lucide-react";
import { userApi, adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  InstituteLoader,
  InstitutePageHeader,
  InstituteStatCard,
  InstituteTableShell,
  institutePanelClass,
} from "@/components/institute/InstituteChrome";

export default function BatchScheduleRunPage({
  params,
}: {
  params: Promise<{
    institutionId: string;
    batchId: string;
    runId: string;
  }>;
}) {
  const { institutionId, batchId, runId: runIdParam } = use(params);
  const runId = decodeURIComponent(runIdParam);
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<
    ReturnType<typeof adminApi.getBatchScheduleRunDetail>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [editAt, setEditAt] = useState("");
  const [editExpires, setEditExpires] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editExp, setEditExp] = useState("2");
  const [editPassing, setEditPassing] = useState("");
  const [editDuration, setEditDuration] = useState<"15" | "30">("15");
  const [editQuestions, setEditQuestions] = useState("");
  const [batchMembers, setBatchMembers] = useState<
    { clerkId: string; name: string; email: string }[]
  >([]);
  const [addClerkId, setAddClerkId] = useState("");

  const canManage = instituteRoleCanManageBatches(profile?.accessRole);

  const loadRun = useCallback(async () => {
    try {
      setLoading(true);
      const d = await adminApi.getBatchScheduleRunDetail(batchId, runId);
      setData(d);
      setError(null);
    } catch (e: unknown) {
      setData(null);
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not load this run.",
      );
    } finally {
      setLoading(false);
    }
  }, [batchId, runId]);

  useEffect(() => {
    userApi.getMyProfile().then(setProfile).catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (!canViewInstitutePage(profile, institutionId, "batches")) {
      router.replace("/dashboard");
      return;
    }
    loadRun();
  }, [profile, institutionId, batchId, runId, router, loadRun]);

  useEffect(() => {
    if (!canManage || !batchId) return;
    adminApi
      .getBatch(batchId)
      .then((b) => {
        setBatchMembers(Array.isArray(b.members) ? b.members : []);
      })
      .catch(() => setBatchMembers([]));
  }, [batchId, canManage]);

  const membersNotInRun = useMemo(() => {
    if (!data) return batchMembers;
    const scheduled = new Set(data.participants.map((p) => p.clerkId));
    return batchMembers.filter((m) => !scheduled.has(m.clerkId));
  }, [batchMembers, data]);

  const openEdit = () => {
    if (!data) return;
    setEditAt(toDatetimeLocalValue(new Date(data.scheduledAt)));
    setEditExpires("");
    setEditRole(data.role || "");
    setEditPassing(data.passingScore != null ? String(data.passingScore) : "");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editRole.trim() || !editAt) return;
    const exp = Number.parseInt(editExp, 10);
    if (!Number.isFinite(exp) || exp < 0) {
      toast.error("Enter valid years of experience (0 or more).");
      return;
    }
    let passing: number | null | undefined;
    if (editPassing.trim()) {
      const ps = Number.parseFloat(editPassing.trim());
      if (!Number.isFinite(ps) || ps < 0 || ps > 100) {
        toast.error("Passing score must be between 0 and 100.");
        return;
      }
      passing = ps;
    } else {
      passing = null;
    }
    const qLines = parseQuestionLines(editQuestions);
    try {
      setEditSubmitting(true);
      await adminApi.updateBatchScheduleRun(batchId, runId, {
        scheduledAt: new Date(editAt).toISOString(),
        ...(editExpires.trim()
          ? { expiresAt: new Date(editExpires).toISOString() }
          : {}),
        role: editRole.trim(),
        experience: exp,
        interviewDuration: editDuration === "30" ? 30 : 15,
        customQuestions: qLines.length > 0 ? qLines : null,
        passingScore: passing,
      });
      toast.success("Round updated");
      setEditOpen(false);
      await loadRun();
    } catch (e: unknown) {
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update round",
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!addClerkId) return;
    try {
      setAddSubmitting(true);
      await adminApi.addBatchRunParticipant(batchId, runId, addClerkId);
      toast.success("Participant added to this round");
      setAddOpen(false);
      setAddClerkId("");
      await loadRun();
    } catch (e: unknown) {
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to add participant",
      );
    } finally {
      setAddSubmitting(false);
    }
  };

  if (!profile || loading) {
    return <InstituteLoader />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/dashboard/institute/${institutionId}/batches/${batchId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to batch
          </Link>
        </Button>
        <p className="text-sm text-red-600">{error || "Not found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-2 w-fit text-muted-foreground hover:text-foreground"
      >
        <Link href={`/dashboard/institute/${institutionId}/batches/${batchId}`}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to batch
        </Link>
      </Button>

      <InstitutePageHeader
        title={data.role}
        description={
          <>
            Scheduled for {new Date(data.scheduledAt).toLocaleString()}
            {data.passingScore != null ? (
              <>
                {" "}
                · Pass threshold <span className="font-semibold text-foreground">{data.passingScore}</span>
                /100
              </>
            ) : null}
          </>
        }
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={openEdit}
              >
                <Pencil className="h-4 w-4" />
                Edit round
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                onClick={() => setAddOpen(true)}
                disabled={membersNotInRun.length === 0}
              >
                <UserPlus className="h-4 w-4" />
                Add late joiner
              </Button>
            </div>
          ) : null
        }
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit scheduled round</DialogTitle>
            <DialogDescription>
              Updates apply to all pending schedules in this bulk run. Candidates can be notified
              automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label htmlFor="run-at">Scheduled time</Label>
              <Input
                id="run-at"
                type="datetime-local"
                value={editAt}
                onChange={(e) => setEditAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="run-exp">Expires (optional)</Label>
              <Input
                id="run-exp"
                type="datetime-local"
                value={editExpires}
                onChange={(e) => setEditExpires(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="run-role">Role / position</Label>
              <JobRoleSelect
                id="run-role"
                value={editRole}
                onChange={setEditRole}
                placeholder="e.g. Software Engineer, Product Manager"
                inputClassName="mt-1 h-11 w-full border-border bg-card shadow-sm"
                className="mt-1"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="run-exp-y">Experience (years)</Label>
                <Input
                  id="run-exp-y"
                  value={editExp}
                  onChange={(e) => setEditExp(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="run-pass">Passing score</Label>
                <Input
                  id="run-pass"
                  value={editPassing}
                  onChange={(e) => setEditPassing(e.target.value)}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Duration</Label>
              <Select
                value={editDuration}
                onValueChange={(v) => setEditDuration(v === "30" ? "30" : "15")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="run-q">Custom questions (one per line)</Label>
              <textarea
                id="run-q"
                className="mt-1 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editQuestions}
                onChange={(e) => setEditQuestions(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={editSubmitting}>
              {editSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add batch member to round</DialogTitle>
            <DialogDescription>
              Creates a schedule for a batch member who was not in the original bulk run.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Candidate</Label>
            <Select value={addClerkId} onValueChange={setAddClerkId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {membersNotInRun.map((m) => (
                  <SelectItem key={m.clerkId} value={m.clerkId}>
                    {m.name || m.email || m.clerkId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddParticipant} disabled={addSubmitting || !addClerkId}>
              {addSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InstituteStatCard icon={CalendarClock} label="Total scheduled" value={data.totalScheduled} />
        <InstituteStatCard
          icon={UserCheck}
          label="Interviews attended"
          value={data.interviewsStarted}
          footer="started (at least once)"
        />
        <InstituteStatCard icon={FileCheck} label="Reports completed" value={data.reportsCompleted} />
        <InstituteStatCard
          icon={BarChart3}
          label="Passed / failed"
          value={
            data.gradedWithThreshold > 0 ? (
              <>
                {data.totalPassed} / {data.totalFailed}
              </>
            ) : (
              "—"
            )
          }
          footer={
            data.gradedWithThreshold > 0
              ? "vs pass threshold"
              : "Set passing score on schedule to grade"
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InstituteStatCard
          icon={BarChart3}
          label="Average score"
          value={
            data.averageScore != null ? (
              <>
                {data.averageScore.toFixed(1)}
                <span className="text-lg font-normal text-muted-foreground"> /100</span>
              </>
            ) : (
              "—"
            )
          }
        />
        <InstituteStatCard
          icon={Trophy}
          label="Highest score"
          value={
            data.highestScore != null ? (
              <>
                {data.highestScore}
                <span className="text-lg font-normal text-muted-foreground"> /100</span>
              </>
            ) : (
              "—"
            )
          }
        />
      </div>

      {data.topPerformers.length > 0 ? (
        <Card className={cn(institutePanelClass, "overflow-hidden shadow-xl")}>
          <CardHeader className="border-b border-border/60 bg-gradient-to-r from-amber-50/40 to-card pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-amber-600" />
              Top performers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <InstituteTableShell>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-14">#</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Report</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topPerformers.map((row) => (
                    <TableRow
                      key={`${row.interviewId}-${row.rank}`}
                      className="hover:bg-muted/40"
                    >
                      <TableCell className="font-medium text-muted-foreground">{row.rank}</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {row.name || row.email || row.clerkId}
                        </div>
                        {row.name && row.email ? (
                          <div className="text-xs text-muted-foreground">{row.email}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {row.overallScore}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 gap-1" asChild>
                          <Link
                            href={`/dashboard/institute/${institutionId}/candidates/${encodeURIComponent(row.clerkId)}/reports/${encodeURIComponent(row.interviewId)}`}
                          >
                            View
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </InstituteTableShell>
          </CardContent>
        </Card>
      ) : null}

      <Card className={cn(institutePanelClass, "overflow-hidden shadow-xl")}>
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/40 to-card">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Everyone in this round
          </CardTitle>
          <CardDescription>
            Status of each scheduled slot; scores appear after the interview is completed and the
            report is ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <InstituteTableShell>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                  <TableHead>Candidate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Pass</TableHead>
                  <TableHead className="text-right">Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.participants.map((p) => (
                  <TableRow key={p.scheduleId} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {p.name || p.email || p.clerkId}
                      </div>
                      {p.email ? <div className="text-xs text-muted-foreground">{p.email}</div> : null}
                    </TableCell>
                    <TableCell className="capitalize text-sm text-foreground">{p.status}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.overallScore != null ? p.overallScore : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {p.passed === true ? (
                        <span className="text-emerald-700">Yes</span>
                      ) : p.passed === false ? (
                        <span className="text-red-600">No</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.interviewId ? (
                        <Button variant="ghost" size="sm" className="h-8 gap-1" asChild>
                          <Link
                            href={`/dashboard/institute/${institutionId}/candidates/${encodeURIComponent(p.clerkId)}/reports/${encodeURIComponent(p.interviewId)}`}
                          >
                            View
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </InstituteTableShell>
        </CardContent>
      </Card>
    </div>
  );
}
