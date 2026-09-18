"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { InterviewQuestionsField } from "@/components/institute/InterviewQuestionsField";
import { SuperAdminPeriodFilter } from "@/components/super-admin/SuperAdminPeriodFilter";
import {
  Loader2,
  Plus,
  Users,
  Search,
  Trash2,
  Coins,
  ChevronDown,
  CalendarClock,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi, User } from "@/lib/api";
import {
  formatDate,
  getScoreColor,
  parseQuestionLines,
  toDatetimeLocalValue,
} from "@/lib/utils";
import { useInsightFilters } from "@/hooks/useInsightFilters";

export function SuperAdminUsersTable() {
  const router = useRouter();
  const { period, from, to, setFilters } = useInsightFilters();
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;
  const [defaultResumeLoadingId, setDefaultResumeLoadingId] = useState<
    string | null
  >(null);

  const [instDropdownUser, setInstDropdownUser] = useState<User | null>(null);
  const [instSearch, setInstSearch] = useState("");
  const [instUpdating, setInstUpdating] = useState(false);
  const instDropdownRef = useRef<HTMLDivElement>(null);

  const [roleDropdownUser, setRoleDropdownUser] = useState<User | null>(null);
  const [roleUpdating, setRoleUpdating] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPlan, setAddPlan] = useState<"free" | "premium" | "enterprise">(
    "free",
  );
  const [addInstitutionId, setAddInstitutionId] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [creditsOpen, setCreditsOpen] = useState<User | null>(null);
  const [creditsAmount, setCreditsAmount] = useState("");
  const [creditsDescription, setCreditsDescription] = useState("");
  const [creditsSubmitting, setCreditsSubmitting] = useState(false);

  const [scheduleUser, setScheduleUser] = useState<User | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [scheduleRole, setScheduleRole] = useState("");
  const [scheduleExperience, setScheduleExperience] = useState("2");
  const [scheduleCompany, setScheduleCompany] = useState("");
  const [scheduleDuration, setScheduleDuration] = useState<"15" | "30">("15");
  const [scheduleQuestionsText, setScheduleQuestionsText] = useState("");
  const [schedulePassingScore, setSchedulePassingScore] = useState("");
  const [scheduleExpiresAt, setScheduleExpiresAt] = useState("");
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  useEffect(() => {
    if (!instDropdownUser) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        instDropdownRef.current &&
        !instDropdownRef.current.contains(e.target as Node)
      ) {
        setInstDropdownUser(null);
        setInstSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [instDropdownUser]);

  useEffect(() => {
    if (!roleDropdownUser) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(e.target as Node)
      ) {
        setRoleDropdownUser(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [roleDropdownUser]);

  useEffect(() => {
    setPage(0);
  }, [period, from, to, search]);

  useEffect(() => {
    void loadInstitutions();
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [page, search, period, from, to]);

  const loadInstitutions = async () => {
    try {
      const data = await adminApi.listInstitutions();
      setInstitutions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, total: t } = await adminApi.listUsers({
        limit,
        skip: page * limit,
        search: search || undefined,
        period: period === "all" ? undefined : period,
        from: period === "custom" ? from || undefined : undefined,
        to: period === "custom" ? to || undefined : undefined,
      });
      setUsers(data);
      setTotal(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetInstitution = async (u: User, institutionId: string | null) => {
    try {
      setInstUpdating(true);
      await adminApi.updateUser(u.clerkId, {
        ...(institutionId !== undefined && {
          institutionId: institutionId || null,
        }),
      });
      setInstDropdownUser(null);
      setInstSearch("");
      await loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update institution");
    } finally {
      setInstUpdating(false);
    }
  };

  const filteredInstitutions = institutions.filter(
    (i) =>
      !instSearch.trim() ||
      i.name.toLowerCase().includes(instSearch.toLowerCase()) ||
      (i.slug && i.slug.toLowerCase().includes(instSearch.toLowerCase())),
  );

  const handleAddCredits = async () => {
    if (!creditsOpen) return;
    const amount = Number.parseInt(creditsAmount, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      alert("Enter a valid positive amount");
      return;
    }
    try {
      setCreditsSubmitting(true);
      await adminApi.addCredits(
        creditsOpen.clerkId,
        amount,
        creditsDescription || "Admin adjustment",
      );
      setCreditsOpen(null);
      setCreditsAmount("");
      setCreditsDescription("");
      await loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to add credits");
    } finally {
      setCreditsSubmitting(false);
    }
  };

  const handleSetRole = async (
    u: User,
    accessRole: "user" | "institution_admin",
    institutionId?: string,
  ) => {
    if (accessRole === "institution_admin" && !institutionId) {
      alert("Select an institution when assigning institution_admin");
      return;
    }
    try {
      setRoleUpdating(true);
      await adminApi.updateUser(u.clerkId, {
        accessRole,
        ...(institutionId && { institutionId }),
      });
      setRoleDropdownUser(null);
      await loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to change role");
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleUpdatePlan = async (
    u: User,
    plan: "free" | "premium" | "enterprise",
  ) => {
    try {
      await adminApi.updatePlan(u.clerkId, plan);
      await loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update plan");
    }
  };

  const openScheduleDialog = (u: User) => {
    const instId = (u as any).institutionId;
    if (!instId) {
      alert("Assign this user to an institution before scheduling an interview.");
      return;
    }
    setScheduleUser(u);
    setScheduleRole("Software Engineer");
    setScheduleExperience("2");
    setScheduleCompany("");
    setScheduleDuration("15");
    setScheduleQuestionsText("");
    setSchedulePassingScore("");
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
    if (!scheduleUser || !scheduleRole.trim() || !scheduleAt) return;
    const instId = (scheduleUser as any).institutionId;
    if (!instId) {
      alert("User must belong to an institution.");
      return;
    }
    const exp = Number.parseInt(scheduleExperience, 10);
    if (!Number.isFinite(exp) || exp < 0) {
      alert("Enter valid years of experience.");
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
    const customQs = parseQuestionLines(scheduleQuestionsText);
    try {
      setScheduleSubmitting(true);
      await adminApi.createInterviewSchedule({
        candidateClerkId: scheduleUser.clerkId,
        institutionId: String(instId),
        scheduledAt: new Date(scheduleAt).toISOString(),
        ...(scheduleExpiresAt.trim()
          ? { expiresAt: new Date(scheduleExpiresAt).toISOString() }
          : {}),
        role: scheduleRole.trim(),
        experience: exp,
        language: "en",
        targetCompany: scheduleCompany.trim() || undefined,
        interviewDuration: scheduleDuration === "30" ? 30 : 15,
        ...(customQs.length > 0 ? { customQuestions: customQs } : {}),
        ...(passingScorePayload !== undefined
          ? { passingScore: passingScorePayload }
          : {}),
      });
      setScheduleUser(null);
      toast.success("Interview scheduled");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to schedule");
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (
      !confirm(
        `Delete ${u.name} (${u.email})? This will permanently delete the user, their resumes, interviews, reports, and all related data. This cannot be undone.`,
      )
    )
      return;
    try {
      await adminApi.deleteUser(u.clerkId);
      await loadUsers();
      if (roleDropdownUser?._id === u._id) setRoleDropdownUser(null);
      if (instDropdownUser?._id === u._id) setInstDropdownUser(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const openDefaultUploadResume = async (u: User) => {
    if (!u.resume?.s3Key) {
      toast.error("No default uploaded resume on file for this user");
      return;
    }
    setDefaultResumeLoadingId(String(u._id));
    try {
      const { url } = await adminApi.getUserDefaultResumeUrl(String(u._id));
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      const raw = e as { response?: { data?: { message?: string } } };
      const msg = raw.response?.data?.message;
      toast.error(
        typeof msg === "string" && msg.trim() ? msg : "Could not open resume",
      );
    } finally {
      setDefaultResumeLoadingId(null);
    }
  };

  const handleAddUser = async () => {
    if (!addEmail?.trim()) return;
    const instId = addInstitutionId || undefined;
    try {
      setAddSubmitting(true);
      const result = await adminApi.addUser(addEmail, addPlan, instId);
      setAddOpen(false);
      setAddEmail("");
      setAddPlan("free");
      setAddInstitutionId("");
      alert(result.message);
      await loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to add user");
    } finally {
      setAddSubmitting(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-5">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
          <CardDescription>Platform-wide user management</CardDescription>
          <div className="mt-4 space-y-3">
            <SuperAdminPeriodFilter
              period={period}
              from={from}
              to={to}
              onPeriodChange={(next) => setFilters({ period: next })}
              onRangeChange={(nextFrom, nextTo) =>
                setFilters({ period: "custom", from: nextFrom, to: nextTo })
              }
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative min-w-0 flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 pl-9"
                />
              </div>
              <Button onClick={() => setAddOpen(true)} className="h-11 w-full gap-2 sm:w-auto">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-4 sm:px-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[1080px] border-collapse text-left">
                <TableHeader>
                  <TableRow className="border-b border-border/70 hover:bg-transparent">
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Name
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Email
                    </TableHead>
                    <TableHead className="whitespace-nowrap px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Default upload
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Role
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Institution
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Plan
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Credits
                    </TableHead>
                    <TableHead className="whitespace-nowrap px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Avg. interview score
                    </TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Joined
                    </TableHead>
                    <TableHead className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow
                      key={u._id}
                      className="border-b border-border/60 hover:bg-muted/30"
                    >
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="break-all">{u.email}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {u.resume?.s3Key ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 px-2"
                            title={
                              u.resume?.filename
                                ? `Open uploaded file: ${u.resume.filename}`
                                : "Open default uploaded resume (PDF)"
                            }
                            disabled={defaultResumeLoadingId === String(u._id)}
                            onClick={() => void openDefaultUploadResume(u)}
                          >
                            {defaultResumeLoadingId === String(u._id) ? (
                              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                            ) : (
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="text-xs">View</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[140px]">
                        <div
                          className="relative"
                          ref={
                            roleDropdownUser?._id === u._id
                              ? roleDropdownRef
                              : undefined
                          }
                        >
                          <button
                            type="button"
                            className={`flex min-w-[120px] w-full items-center gap-1 rounded border px-2 py-1.5 text-left text-sm hover:bg-muted/20 ${
                              (u as any).accessRole === "super_admin"
                                ? "border-amber-200 bg-amber-50"
                                : (u as any).accessRole === "institution_admin"
                                  ? "border-border bg-muted/30"
                                  : ""
                            }`}
                            onClick={() =>
                              setRoleDropdownUser(
                                roleDropdownUser?._id === u._id ? null : u,
                              )
                            }
                          >
                            <span
                              className={`flex-1 truncate text-xs font-medium ${
                                (u as any).accessRole === "super_admin"
                                  ? "text-amber-800"
                                  : (u as any).accessRole ===
                                      "institution_admin"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {(u as any).accessRole === "super_admin"
                                ? "Super Admin"
                                : (u as any).accessRole === "institution_admin"
                                  ? "Institution Admin"
                                  : "User"}
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                          </button>
                          {roleDropdownUser?._id === u._id && (
                            <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-md border bg-card py-1 shadow-lg">
                              <button
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                                onClick={() => handleSetRole(u, "user")}
                                disabled={roleUpdating}
                              >
                                User
                              </button>
                              <div className="my-1 border-t" />
                              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                                Institution Admin
                              </div>
                              {institutions.map((inst) => (
                                <button
                                  key={inst._id}
                                  type="button"
                                  className="w-full px-3 py-2 pl-4 text-left text-sm hover:bg-muted/50"
                                  onClick={() =>
                                    handleSetRole(
                                      u,
                                      "institution_admin",
                                      String(inst._id),
                                    )
                                  }
                                  disabled={roleUpdating}
                                >
                                  {inst.name}
                                </button>
                              ))}
                              {institutions.length === 0 && (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No institutions
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        <div
                          className="relative"
                          ref={
                            instDropdownUser?._id === u._id
                              ? instDropdownRef
                              : undefined
                          }
                        >
                          <button
                            type="button"
                            className="flex min-w-[140px] w-full items-center gap-1 rounded border px-2 py-1.5 text-left text-sm hover:bg-muted/20"
                            onClick={() => {
                              setInstDropdownUser(
                                instDropdownUser?._id === u._id ? null : u,
                              );
                              setInstSearch("");
                            }}
                          >
                            <span className="flex-1 truncate">
                              {u.institutionId
                                ? institutions.find(
                                    (i) =>
                                      String(i._id) === String(u.institutionId),
                                  )?.name || "Select"
                                : "Add institution"}
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                          </button>
                          {instDropdownUser?._id === u._id && (
                            <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-md border bg-card py-1 shadow-lg">
                              <div className="px-2 pb-2">
                                <Input
                                  placeholder="Search institutions..."
                                  value={instSearch}
                                  onChange={(e) => setInstSearch(e.target.value)}
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                <button
                                  type="button"
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                                  onClick={() => handleSetInstitution(u, null)}
                                  disabled={instUpdating}
                                >
                                  No institution
                                </button>
                                {filteredInstitutions.map((inst) => (
                                  <button
                                    key={inst._id}
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                                    onClick={() =>
                                      handleSetInstitution(u, String(inst._id))
                                    }
                                    disabled={instUpdating}
                                  >
                                    {inst.name}
                                  </button>
                                ))}
                                {filteredInstitutions.length === 0 && (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">
                                    No institutions found
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <select
                          className="app-control text-xs"
                          value={(u as any).subscription?.plan || "free"}
                          onChange={(e) =>
                            handleUpdatePlan(
                              u,
                              e.target.value as
                                | "free"
                                | "premium"
                                | "enterprise",
                            )
                          }
                        >
                          <option value="free">Free</option>
                          <option value="premium">Premium</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          {u.credits?.total ?? 0}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setCreditsOpen(u);
                              setCreditsAmount("");
                              setCreditsDescription("");
                            }}
                            title="Add credits"
                          >
                            <Coins className="h-4 w-4" />
                          </Button>
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {u.averageInterviewScore != null &&
                        !Number.isNaN(Number(u.averageInterviewScore)) ? (
                          <span
                            className={`font-semibold tabular-nums ${getScoreColor(
                              Number(u.averageInterviewScore),
                            )}`}
                          >
                            {u.averageInterviewScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => openScheduleDialog(u)}
                          title="Schedule interview"
                          aria-label="Schedule interview"
                        >
                          <CalendarClock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          title="View this user’s resumes, interviews, reports, and recordings"
                          onClick={() => {
                            const q = new URLSearchParams();
                            if (u.name) q.set("name", u.name);
                            if (u.email) q.set("email", u.email);
                            const suffix = q.toString()
                              ? `?${q.toString()}`
                              : "";
                            router.push(
                              `/super-admin/users/${encodeURIComponent(String(u._id))}${suffix}`,
                            );
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 text-red-600"
                          onClick={() => handleDeleteUser(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {total > limit && (
            <div className="mt-4 flex justify-between gap-2">
              <Button
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={(page + 1) * limit >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!scheduleUser}
        onOpenChange={(o) => {
          if (!o) setScheduleUser(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule interview</DialogTitle>
            <DialogDescription>
              {scheduleUser
                ? `${scheduleUser.name ?? scheduleUser.email} — institution required on the user record`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label htmlFor="sa-sch-at">Date & time</Label>
              <Input
                id="sa-sch-at"
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sa-sch-expires">Expire deadline (optional)</Label>
              <Input
                id="sa-sch-expires"
                type="datetime-local"
                value={scheduleExpiresAt}
                onChange={(e) => setScheduleExpiresAt(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Latest time the candidate can start. Must be on or after 24 hours
                before the scheduled time. Leave empty for no upper limit.
              </p>
            </div>
            <div>
              <Label htmlFor="sa-sch-role">Role / position</Label>
              <Input
                id="sa-sch-role"
                value={scheduleRole}
                onChange={(e) => setScheduleRole(e.target.value)}
                placeholder="e.g. Backend Engineer"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sa-sch-exp">Years of experience</Label>
              <Input
                id="sa-sch-exp"
                type="number"
                min={0}
                value={scheduleExperience}
                onChange={(e) => setScheduleExperience(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sa-sch-co">Target company (optional)</Label>
              <Input
                id="sa-sch-co"
                value={scheduleCompany}
                onChange={(e) => setScheduleCompany(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sa-sch-dur">Duration</Label>
              <select
                id="sa-sch-dur"
                className="app-control mt-1 w-full bg-card"
                value={scheduleDuration}
                onChange={(e) =>
                  setScheduleDuration(e.target.value as "15" | "30")
                }
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
            <div>
              <Label htmlFor="sa-sch-q" className="mb-1 block">
                Interview questions (optional)
              </Label>
              <InterviewQuestionsField
                id="sa-sch-q"
                value={scheduleQuestionsText}
                onChange={setScheduleQuestionsText}
                disabled={scheduleSubmitting}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sa-sch-pass">Passing score (optional)</Label>
              <Input
                id="sa-sch-pass"
                type="number"
                min={0}
                max={100}
                step={1}
                value={schedulePassingScore}
                onChange={(e) => setSchedulePassingScore(e.target.value)}
                placeholder="0–100"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setScheduleUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSchedule}
              disabled={scheduleSubmitting || !scheduleRole.trim() || !scheduleAt}
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

      <Dialog open={!!creditsOpen} onOpenChange={() => setCreditsOpen(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>
              Add credits to {creditsOpen?.name} ({creditsOpen?.email}). Current
              balance: {creditsOpen?.credits?.total ?? 0}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="credits-amount">Amount</Label>
              <Input
                id="credits-amount"
                type="number"
                min={1}
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value)}
                placeholder="e.g. 100"
              />
            </div>
            <div>
              <Label htmlFor="credits-desc">Description (optional)</Label>
              <Input
                id="credits-desc"
                value={creditsDescription}
                onChange={(e) => setCreditsDescription(e.target.value)}
                placeholder="Admin adjustment"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setCreditsOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCredits}
              disabled={
                !creditsAmount ||
                Number.parseInt(creditsAmount, 10) <= 0 ||
                creditsSubmitting
              }
            >
              {creditsSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Credits"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Send an invitation or add an existing user to an institution
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="add-plan">Plan</Label>
              <select
                id="add-plan"
                className="app-control w-full bg-card"
                value={addPlan}
                onChange={(e) => setAddPlan(e.target.value as any)}
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <Label htmlFor="add-institution">Institution (optional)</Label>
              <select
                id="add-institution"
                className="app-control w-full bg-card"
                value={addInstitutionId}
                onChange={(e) => setAddInstitutionId(e.target.value)}
              >
                <option value="">No institution</option>
                {institutions.map((inst) => (
                  <option key={inst._id} value={String(inst._id)}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={!addEmail?.trim() || addSubmitting}
            >
              {addSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
