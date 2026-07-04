"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
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
import {
  Loader2,
  Users,
  Plus,
  Trash2,
  Coins,
  FileText,
  Search,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { userApi, adminApi, User } from "@/lib/api";
import { cn, formatDate, parseQuestionLines, toDatetimeLocalValue } from "@/lib/utils";
import {
  InstituteEmptyState,
  InstituteLoader,
  InstitutePageHeader,
  InstituteTableShell,
  institutePanelClass,
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";

const MAX_JOB_DESCRIPTION_CHARS = 32000;

function candidateInitials(name: string | undefined, email: string | undefined): string {
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

/** Institution UI plan labels; API only accepts free | premium | enterprise. */
type InstitutionUiPlan = "free" | "starter" | "premium" | "elite";
type ApiSubscriptionPlan = "free" | "premium" | "enterprise";

function uiPlanToApi(plan: InstitutionUiPlan): ApiSubscriptionPlan {
  switch (plan) {
    case "free":
      return "free";
    case "starter":
      return "premium";
    case "premium":
      return "premium";
    case "elite":
      return "enterprise";
    default:
      return "free";
  }
}

function subscriptionToUiPlanSelect(apiPlan: string | undefined): InstitutionUiPlan {
  const p = (apiPlan || "free").toLowerCase();
  if (p === "enterprise") return "elite";
  if (p === "premium") return "premium";
  return "free";
}

function planBadgeLabel(apiPlan: string): string {
  const p = (apiPlan || "free").toLowerCase();
  if (p === "enterprise") return "Elite";
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export default function InstituteCandidatesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const institutionId = params.institutionId as string;
  const [profile, setProfile] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Add user dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPlan, setAddPlan] = useState<InstitutionUiPlan>("free");
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [creditsOpen, setCreditsOpen] = useState(false);
  const [creditsUser, setCreditsUser] = useState<User | null>(null);
  const [creditsMode, setCreditsMode] = useState<"add" | "set">("add");
  const [creditsValue, setCreditsValue] = useState("");
  const [creditsSubmitting, setCreditsSubmitting] = useState(false);

  const [scheduleUser, setScheduleUser] = useState<User | null>(null);
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

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadProfile();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    if (profile && (profile.accessRole === "institution_admin" || profile.accessRole === "super_admin")) {
      loadUsers();
    }
  }, [profile, page, search, institutionId]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const p = await userApi.getMyProfile();
      setProfile(p);
      if (p.accessRole !== "institution_admin" && p.accessRole !== "super_admin") {
        router.replace("/dashboard");
      }
    } catch {
      router.replace("/dashboard");
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, total: t } = await adminApi.listUsers({
        limit,
        skip: page * limit,
        search: search || undefined,
        ...(profile?.accessRole === "super_admin" && { institutionId }),
      });
      setUsers(data);
      setTotal(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!addEmail?.trim()) return;
    const instId =
      profile?.accessRole === "super_admin" ? institutionId : profile?.institutionId;
    if (profile?.accessRole === "institution_admin" && !instId) {
      alert("Institution is required");
      return;
    }
    try {
      setAddSubmitting(true);
      const result = await adminApi.addUser(
        addEmail,
        uiPlanToApi(addPlan),
        instId,
      );
      setAddOpen(false);
      setAddEmail("");
      setAddPlan("free");
      alert(result.message);
      loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to add user");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (
      !confirm(
        `Delete ${u.name} (${u.email})? This will permanently delete the user, their resumes, interviews, reports, and all related data. This cannot be undone.`
      )
    )
      return;
    try {
      await adminApi.deleteUser(u.clerkId);
      loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const openCreditsDialog = (u: User) => {
    setCreditsUser(u);
    setCreditsMode("add");
    setCreditsValue("");
    setCreditsOpen(true);
  };

  const handleSaveCredits = async () => {
    if (!creditsUser) return;
    const current = creditsUser.credits?.total ?? 0;
    let delta: number;
    if (creditsMode === "add") {
      const n = Number.parseInt(creditsValue.trim(), 10);
      if (!Number.isFinite(n) || n <= 0) {
        alert("Enter a positive whole number of credits to add.");
        return;
      }
      delta = n;
    } else {
      const newTotal = Number.parseInt(creditsValue.trim(), 10);
      if (!Number.isFinite(newTotal) || newTotal < 0) {
        alert("Enter a new balance (0 or greater).");
        return;
      }
      delta = newTotal - current;
    }
    if (delta === 0) {
      setCreditsOpen(false);
      setCreditsUser(null);
      return;
    }
    try {
      setCreditsSubmitting(true);
      const desc = `Admin adjustment (${delta > 0 ? "+" : ""}${delta}; balance was ${current})`;
      await adminApi.addCredits(creditsUser.clerkId, delta, desc);
      await loadUsers();
      setCreditsOpen(false);
      setCreditsUser(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update credits");
    } finally {
      setCreditsSubmitting(false);
    }
  };

  const handleUpdatePlan = async (u: User, plan: InstitutionUiPlan) => {
    try {
      await adminApi.updatePlan(u.clerkId, uiPlanToApi(plan));
      loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update plan");
    }
  };

  const openScheduleDialog = (u: User) => {
    const instId =
      profile?.accessRole === "super_admin" ? institutionId : profile?.institutionId;
    if (!instId) {
      alert("This user must belong to an institution before you can schedule an interview.");
      return;
    }
    setScheduleUser(u);
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
  };

  const handleCreateSchedule = async () => {
    if (!scheduleUser || !profile || !scheduleRole.trim() || !scheduleAt) return;
    const instId =
      profile.accessRole === "super_admin" ? institutionId : profile.institutionId;
    if (!instId) {
      alert("Institution is required.");
      return;
    }
    const exp = Number.parseInt(scheduleExperience, 10);
    if (!Number.isFinite(exp) || exp < 0) {
      alert("Enter a valid years of experience (0 or more).");
      return;
    }
    let passingScorePayload: number | undefined;
    if (schedulePassingScore.trim()) {
      const ps = Number.parseFloat(schedulePassingScore.trim());
      if (!Number.isFinite(ps) || ps < 0 || ps > 100) {
        alert("Passing score must be a number from 0 to 100.");
        return;
      }
      passingScorePayload = ps;
    }
    const jd = scheduleJobDescription.trim();
    if (jd.length > MAX_JOB_DESCRIPTION_CHARS) {
      alert(
        `Job description must be at most ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters (you have ${jd.length.toLocaleString()}).`
      );
      return;
    }
    const customQs = parseQuestionLines(scheduleQuestionsText);
    try {
      setScheduleSubmitting(true);
      await adminApi.createInterviewSchedule({
        candidateClerkId: scheduleUser.clerkId,
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
      setScheduleUser(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to schedule interview");
    } finally {
      setScheduleSubmitting(false);
    }
  };

  if (!profile) {
    return <InstituteLoader />;
  }

  const rangeStart = total === 0 ? 0 : page * limit + 1;
  const rangeEnd = Math.min((page + 1) * limit, total);

  return (
    <div className="space-y-8">
      <InstitutePageHeader
        badge="People"
        title="Candidates"
        actions={
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className={cn(institutePrimaryClass, "h-9 gap-2 shadow-lg")}
          >
            <Plus className="h-4 w-4" />
            Add user
          </Button>
        }
      />

      <section
        className={cn(
          institutePanelClass,
          "relative overflow-hidden border-border bg-gradient-to-br from-card via-card to-muted/30"
        )}
      >
        <div className="pointer-events-none absolute -right-16 -top-12 h-40 w-40 rounded-full bg-primary/80/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:gap-8 lg:p-6">
          <div className="flex shrink-0 justify-center lg:justify-start">
            {loading ? (
              <div
                className="h-16 w-16 animate-pulse rounded-2xl bg-slate-200/90 ring-2 ring-white lg:h-[4.5rem] lg:w-[4.5rem]"
                aria-hidden
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30 ring-2 ring-border/60 lg:h-[4.5rem] lg:w-[4.5rem]">
                <Users className="h-8 w-8 text-white lg:h-9 lg:w-9" strokeWidth={1.75} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-3 text-center lg:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Candidate directory
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Invite people, assign <span className="font-semibold text-foreground">plans</span> and{" "}
                <span className="font-semibold text-foreground">credits</span>, open{" "}
                <span className="font-semibold text-foreground">reports</span>, and schedule interviews
                — all in one place.
              </p>
            </div>
            {!loading ? (
              <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                {total.toLocaleString()}{" "}
                <span className="text-base font-semibold text-muted-foreground sm:text-lg">
                  {total === 1 ? "member" : "members"}
                </span>
              </p>
            ) : (
              <div className="h-9 w-40 animate-pulse rounded-lg bg-slate-200/80" aria-hidden />
            )}
          </div>
          <div className="w-full shrink-0 lg:max-w-sm">
            <Label
              htmlFor="cand-search"
              className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
            >
              Search
            </Label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cand-search"
                placeholder="Name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 border-border bg-card pl-10 shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/25"
              />
            </div>
          </div>
        </div>
      </section>

      <Card className={cn(institutePanelClass, "overflow-hidden shadow-xl")}>
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/50 via-card to-indigo-50/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/25 ring-2 ring-border/40">
                <Users className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 space-y-1.5">
                <CardTitle className="text-lg leading-tight">Member list</CardTitle>
                <CardDescription>
                  {!loading && total > 0 ? (
                    <span>
                      Showing{" "}
                      <span className="font-semibold text-foreground">
                        {rangeStart}–{rangeEnd}
                      </span>{" "}
                      of <span className="font-semibold text-foreground">{total}</span>
                    </span>
                  ) : (
                    "Everyone enrolled under your institution"
                  )}
                </CardDescription>
              </div>
            </div>
            {!loading && total > 0 ? (
              <span className="inline-flex w-fit shrink-0 items-center gap-1.5 self-start rounded-full border border-border/80 bg-card/90 px-3 py-1.5 text-xs font-medium text-primary shadow-sm sm:mt-1">
                <Sparkles className="h-3.5 w-3.5" />
                Live directory
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 py-6 sm:px-6">
              <InstituteEmptyState
                icon={Users}
                title={search.trim() ? "No matches" : "No candidates yet"}
                description={
                  search.trim()
                    ? "Try a different search term, or clear the search to see everyone."
                    : "Invite your first candidate to appear in this list."
                }
                action={
                  !search.trim() ? (
                    <Button
                      onClick={() => setAddOpen(true)}
                      className={cn(institutePrimaryClass, "gap-2")}
                    >
                      <Plus className="h-4 w-4" />
                      Add user
                    </Button>
                  ) : (
                    <Button variant="outline" className={instituteSecondaryClass} onClick={() => setSearch("")}>
                      Clear search
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              <InstituteTableShell>
                <Table className="w-full min-w-[860px]">
                  <TableHeader>
                    <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                      <TableHead className="pl-6 text-left align-middle font-semibold text-foreground">
                        Candidate
                      </TableHead>
                      <TableHead className="align-middle font-semibold text-foreground">Plan</TableHead>
                      <TableHead className="align-middle font-semibold text-foreground">Credits</TableHead>
                      <TableHead className="align-middle font-semibold text-foreground">Joined</TableHead>
                      <TableHead className="w-[272px] min-w-[272px] pr-6 text-right align-middle font-semibold text-foreground">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => {
                      const apiPlan = String(u.subscription?.plan || "free");
                      const uiPlanValue = subscriptionToUiPlanSelect(apiPlan);
                      return (
                        <TableRow
                          key={u._id}
                          className="group border-border align-middle transition-colors hover:bg-gradient-to-r hover:bg-muted/50 hover:to-transparent"
                        >
                          <TableCell className="pl-6 align-middle">
                            <div className="flex items-center gap-3 py-2">
                              <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-sm font-bold text-white shadow-md shadow-primary/15 ring-2 ring-white"
                                aria-hidden
                              >
                                {candidateInitials(u.name, u.email)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-foreground">
                                  {u.name?.trim() || "—"}
                                </p>
                                <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                                apiPlan === "enterprise" &&
                                  "border-amber-200 bg-amber-50 text-amber-900",
                                apiPlan === "premium" && "border-purple-200 bg-purple-50 text-purple-900",
                                apiPlan === "free" && "border-border bg-muted/20 text-foreground",
                              )}
                            >
                              {planBadgeLabel(apiPlan)}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle">
                            <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-lg bg-slate-100/90 px-2 py-1 text-sm font-semibold tabular-nums text-foreground">
                              {u.credits?.total ?? 0}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(u.createdAt)}
                          </TableCell>
                          <TableCell className="w-[272px] min-w-[272px] pr-6 align-middle">
                            <div className="flex flex-nowrap items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className={cn(instituteSecondaryClass, "h-8 w-8 shrink-0 p-0")}
                                onClick={() =>
                                  router.push(
                                    `/dashboard/institute/${institutionId}/candidates/${u.clerkId}/reports?${new URLSearchParams({
                                      ...(u.name && { name: u.name }),
                                      ...(u.email && { email: u.email }),
                                    }).toString()}`
                                  )
                                }
                                title="Reports"
                                aria-label="Open reports"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className={cn(instituteSecondaryClass, "h-8 w-8 shrink-0 p-0")}
                                onClick={() => openScheduleDialog(u)}
                                title="Schedule interview"
                                aria-label="Schedule interview"
                              >
                                <CalendarClock className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className={cn(instituteSecondaryClass, "h-8 w-8 shrink-0 p-0")}
                                onClick={() => openCreditsDialog(u)}
                                title="Adjust credits"
                                aria-label="Adjust credits"
                              >
                                <Coins className="h-3.5 w-3.5" />
                              </Button>
                              <select
                                className="app-control h-8 w-[104px] shrink-0 cursor-pointer px-2 text-xs font-medium shadow-sm"
                                value={uiPlanValue}
                                onChange={(e) =>
                                  handleUpdatePlan(
                                    u,
                                    e.target.value as InstitutionUiPlan,
                                  )
                                }
                                aria-label={`Plan for ${u.email}`}
                              >
                                <option value="free">Free</option>
                                <option value="starter">Starter</option>
                                <option value="premium">Premium</option>
                                <option value="elite">Elite</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleDeleteUser(u)}
                                title="Remove user"
                                aria-label={`Remove ${u.email}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </InstituteTableShell>

              {total > limit && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-border/80 bg-gradient-to-r from-slate-50/60 to-card px-4 py-4 sm:flex-row sm:px-6">
                  <p className="text-sm text-muted-foreground">
                    Page <span className="font-semibold text-foreground">{page + 1}</span> ·{" "}
                    {rangeStart}–{rangeEnd} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={instituteSecondaryClass}
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={instituteSecondaryClass}
                      disabled={(page + 1) * limit >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!scheduleUser}
        onOpenChange={(o) => {
          if (!o) setScheduleUser(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/80 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Schedule interview</DialogTitle>
            <DialogDescription>
              {scheduleUser
                ? `${scheduleUser.name ?? scheduleUser.email} will see this on their dashboard. They need a saved resume to start.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label htmlFor="sch-at">Date & time</Label>
              <Input
                id="sch-at"
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sch-expires">Expire deadline (optional)</Label>
              <Input
                id="sch-expires"
                type="datetime-local"
                value={scheduleExpiresAt}
                onChange={(e) => setScheduleExpiresAt(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Latest time the candidate can start. Must be on or after 24 hours before the
                scheduled time above. Clear to allow starting anytime after the window opens
                (no upper limit).
              </p>
            </div>
            <div>
              <Label htmlFor="sch-role">Role / position</Label>
              <Input
                id="sch-role"
                value={scheduleRole}
                onChange={(e) => setScheduleRole(e.target.value)}
                placeholder="e.g. Backend Engineer"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sch-exp">Years of experience</Label>
              <Input
                id="sch-exp"
                type="number"
                min={0}
                value={scheduleExperience}
                onChange={(e) => setScheduleExperience(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sch-lang">Language</Label>
              <select
                id="sch-lang"
                className="app-control mt-1 w-full bg-card"
                value={scheduleLang}
                onChange={(e) => setScheduleLang(e.target.value as "en" | "hi")}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <div>
              <Label htmlFor="sch-co">Target company (optional)</Label>
              <Input
                id="sch-co"
                value={scheduleCompany}
                onChange={(e) => setScheduleCompany(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sch-jd">Job description (optional)</Label>
              <Textarea
                id="sch-jd"
                value={scheduleJobDescription}
                onChange={(e) => setScheduleJobDescription(e.target.value)}
                placeholder="Paste the role’s JD — the AI uses it when the candidate starts the interview."
                className="mt-1 min-h-[100px] resize-y text-sm"
                disabled={scheduleSubmitting}
                maxLength={MAX_JOB_DESCRIPTION_CHARS}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Stored on this schedule and passed into the interview context (max{" "}
                {MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters).
              </p>
            </div>
            <div>
              <Label htmlFor="sch-dur">Duration</Label>
              <select
                id="sch-dur"
                className="app-control mt-1 w-full bg-card"
                value={scheduleDuration}
                onChange={(e) => setScheduleDuration(e.target.value as "15" | "30")}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
            <div>
              <Label htmlFor="sch-q" className="mb-1 block">
                Interview questions (optional)
              </Label>
              <InterviewQuestionsField
                id="sch-q"
                value={scheduleQuestionsText}
                onChange={setScheduleQuestionsText}
                disabled={scheduleSubmitting}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sch-pass">Passing score (optional)</Label>
              <Input
                id="sch-pass"
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
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className={instituteSecondaryClass}
              onClick={() => setScheduleUser(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSchedule}
              disabled={scheduleSubmitting || !scheduleRole.trim() || !scheduleAt}
              className={cn(institutePrimaryClass, "shadow-md")}
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

      <Dialog
        open={creditsOpen}
        onOpenChange={(o) => {
          if (!o) {
            setCreditsOpen(false);
            setCreditsUser(null);
          }
        }}
      >
        <DialogContent className="border-border/80 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Adjust credits</DialogTitle>
            <DialogDescription>
              {creditsUser ? (
                <>
                  {creditsUser.name ?? creditsUser.email} — current balance:{" "}
                  <span className="font-semibold text-foreground">
                    {creditsUser.credits?.total ?? 0}
                  </span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label htmlFor="credits-mode">Action</Label>
              <select
                id="credits-mode"
                className="app-control mt-2 w-full bg-card"
                value={creditsMode}
                onChange={(e) => {
                  setCreditsMode(e.target.value as "add" | "set");
                  setCreditsValue("");
                }}
              >
                <option value="add">Add credits</option>
                <option value="set">Set new balance</option>
              </select>
            </div>
            <div>
              <Label htmlFor="credits-amount">
                {creditsMode === "add" ? "Credits to add" : "New balance (total)"}
              </Label>
              <Input
                id="credits-amount"
                type="number"
                min={creditsMode === "add" ? 1 : 0}
                step={1}
                value={creditsValue}
                onChange={(e) => setCreditsValue(e.target.value)}
                placeholder={creditsMode === "add" ? "e.g. 100" : "e.g. 500"}
                className="mt-2"
              />
              {creditsMode === "set" && creditsUser != null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Change from current ({creditsUser.credits?.total ?? 0}) to the value above.
                  Reducing balance is allowed if it does not go below zero.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className={instituteSecondaryClass}
              onClick={() => {
                setCreditsOpen(false);
                setCreditsUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCredits}
              disabled={creditsSubmitting || !creditsUser}
              className={cn(institutePrimaryClass, "shadow-md")}
            >
              {creditsSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border-border/80 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Add user</DialogTitle>
            <DialogDescription>
              Enter email and assign a plan. The user will receive an invitation email to verify and sign up.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="user@example.com"
                className="mt-1 h-11 border-border shadow-sm"
              />
            </div>
            <div>
              <Label htmlFor="plan">Plan</Label>
              <select
                id="plan"
                className="app-control mt-1 h-11 w-full bg-card"
                value={addPlan}
                onChange={(e) =>
                  setAddPlan(e.target.value as InstitutionUiPlan)
                }
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="premium">Premium</option>
                <option value="elite">Elite</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className={instituteSecondaryClass} onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={!addEmail?.trim() || addSubmitting}
              className={cn(institutePrimaryClass, "shadow-md")}
            >
              {addSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
