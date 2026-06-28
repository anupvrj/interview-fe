"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InterviewQuestionsField } from "@/components/institute/InterviewQuestionsField";
import { Loader2, CalendarClock, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { userApi, adminApi, type User } from "@/lib/api";
import { apiErrorMessage } from "@/lib/api-errors";
import { cn, parseQuestionLines, toDatetimeLocalValue } from "@/lib/utils";
import {
  InstituteLoader,
  InstitutePageHeader,
  InstituteTableShell,
  instituteFilterBarClass,
  institutePanelClass,
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";

const MAX_JOB_DESCRIPTION_CHARS = 32000;

type ScheduleRow = {
  _id: string;
  scheduledAt: string;
  expiresAt?: string;
  candidateClerkId: string;
  candidateName?: string | null;
  candidateEmail?: string | null;
  role: string;
  experience?: number;
  language?: "en" | "hi";
  targetCompany?: string;
  interviewDuration?: 15 | 30;
  notes?: string;
  customQuestions?: string[];
  passingScore?: number;
  jobDescription?: string;
  status: string;
};

export default function InstituteSchedulesPage() {
  const params = useParams();
  const institutionId = params.institutionId as string;
  const [profile, setProfile] = useState<any>(null);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAt, setEditAt] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editExperience, setEditExperience] = useState("");
  const [editLang, setEditLang] = useState<"en" | "hi">("en");
  const [editCompany, setEditCompany] = useState("");
  const [editDuration, setEditDuration] = useState<"15" | "30">("15");
  const [editQuestionsText, setEditQuestionsText] = useState("");
  const [editPassingScore, setEditPassingScore] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editJobDescription, setEditJobDescription] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [candidateQuery, setCandidateQuery] = useState("");
  const [scheduledFrom, setScheduledFrom] = useState("");
  const [scheduledTo, setScheduledTo] = useState("");

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleSelectedUser, setScheduleSelectedUser] = useState<User | null>(null);
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [scheduleSearchResults, setScheduleSearchResults] = useState<User[]>([]);
  const [scheduleSearching, setScheduleSearching] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [scheduleRole, setScheduleRole] = useState("");
  const [scheduleExperience, setScheduleExperience] = useState("2");
  const [scheduleLang, setScheduleLang] = useState<"en" | "hi">("en");
  const [scheduleCompany, setScheduleCompany] = useState("");
  const [scheduleDuration, setScheduleDuration] = useState<"15" | "30">("15");
  const [scheduleQuestionsText, setScheduleQuestionsText] = useState("");
  const [schedulePassingScore, setSchedulePassingScore] = useState("");
  const [scheduleExpiresAt, setScheduleExpiresAt] = useState("");
  const [scheduleJobDescription, setScheduleJobDescription] = useState("");
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await adminApi.listInterviewSchedules(
        profile?.accessRole === "super_admin" ? institutionId : undefined
      );
      setSchedules(s as ScheduleRow[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [profile?.accessRole, institutionId]);

  useEffect(() => {
    userApi.getMyProfile().then(setProfile).catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    load();
  }, [profile, load]);

  useEffect(() => {
    if (!scheduleDialogOpen || !profile) return;
    const q = scheduleSearch.trim();
    if (q.length < 2) {
      setScheduleSearchResults([]);
      return;
    }
    const t = globalThis.setTimeout(() => {
      (async () => {
        try {
          setScheduleSearching(true);
          const { data } = await adminApi.listUsers({
            limit: 15,
            skip: 0,
            search: q,
            ...(profile.accessRole === "super_admin" ? { institutionId } : {}),
          });
          setScheduleSearchResults(Array.isArray(data) ? data : []);
        } catch {
          setScheduleSearchResults([]);
        } finally {
          setScheduleSearching(false);
        }
      })();
    }, 300);
    return () => globalThis.clearTimeout(t);
  }, [scheduleSearch, scheduleDialogOpen, profile, institutionId]);

  const openScheduleDialog = () => {
    setScheduleSelectedUser(null);
    setScheduleSearch("");
    setScheduleSearchResults([]);
    setScheduleRole("Software Engineer");
    setScheduleExperience("2");
    setScheduleLang("en");
    setScheduleCompany("");
    setScheduleDuration("15");
    setScheduleQuestionsText("");
    setSchedulePassingScore("");
    setScheduleJobDescription("");
    const t = new Date();
    t.setDate(t.getDate() + 1);
    t.setHours(10, 0, 0, 0);
    setScheduleAt(toDatetimeLocalValue(t));
    const exp = new Date(t);
    exp.setDate(exp.getDate() + 7);
    exp.setHours(23, 59, 0, 0);
    setScheduleExpiresAt(toDatetimeLocalValue(exp));
    setScheduleDialogOpen(true);
  };

  const handleCreateSchedule = async () => {
    if (!scheduleSelectedUser || !profile || !scheduleRole.trim() || !scheduleAt) return;
    const instId =
      profile.accessRole === "super_admin" ? institutionId : profile.institutionId;
    if (!instId) {
      toast.error("Institution is required.");
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
    const customQs = parseQuestionLines(scheduleQuestionsText);
    try {
      setScheduleSubmitting(true);
      await adminApi.createInterviewSchedule({
        candidateClerkId: scheduleSelectedUser.clerkId,
        ...(profile.accessRole === "super_admin" && {
          institutionId: String(instId),
        }),
        scheduledAt: new Date(scheduleAt).toISOString(),
        ...(scheduleExpiresAt.trim()
          ? { expiresAt: new Date(scheduleExpiresAt).toISOString() }
          : {}),
        role: scheduleRole.trim(),
        experience: exp,
        language: scheduleLang,
        targetCompany: scheduleCompany.trim() || undefined,
        interviewDuration: scheduleDuration === "30" ? 30 : 15,
        ...(customQs.length > 0 ? { customQuestions: customQs } : {}),
        ...(passingScorePayload !== undefined ? { passingScore: passingScorePayload } : {}),
        ...(jd ? { jobDescription: jd } : {}),
      });
      toast.success("Interview scheduled", {
        description: `${scheduleSelectedUser.name ?? scheduleSelectedUser.email ?? "Candidate"} will see this on their dashboard.`,
      });
      setScheduleDialogOpen(false);
      setScheduleSelectedUser(null);
      load();
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, "Failed to schedule interview"));
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const openEdit = (s: ScheduleRow) => {
    setEditingId(String(s._id));
    setEditAt(toDatetimeLocalValue(new Date(s.scheduledAt)));
    setEditRole(s.role || "");
    setEditExperience(String(s.experience ?? 0));
    setEditLang(s.language === "hi" ? "hi" : "en");
    setEditCompany(s.targetCompany || "");
    setEditDuration(s.interviewDuration === 30 ? "30" : "15");
    setEditQuestionsText((s.customQuestions ?? []).join("\n"));
    setEditPassingScore(
      s.passingScore != null && !Number.isNaN(Number(s.passingScore))
        ? String(s.passingScore)
        : ""
    );
    setEditExpiresAt(
      s.expiresAt ? toDatetimeLocalValue(new Date(s.expiresAt)) : ""
    );
    setEditJobDescription(s.jobDescription ?? "");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editRole.trim() || !editAt) return;
    const exp = Number.parseInt(editExperience, 10);
    if (!Number.isFinite(exp) || exp < 0) {
      alert("Enter a valid years of experience (0 or more).");
      return;
    }
    let passingPatch: number | null | undefined;
    if (editPassingScore.trim()) {
      const ps = Number.parseFloat(editPassingScore.trim());
      if (!Number.isFinite(ps) || ps < 0 || ps > 100) {
        alert("Passing score must be a number from 0 to 100.");
        return;
      }
      passingPatch = ps;
    } else {
      passingPatch = null;
    }
    const jdEdit = editJobDescription.trim();
    if (jdEdit.length > MAX_JOB_DESCRIPTION_CHARS) {
      alert(
        `Job description must be at most ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters (you have ${jdEdit.length.toLocaleString()}).`
      );
      return;
    }
    const qLines = parseQuestionLines(editQuestionsText);
    try {
      setEditSubmitting(true);
      await adminApi.updateInterviewSchedule(editingId, {
        scheduledAt: new Date(editAt).toISOString(),
        expiresAt: editExpiresAt.trim()
          ? new Date(editExpiresAt).toISOString()
          : null,
        role: editRole.trim(),
        experience: exp,
        language: editLang,
        targetCompany: editCompany.trim() || undefined,
        interviewDuration: editDuration === "30" ? 30 : 15,
        customQuestions: qLines.length > 0 ? qLines : null,
        passingScore: passingPatch,
        jobDescription: jdEdit ? jdEdit : null,
      });
      setEditOpen(false);
      setEditingId(null);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update schedule");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this scheduled interview?")) return;
    try {
      await adminApi.cancelInterviewSchedule(id);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to cancel");
    }
  };

  const pending = schedules.filter((s) => s.status === "scheduled");

  const filteredPending = useMemo(() => {
    let list = pending;
    const q = candidateQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const name = (s.candidateName ?? "").toLowerCase();
        const email = (s.candidateEmail ?? "").toLowerCase();
        const id = (s.candidateClerkId ?? "").toLowerCase();
        return name.includes(q) || email.includes(q) || id.includes(q);
      });
    }
    if (scheduledFrom.trim()) {
      const fromMs = new Date(scheduledFrom).getTime();
      if (!Number.isNaN(fromMs)) {
        list = list.filter(
          (s) => new Date(s.scheduledAt).getTime() >= fromMs
        );
      }
    }
    if (scheduledTo.trim()) {
      const toMs = new Date(scheduledTo).getTime();
      if (!Number.isNaN(toMs)) {
        list = list.filter(
          (s) => new Date(s.scheduledAt).getTime() <= toMs
        );
      }
    }
    return list;
  }, [pending, candidateQuery, scheduledFrom, scheduledTo]);

  const hasActiveFilters =
    candidateQuery.trim() !== "" ||
    scheduledFrom.trim() !== "" ||
    scheduledTo.trim() !== "";

  if (!profile) {
    return <InstituteLoader />;
  }

  return (
    <div className="space-y-8">
      <InstitutePageHeader
        badge="Scheduling"
        title="Scheduled interviews"
        description="Candidates see these on their dashboard. They can start from 24 hours before the scheduled time (saved resume required)."
        actions={
          <Button
            type="button"
            className={cn(institutePrimaryClass, "shrink-0 gap-2")}
            onClick={openScheduleDialog}
            disabled={
              profile.accessRole !== "institution_admin" && profile.accessRole !== "super_admin"
            }
          >
            <CalendarClock className="h-4 w-4" />
            Schedule interview
          </Button>
        }
      />

      <Card className={cn(institutePanelClass, "overflow-hidden shadow-xl")}>
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/50 to-white">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="h-5 w-5 text-primary" />
            Upcoming & pending
          </CardTitle>
          <CardDescription>
            Use <span className="font-medium text-slate-800">Schedule interview</span> above to pick
            a candidate and set time and details, or use the calendar on each row on the Candidates
            tab. Edit time, role, and details here anytime before the interview starts.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pending.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-slate-600">
              No pending schedules.
            </p>
          ) : (
            <div className="space-y-4">
              <div
                className={cn(
                  instituteFilterBarClass,
                  "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
                )}
              >
                <div className="min-w-[200px] flex-1">
                  <Label htmlFor="sch-filter-candidate" className="text-xs text-slate-600">
                    Candidate (name or email)
                  </Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="sch-filter-candidate"
                      placeholder="Search…"
                      value={candidateQuery}
                      onChange={(e) => setCandidateQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="min-w-[180px]">
                  <Label htmlFor="sch-filter-from" className="text-xs text-slate-600">
                    Scheduled from
                  </Label>
                  <Input
                    id="sch-filter-from"
                    type="datetime-local"
                    value={scheduledFrom}
                    onChange={(e) => setScheduledFrom(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="min-w-[180px]">
                  <Label htmlFor="sch-filter-to" className="text-xs text-slate-600">
                    Scheduled to
                  </Label>
                  <Input
                    id="sch-filter-to"
                    type="datetime-local"
                    value={scheduledTo}
                    onChange={(e) => setScheduledTo(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setCandidateQuery("");
                      setScheduledFrom("");
                      setScheduledTo("");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </div>

              <p className="text-xs text-slate-500">
                Showing {filteredPending.length} of {pending.length} schedule
                {pending.length === 1 ? "" : "s"}
              </p>

              {filteredPending.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No schedules match your filters. Try adjusting search or date range.
                </p>
              ) : (
                <InstituteTableShell>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200/80 bg-slate-50/90 hover:bg-slate-50/90">
                    <TableHead className="font-semibold text-slate-700">When</TableHead>
                    <TableHead className="font-semibold text-slate-700">Expire by</TableHead>
                    <TableHead className="font-semibold text-slate-700">Candidate</TableHead>
                    <TableHead className="font-semibold text-slate-700">Role</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPending.map((s) => (
                    <TableRow key={s._id} className="border-slate-100 hover:bg-muted/40">
                      <TableCell className="whitespace-nowrap">
                        {new Date(s.scheduledAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600">
                        {s.expiresAt
                          ? new Date(s.expiresAt).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-[10rem] max-w-[18rem] flex-col gap-0.5">
                          <span className="font-medium text-slate-900">
                            {s.candidateName?.trim()
                              ? s.candidateName.trim()
                              : "—"}
                          </span>
                          <span className="break-all text-sm text-slate-600">
                            {s.candidateEmail?.trim()
                              ? s.candidateEmail.trim()
                              : "—"}
                          </span>
                          {!s.candidateName?.trim() && !s.candidateEmail?.trim() ? (
                            <span className="font-mono text-[11px] text-slate-400">
                              {s.candidateClerkId}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{s.role}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn("mr-1 gap-1", instituteSecondaryClass)}
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleCancel(String(s._id))}
                        >
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                </InstituteTableShell>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditOpen(false);
            setEditingId(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit scheduled interview</DialogTitle>
            <DialogDescription>
              Changes apply immediately. The candidate sees the updated time and details on
              their dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label htmlFor="edit-sch-at">Date & time</Label>
              <Input
                id="edit-sch-at"
                type="datetime-local"
                value={editAt}
                onChange={(e) => setEditAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-sch-expires">Expire deadline</Label>
              <Input
                id="edit-sch-expires"
                type="datetime-local"
                value={editExpiresAt}
                onChange={(e) => setEditExpiresAt(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-slate-500">
                Latest time the candidate can start. Clear to remove the deadline. Must be on or
                after 24 hours before the scheduled time.
              </p>
            </div>
            <div>
              <Label htmlFor="edit-sch-role">Role / position</Label>
              <Input
                id="edit-sch-role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-sch-exp">Years of experience</Label>
              <Input
                id="edit-sch-exp"
                type="number"
                min={0}
                value={editExperience}
                onChange={(e) => setEditExperience(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-sch-lang">Language</Label>
              <select
                id="edit-sch-lang"
                className="app-control mt-1 w-full bg-card"
                value={editLang}
                onChange={(e) => setEditLang(e.target.value as "en" | "hi")}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-sch-co">Target company (optional)</Label>
              <Input
                id="edit-sch-co"
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-sch-jd">Job description (optional)</Label>
              <Textarea
                id="edit-sch-jd"
                value={editJobDescription}
                onChange={(e) => setEditJobDescription(e.target.value)}
                placeholder="Paste the role’s JD — the AI uses it when the candidate starts the interview."
                className="mt-1 min-h-[100px] resize-y text-sm"
                disabled={editSubmitting}
                maxLength={MAX_JOB_DESCRIPTION_CHARS}
              />
              <p className="mt-1 text-xs text-slate-500">
                Stored on this schedule and passed into the interview context (max{" "}
                {MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters).
              </p>
            </div>
            <div>
              <Label htmlFor="edit-sch-dur">Duration</Label>
              <select
                id="edit-sch-dur"
                className="app-control mt-1 w-full bg-card"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value as "15" | "30")}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-sch-q" className="mb-1 block">
                Interview questions (optional)
              </Label>
              <InterviewQuestionsField
                id="edit-sch-q"
                value={editQuestionsText}
                onChange={setEditQuestionsText}
                disabled={editSubmitting}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-sch-pass">Passing score (optional)</Label>
              <Input
                id="edit-sch-pass"
                type="number"
                min={0}
                max={100}
                step={1}
                value={editPassingScore}
                onChange={(e) => setEditPassingScore(e.target.value)}
                placeholder="Clear to remove threshold"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editSubmitting || !editRole.trim() || !editAt}
              className={institutePrimaryClass}
            >
              {editSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={scheduleDialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setScheduleDialogOpen(false);
            setScheduleSelectedUser(null);
            setScheduleSearch("");
            setScheduleSearchResults([]);
            setScheduleJobDescription("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule interview</DialogTitle>
            <DialogDescription>
              Search for a candidate in your institution, then set date, role, and questions. They
              need a saved resume to start.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label htmlFor="inst-sch-pick">Find candidate</Label>
              <Input
                id="inst-sch-pick"
                placeholder="Type name or email (min. 2 characters)…"
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                className="mt-1"
                autoComplete="off"
              />
              {scheduleSearching ? (
                <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching…
                </p>
              ) : scheduleSearch.trim().length >= 2 && scheduleSearchResults.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No users match.</p>
              ) : null}
              {scheduleSearchResults.length > 0 ? (
                <ul className="mt-2 max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white">
                  {scheduleSearchResults.map((u) => (
                    <li key={u._id}>
                      <button
                        type="button"
                        className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                          scheduleSelectedUser?.clerkId === u.clerkId ? "bg-muted/30" : ""
                        }`}
                        onClick={() => setScheduleSelectedUser(u)}
                      >
                        <span className="font-medium text-slate-900">{u.name || "—"}</span>
                        <span className="text-xs text-slate-600">{u.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {scheduleSelectedUser ? (
                <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  Scheduling for:{" "}
                  <span className="font-medium">
                    {scheduleSelectedUser.name ?? scheduleSelectedUser.email}
                  </span>
                  {scheduleSelectedUser.email && scheduleSelectedUser.name ? (
                    <span className="text-slate-600"> ({scheduleSelectedUser.email})</span>
                  ) : null}
                </p>
              ) : scheduleSearch.trim().length >= 2 ? (
                <p className="mt-2 text-xs text-amber-800/90">
                  Select a candidate from the search results to continue.
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Type at least 2 characters to search your institution.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="inst-sch-at">Date & time</Label>
              <Input
                id="inst-sch-at"
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="inst-sch-expires">Expire deadline (optional)</Label>
              <Input
                id="inst-sch-expires"
                type="datetime-local"
                value={scheduleExpiresAt}
                onChange={(e) => setScheduleExpiresAt(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-slate-500">
                Latest time the candidate can start. Must be on or after 24 hours before the
                scheduled time above. Clear to allow starting anytime after the window opens (no
                upper limit).
              </p>
            </div>
            <div>
              <Label htmlFor="inst-sch-role">Role / position</Label>
              <Input
                id="inst-sch-role"
                value={scheduleRole}
                onChange={(e) => setScheduleRole(e.target.value)}
                placeholder="e.g. Backend Engineer"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="inst-sch-exp">Years of experience</Label>
              <Input
                id="inst-sch-exp"
                type="number"
                min={0}
                value={scheduleExperience}
                onChange={(e) => setScheduleExperience(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="inst-sch-lang">Language</Label>
              <select
                id="inst-sch-lang"
                className="app-control mt-1 w-full bg-card"
                value={scheduleLang}
                onChange={(e) => setScheduleLang(e.target.value as "en" | "hi")}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <div>
              <Label htmlFor="inst-sch-co">Target company (optional)</Label>
              <Input
                id="inst-sch-co"
                value={scheduleCompany}
                onChange={(e) => setScheduleCompany(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="inst-sch-jd">Job description (optional)</Label>
              <Textarea
                id="inst-sch-jd"
                value={scheduleJobDescription}
                onChange={(e) => setScheduleJobDescription(e.target.value)}
                placeholder="Paste the role’s JD — the AI uses it when the candidate starts the interview."
                className="mt-1 min-h-[100px] resize-y text-sm"
                disabled={scheduleSubmitting}
                maxLength={MAX_JOB_DESCRIPTION_CHARS}
              />
              <p className="mt-1 text-xs text-slate-500">
                Stored on this schedule and passed into the interview context (max{" "}
                {MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters).
              </p>
            </div>
            <div>
              <Label htmlFor="inst-sch-dur">Duration</Label>
              <select
                id="inst-sch-dur"
                className="app-control mt-1 w-full bg-card"
                value={scheduleDuration}
                onChange={(e) => setScheduleDuration(e.target.value as "15" | "30")}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
            <div>
              <Label htmlFor="inst-sch-q" className="mb-1 block">
                Interview questions (optional)
              </Label>
              <InterviewQuestionsField
                id="inst-sch-q"
                value={scheduleQuestionsText}
                onChange={setScheduleQuestionsText}
                disabled={scheduleSubmitting}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="inst-sch-pass">Passing score (optional)</Label>
              <Input
                id="inst-sch-pass"
                type="number"
                min={0}
                max={100}
                step={1}
                value={schedulePassingScore}
                onChange={(e) => setSchedulePassingScore(e.target.value)}
                placeholder="0–100; overall score needed to pass"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setScheduleDialogOpen(false);
                setScheduleSelectedUser(null);
                setScheduleJobDescription("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSchedule}
              disabled={
                scheduleSubmitting ||
                !scheduleSelectedUser ||
                !scheduleRole.trim() ||
                !scheduleAt
              }
              className={institutePrimaryClass}
            >
              {scheduleSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create schedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
