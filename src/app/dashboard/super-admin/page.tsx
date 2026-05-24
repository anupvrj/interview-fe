"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
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
import {
  Loader2,
  Shield,
  Building2,
  Plus,
  Users,
  Search,
  Trash2,
  Coins,
  ChevronDown,
  Pencil,
  CalendarClock,
  LayoutDashboard,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { userApi, adminApi, User } from "@/lib/api";
import {
  formatDate,
  getScoreColor,
  parseQuestionLines,
  toDatetimeLocalValue,
} from "@/lib/utils";

export default function SuperAdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
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

  // Create institution dialog
  const [instOpen, setInstOpen] = useState(false);
  const [instName, setInstName] = useState("");
  const [instSlug, setInstSlug] = useState("");
  const [instDomain, setInstDomain] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [instMaxUsers, setInstMaxUsers] = useState("");
  const [instSubmitting, setInstSubmitting] = useState(false);

  const [editInst, setEditInst] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMaxUsers, setEditMaxUsers] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Institution dropdown (which user's dropdown is open)
  const [instDropdownUser, setInstDropdownUser] = useState<User | null>(null);
  const [instSearch, setInstSearch] = useState("");
  const [instUpdating, setInstUpdating] = useState(false);
  const instDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!instDropdownUser) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (instDropdownRef.current && !instDropdownRef.current.contains(e.target as Node)) {
        setInstDropdownUser(null);
        setInstSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [instDropdownUser]);

  // Role dropdown
  const [roleDropdownUser, setRoleDropdownUser] = useState<User | null>(null);
  const [roleUpdating, setRoleUpdating] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roleDropdownUser) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownUser(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [roleDropdownUser]);

  // Add user dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPlan, setAddPlan] = useState<"free" | "premium" | "enterprise">("free");
  const [addInstitutionId, setAddInstitutionId] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Add credits dialog
  const [creditsOpen, setCreditsOpen] = useState<User | null>(null);
  const [creditsAmount, setCreditsAmount] = useState("");
  const [creditsDescription, setCreditsDescription] = useState("");
  const [creditsSubmitting, setCreditsSubmitting] = useState(false);

  const [schedules, setSchedules] = useState<any[]>([]);
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
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadProfile();
    }
  }, [isLoaded, user]);

  const loadSchedules = async () => {
    try {
      const s = await adminApi.listInterviewSchedules();
      setSchedules(s);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (profile?.accessRole === "super_admin") {
      loadInstitutions();
      loadUsers();
      loadSchedules();
    }
  }, [profile, page, search]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const p = await userApi.getMyProfile();
      setProfile(p);
      if (p.accessRole !== "super_admin") {
        router.replace("/dashboard");
      }
    } catch {
      router.replace("/dashboard");
    }
  };

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
      });
      setUsers(data);
      setTotal(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstitution = async () => {
    if (!instName.trim()) return;
    const payload: Parameters<typeof adminApi.createInstitution>[0] = {
      name: instName.trim(),
      slug: instSlug.trim() || undefined,
      domain: instDomain.trim() || undefined,
      contactEmail: instEmail.trim() || undefined,
    };
    const mu = instMaxUsers.trim();
    if (mu !== "") {
      const n = Number.parseInt(mu, 10);
      if (!Number.isFinite(n) || n < 1) {
        alert("Max users must be a positive number, or leave empty for unlimited.");
        return;
      }
      payload.maxUsers = n;
    }
    try {
      setInstSubmitting(true);
      await adminApi.createInstitution(payload);
      setInstOpen(false);
      setInstName("");
      setInstSlug("");
      setInstDomain("");
      setInstEmail("");
      setInstMaxUsers("");
      loadInstitutions();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create institution");
    } finally {
      setInstSubmitting(false);
    }
  };

  const openEditInstitution = (inst: any) => {
    setEditInst(inst);
    setEditName(inst.name ?? "");
    setEditSlug(inst.slug ?? "");
    setEditDomain(inst.domain ?? "");
    setEditEmail(inst.contactEmail ?? "");
    setEditMaxUsers(
      inst.maxUsers != null && inst.maxUsers !== "" ? String(inst.maxUsers) : ""
    );
  };

  const handleUpdateInstitution = async () => {
    if (!editInst?._id || !editName.trim()) return;
    const mu = editMaxUsers.trim();
    let maxUsers: number | null | undefined = undefined;
    if (mu === "") {
      maxUsers = null;
    } else {
      const n = Number.parseInt(mu, 10);
      if (!Number.isFinite(n) || n < 1) {
        alert("Max users must be a positive number, or leave empty for unlimited.");
        return;
      }
      maxUsers = n;
    }
    try {
      setEditSubmitting(true);
      await adminApi.updateInstitution(String(editInst._id), {
        name: editName.trim(),
        slug: editSlug.trim(),
        domain: editDomain.trim() || null,
        contactEmail: editEmail.trim() || null,
        maxUsers,
      });
      setEditInst(null);
      loadInstitutions();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update institution");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteInstitution = async (inst: any) => {
    if (
      !confirm(
        `Delete institution "${inst.name}"? Deletion is only allowed when no users are assigned. This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await adminApi.deleteInstitution(String(inst._id));
      loadInstitutions();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete institution");
    }
  };

  const handleSetInstitution = async (u: User, institutionId: string | null) => {
    try {
      setInstUpdating(true);
      await adminApi.updateUser(u.clerkId, {
        ...(institutionId !== undefined && { institutionId: institutionId || null }),
      });
      setInstDropdownUser(null);
      setInstSearch("");
      loadUsers();
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
      (i.slug && i.slug.toLowerCase().includes(instSearch.toLowerCase()))
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
      await adminApi.addCredits(creditsOpen.clerkId, amount, creditsDescription || "Admin adjustment");
      setCreditsOpen(null);
      setCreditsAmount("");
      setCreditsDescription("");
      loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to add credits");
    } finally {
      setCreditsSubmitting(false);
    }
  };

  const handleSetRole = async (
    u: User,
    accessRole: "user" | "institution_admin",
    institutionId?: string
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
      loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to change role");
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleUpdatePlan = async (u: User, plan: "free" | "premium" | "enterprise") => {
    try {
      await adminApi.updatePlan(u.clerkId, plan);
      loadUsers();
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
    setScheduleLang("en");
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
        language: scheduleLang,
        targetCompany: scheduleCompany.trim() || undefined,
        interviewDuration: scheduleDuration === "30" ? 30 : 15,
        ...(customQs.length > 0 ? { customQuestions: customQs } : {}),
        ...(passingScorePayload !== undefined ? { passingScore: passingScorePayload } : {}),
      });
      setScheduleUser(null);
      await loadSchedules();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to schedule");
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const handleCancelSchedule = async (scheduleId: string) => {
    if (!confirm("Cancel this scheduled interview?")) return;
    try {
      await adminApi.cancelInterviewSchedule(scheduleId);
      loadSchedules();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to cancel");
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
      loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to add user");
    } finally {
      setAddSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Shield className="h-7 w-7 text-[#7367F0]" />
          Super Admin
        </h1>
        <p className="mt-1 text-muted-foreground">
          InterviewTrix internal admin - manage institutions and platform users
        </p>
      </div>

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Institutions
          </CardTitle>
          <CardDescription>Create and manage institutions</CardDescription>
          <Button
            className="w-fit mt-2"
            onClick={() => setInstOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Institution
          </Button>
        </CardHeader>
        <CardContent>
          {institutions.length === 0 ? (
            <p className="text-slate-500">No institutions yet</p>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[720px] border-collapse text-left">
                <TableHeader>
                  <TableRow className="border-b border-border/70 hover:bg-transparent">
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Name</TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Slug</TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Domain</TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Contact</TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Users</TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Max users</TableHead>
                    <TableHead className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Dashboard & actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institutions.map((inst) => (
                    <TableRow key={inst._id} className="border-b border-border/60 hover:bg-muted/30">
                      <TableCell className="font-medium">{inst.name}</TableCell>
                      <TableCell>{inst.slug}</TableCell>
                      <TableCell>{inst.domain || "—"}</TableCell>
                      <TableCell>{inst.contactEmail || "—"}</TableCell>
                      <TableCell>{inst.userCount ?? 0}</TableCell>
                      <TableCell>
                        {inst.maxUsers != null ? inst.maxUsers : "Unlimited"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/institute/${String(inst._id)}`)
                            }
                            title="Open institution dashboard"
                            aria-label="Open institution dashboard"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditInstitution(inst)}
                            title="Edit institution"
                            aria-label="Edit institution"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteInstitution(inst)}
                            title="Delete institution"
                            aria-label="Delete institution"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {schedules.filter((s) => s.status === "scheduled").length > 0 && (
        <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
          <CardHeader className="border-b border-border/60 px-5 py-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Scheduled interviews
            </CardTitle>
            <CardDescription>
              Platform-wide — candidates see these on their dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/70 hover:bg-transparent">
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">When</TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Candidate</TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Role</TableHead>
                    <TableHead className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules
                    .filter((s) => s.status === "scheduled")
                    .map((s) => (
                      <TableRow key={s._id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(s.scheduledAt).toLocaleString()}
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
                            {!s.candidateName?.trim() &&
                            !s.candidateEmail?.trim() ? (
                              <span className="font-mono text-[11px] text-slate-400">
                                {s.candidateClerkId}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>{s.role}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleCancelSchedule(String(s._id))}
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Users
          </CardTitle>
          <CardDescription>Platform-wide user management</CardDescription>
          <div className="flex gap-4 mt-4 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[1080px] border-collapse text-left">
                <TableHeader>
                  <TableRow className="border-b border-border/70 hover:bg-transparent">
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Name</TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Email</TableHead>
                    <TableHead className="whitespace-nowrap px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Default upload</TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Role</TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Institution</TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Plan</TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Credits</TableHead>
                    <TableHead className="whitespace-nowrap px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Avg. interview score</TableHead>
                    <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Joined</TableHead>
                    <TableHead className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                  <TableRow key={u._id} className="border-b border-border/60 hover:bg-muted/30">
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
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
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      <div
                        className="relative"
                        ref={roleDropdownUser?._id === u._id ? roleDropdownRef : undefined}
                      >
                        <button
                          type="button"
                          className={`flex items-center gap-1 w-full text-left text-sm border rounded px-2 py-1.5 hover:bg-slate-50 min-w-[120px] ${
                            (u as any).accessRole === "super_admin"
                              ? "bg-amber-50 border-amber-200"
                              : (u as any).accessRole === "institution_admin"
                              ? "bg-muted/30 border-border"
                              : ""
                          }`}
                          onClick={() =>
                            setRoleDropdownUser(
                              roleDropdownUser?._id === u._id ? null : u
                            )
                          }
                        >
                          <span
                            className={`flex-1 truncate text-xs font-medium ${
                              (u as any).accessRole === "super_admin"
                                ? "text-amber-800"
                                : (u as any).accessRole === "institution_admin"
                                ? "text-primary"
                                : "text-gray-700"
                            }`}
                          >
                            {(u as any).accessRole === "super_admin"
                              ? "Super Admin"
                              : (u as any).accessRole === "institution_admin"
                              ? "Institution Admin"
                              : "User"}
                          </span>
                          <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
                        </button>
                        {roleDropdownUser?._id === u._id && (
                          <div className="absolute top-full left-0 mt-1 z-50 bg-white border rounded-md shadow-lg py-1 min-w-[180px]">
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                              onClick={() => handleSetRole(u, "user")}
                              disabled={roleUpdating}
                            >
                              User
                            </button>
                            <div className="border-t my-1" />
                            <div className="px-2 py-1 text-xs text-slate-500 font-medium">
                              Institution Admin
                            </div>
                            {institutions.map((inst) => (
                              <button
                                key={inst._id}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 pl-4"
                                onClick={() =>
                                  handleSetRole(u, "institution_admin", String(inst._id))
                                }
                                disabled={roleUpdating}
                              >
                                {inst.name}
                              </button>
                            ))}
                            {institutions.length === 0 && (
                              <div className="px-3 py-2 text-sm text-slate-500">
                                No institutions
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      <div className="relative" ref={instDropdownUser?._id === u._id ? instDropdownRef : undefined}>
                        <button
                          type="button"
                          className="flex items-center gap-1 w-full text-left text-sm border rounded px-2 py-1.5 hover:bg-slate-50 min-w-[140px]"
                          onClick={() => {
                            setInstDropdownUser(instDropdownUser?._id === u._id ? null : u);
                            setInstSearch("");
                          }}
                        >
                          <span className="flex-1 truncate">
                            {u.institutionId
                              ? institutions.find(
                                  (i) => String(i._id) === String(u.institutionId)
                                )?.name || "Select"
                              : "Add institution"}
                          </span>
                          <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
                        </button>
                        {instDropdownUser?._id === u._id && (
                          <div className="absolute top-full left-0 mt-1 z-50 bg-white border rounded-md shadow-lg py-1 min-w-[200px]">
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
                                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                                onClick={() => handleSetInstitution(u, null)}
                                disabled={instUpdating}
                              >
                                No institution
                              </button>
                              {filteredInstitutions.map((inst) => (
                                <button
                                  key={inst._id}
                                  type="button"
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                                  onClick={() =>
                                    handleSetInstitution(u, String(inst._id))
                                  }
                                  disabled={instUpdating}
                                >
                                  {inst.name}
                                </button>
                              ))}
                              {filteredInstitutions.length === 0 && (
                                <div className="px-3 py-2 text-sm text-slate-500">
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
                        className="text-xs border rounded px-2 py-1"
                        value={(u as any).subscription?.plan || "free"}
                        onChange={(e) =>
                          handleUpdatePlan(
                            u,
                            e.target.value as "free" | "premium" | "enterprise"
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
                          <Coins className="w-4 h-4" />
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
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
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
                          const suffix = q.toString() ? `?${q.toString()}` : "";
                          router.push(
                            `/dashboard/super-admin/users/${encodeURIComponent(String(u._id))}${suffix}`
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
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {total > limit && (
            <div className="flex justify-between mt-4">
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
              <p className="mt-1 text-xs text-slate-500">
                Latest time the candidate can start. Must be on or after 24 hours before the
                scheduled time. Leave empty for no upper limit.
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
              <Label htmlFor="sa-sch-lang">Language</Label>
              <select
                id="sa-sch-lang"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={scheduleLang}
                onChange={(e) => setScheduleLang(e.target.value as "en" | "hi")}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
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
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={scheduleDuration}
                onChange={(e) => setScheduleDuration(e.target.value as "15" | "30")}
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
          <DialogFooter>
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

      <Dialog open={instOpen} onOpenChange={setInstOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Institution</DialogTitle>
            <DialogDescription>
              Add a new institution (college, company) to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="inst-name">Name</Label>
              <Input
                id="inst-name"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="Acme University"
              />
            </div>
            <div>
              <Label htmlFor="inst-slug">Slug (optional)</Label>
              <Input
                id="inst-slug"
                value={instSlug}
                onChange={(e) => setInstSlug(e.target.value)}
                placeholder="acme-university"
              />
            </div>
            <div>
              <Label htmlFor="inst-domain">Domain (optional)</Label>
              <Input
                id="inst-domain"
                value={instDomain}
                onChange={(e) => setInstDomain(e.target.value)}
                placeholder="acme.edu"
              />
            </div>
            <div>
              <Label htmlFor="inst-email">Contact Email (optional)</Label>
              <Input
                id="inst-email"
                type="email"
                value={instEmail}
                onChange={(e) => setInstEmail(e.target.value)}
                placeholder="admin@acme.edu"
              />
            </div>
            <div>
              <Label htmlFor="inst-max-users">Max users (optional)</Label>
              <Input
                id="inst-max-users"
                type="number"
                min={1}
                step={1}
                value={instMaxUsers}
                onChange={(e) => setInstMaxUsers(e.target.value)}
                placeholder="Unlimited if empty"
              />
              <p className="mt-1 text-xs text-slate-500">
                Caps how many users can be added to this institution. Leave empty for no limit.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateInstitution}
              disabled={!instName.trim() || instSubmitting}
            >
              {instSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editInst}
        onOpenChange={(o) => !o && setEditInst(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit institution</DialogTitle>
            <DialogDescription>
              Update name, slug, domain, contact, and user cap
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-inst-name">Name</Label>
              <Input
                id="edit-inst-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Institution name"
              />
            </div>
            <div>
              <Label htmlFor="edit-inst-slug">Slug</Label>
              <Input
                id="edit-inst-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                placeholder="url-safe-slug"
              />
            </div>
            <div>
              <Label htmlFor="edit-inst-domain">Domain (optional)</Label>
              <Input
                id="edit-inst-domain"
                value={editDomain}
                onChange={(e) => setEditDomain(e.target.value)}
                placeholder="college.edu"
              />
            </div>
            <div>
              <Label htmlFor="edit-inst-email">Contact email (optional)</Label>
              <Input
                id="edit-inst-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="admin@example.edu"
              />
            </div>
            <div>
              <Label htmlFor="edit-inst-max">Max users</Label>
              <Input
                id="edit-inst-max"
                type="number"
                min={1}
                step={1}
                value={editMaxUsers}
                onChange={(e) => setEditMaxUsers(e.target.value)}
                placeholder="Unlimited if empty"
              />
              <p className="mt-1 text-xs text-slate-500">
                Empty = unlimited. Existing users are not removed if you lower the cap.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditInst(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateInstitution}
              disabled={!editName.trim() || editSubmitting}
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

      <Dialog open={!!creditsOpen} onOpenChange={() => setCreditsOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>
              Add credits to {creditsOpen?.name} ({creditsOpen?.email}). Current balance: {creditsOpen?.credits?.total ?? 0}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCredits}
              disabled={!creditsAmount || Number.parseInt(creditsAmount, 10) <= 0 || creditsSubmitting}
            >
              {creditsSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Add Credits"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
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
                className="w-full border rounded px-3 py-2"
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
                className="w-full border rounded px-3 py-2"
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={!addEmail?.trim() || addSubmitting}
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
