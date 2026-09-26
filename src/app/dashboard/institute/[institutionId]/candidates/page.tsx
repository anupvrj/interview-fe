"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Users,
  Plus,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Layers,
  X,
  Pencil,
} from "lucide-react";
import { userApi, adminApi, User, planApi } from "@/lib/api";
import {
  canViewInstitutePage,
  instituteRoleCanInviteCandidates,
  isInstituteStaff,
} from "@/lib/institute-access";
import { dialogPortaledPickerHandlers } from "@/lib/dialog-portaled-picker-handlers";
import { biometricApi, type BiometricCredential } from "@/lib/biometric/api";
import { cn, formatDate } from "@/lib/utils";
import {
  InstituteEmptyState,
  InstituteLoader,
  InstituteTableShell,
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { InstituteCandidatesHero } from "@/components/institute/InstituteCandidatesHero";
import { FormField } from "@/components/app/FormField";
import { SearchInput } from "@/components/app/SearchInput";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";

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

type InstituteInvitePlan =
  | "free"
  | "general_pass"
  | "tech_basic"
  | "tech_pro"
  | "enterprise";

const INSTITUTE_PLAN_OPTIONS: { value: InstituteInvitePlan; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "general_pass", label: "General Pass" },
  { value: "tech_basic", label: "Tech Basic" },
  { value: "tech_pro", label: "Tech Pro" },
  { value: "enterprise", label: "Enterprise" },
];

function normalizeApiPlan(apiPlan: string | undefined): InstituteInvitePlan {
  const p = (apiPlan || "free").toLowerCase().replace(/-/g, "_");
  if (p === "enterprise") return "enterprise";
  if (p === "tech_pro" || p === "premium" || p === "elite") return "tech_pro";
  if (p === "tech_basic" || p === "starter" || p === "basic") return "tech_basic";
  if (p === "general_pass" || p === "general") return "general_pass";
  return "free";
}

function planBadgeLabel(apiPlan: string): string {
  const id = normalizeApiPlan(apiPlan);
  return INSTITUTE_PLAN_OPTIONS.find((o) => o.value === id)?.label ?? id;
}

type InstituteBatchOption = {
  _id: string;
  name: string;
  memberCount: number;
  memberClerkIds: string[];
};

export default function InstituteCandidatesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const institutionId = params.institutionId as string;
  const [profile, setProfile] = useState<any>(null);
  const [showIdentityColumn, setShowIdentityColumn] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [selectedBatchLabel, setSelectedBatchLabel] = useState("");
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [batchCatalog, setBatchCatalog] = useState<InstituteBatchOption[]>([]);
  const [batchCatalogLoaded, setBatchCatalogLoaded] = useState(false);
  const [batchCatalogLoading, setBatchCatalogLoading] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Add user dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addCandidateName, setAddCandidateName] = useState("");
  const [addBatchId, setAddBatchId] = useState("");
  const [addBatchLabel, setAddBatchLabel] = useState("");
  const [addBatchSearch, setAddBatchSearch] = useState("");
  const [addBatchMenuOpen, setAddBatchMenuOpen] = useState(false);
  const [addPlan, setAddPlan] = useState<InstituteInvitePlan>("free");
  const [planOptions, setPlanOptions] = useState(INSTITUTE_PLAN_OPTIONS);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit candidate dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editPlan, setEditPlan] = useState<InstituteInvitePlan>("free");
  const [editBatchId, setEditBatchId] = useState("");
  const [editBatchLabel, setEditBatchLabel] = useState("");
  const [editBatchSearch, setEditBatchSearch] = useState("");
  const [editBatchMenuOpen, setEditBatchMenuOpen] = useState(false);
  const [editInitialBatchIds, setEditInitialBatchIds] = useState<string[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [reviewUser, setReviewUser] = useState<User | null>(null);
  const [reviewCred, setReviewCred] = useState<BiometricCredential | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadProfile();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    setPage(0);
  }, [search, batchFilter]);

  useEffect(() => {
    if (profile && canViewInstitutePage(profile, institutionId, "candidates")) {
      loadUsers();
    }
  }, [profile, page, search, batchFilter, institutionId]);

  const loadBatchCatalog = useCallback(async (opts?: { force?: boolean }) => {
    if (batchCatalogLoaded && !opts?.force) return batchCatalog;
    setBatchCatalogLoading(true);
    try {
      const list = await adminApi.listBatches(institutionId);
      const mapped = (list as Array<{ _id?: string; name?: string; memberClerkIds?: string[] }>)
        .map((b) => ({
          _id: String(b._id ?? ""),
          name: String(b.name ?? "Untitled batch"),
          memberClerkIds: Array.isArray(b.memberClerkIds)
            ? b.memberClerkIds.map(String)
            : [],
          memberCount: b.memberClerkIds?.length ?? 0,
        }))
        .filter((b) => b._id);
      mapped.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      setBatchCatalog(mapped);
      setBatchCatalogLoaded(true);
      return mapped;
    } catch {
      setBatchCatalog([]);
      setBatchCatalogLoaded(true);
      return [] as InstituteBatchOption[];
    } finally {
      setBatchCatalogLoading(false);
    }
  }, [batchCatalogLoaded, institutionId]);

  useEffect(() => {
    const q = batchSearchQuery.trim();
    if (!q || batchFilter) return;
    const timer = setTimeout(() => {
      void loadBatchCatalog();
    }, 300);
    return () => clearTimeout(timer);
  }, [batchSearchQuery, batchFilter, loadBatchCatalog]);

  const batchSearchMatches = useMemo(() => {
    const q = batchSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return batchCatalog
      .filter((b) => b.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [batchCatalog, batchSearchQuery]);

  const addBatchSearchMatches = useMemo(() => {
    const q = addBatchSearch.trim().toLowerCase();
    const list = !q
      ? batchCatalog
      : batchCatalog.filter((b) => b.name.toLowerCase().includes(q));
    return list.slice(0, 50);
  }, [batchCatalog, addBatchSearch]);

  const editBatchSearchMatches = useMemo(() => {
    const q = editBatchSearch.trim().toLowerCase();
    const list = !q
      ? batchCatalog
      : batchCatalog.filter((b) => b.name.toLowerCase().includes(q));
    return list.slice(0, 50);
  }, [batchCatalog, editBatchSearch]);

  const resetAddUserForm = () => {
    setAddEmail("");
    setAddCandidateName("");
    setAddBatchId("");
    setAddBatchLabel("");
    setAddBatchSearch("");
    setAddBatchMenuOpen(false);
    setAddPlan("free");
  };

  const clearListFilters = () => {
    setSearch("");
    setBatchFilter("");
    setSelectedBatchLabel("");
    setBatchSearchQuery("");
  };

  useEffect(() => {
    planApi
      .getAllPlans()
      .then((plans) => {
        const labelById = new Map<string, string>();
        for (const p of plans as Array<{
          planId?: string;
          id?: string;
          slug?: string;
          name?: string;
          displayName?: string;
        }>) {
          const slug = normalizeApiPlan(p.planId || p.slug || p.id);
          const label = p.displayName || p.name;
          if (label) labelById.set(slug, label);
        }
        setPlanOptions(
          INSTITUTE_PLAN_OPTIONS.map((o) => ({
            value: o.value,
            label: labelById.get(o.value) || o.label,
          })),
        );
      })
      .catch(() => {});
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const p = await userApi.getMyProfile();
      setProfile(p);
      if (!canViewInstitutePage(p, institutionId, "candidates")) {
        router.replace("/dashboard");
        return;
      }
      if (isInstituteStaff(p.accessRole)) {
        setShowIdentityColumn(Boolean(p.institutionFlags?.biometricVerification));
      } else {
        try {
          const institutions = await adminApi.listInstitutions();
          const inst = institutions.find(
            (item: { _id?: string }) => String(item._id) === String(institutionId),
          );
          setShowIdentityColumn(
            Boolean(inst?.platformFlags?.biometricVerification),
          );
        } catch {
          setShowIdentityColumn(false);
        }
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
        ...(batchFilter ? { batchId: batchFilter } : {}),
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
    if (!addEmail?.trim() || !addCandidateName?.trim()) return;
    const instId =
      profile?.accessRole === "super_admin" ? institutionId : profile?.institutionId;
    if (isInstituteStaff(profile?.accessRole) && !instId) {
      toast.error("Institution is required");
      return;
    }
    try {
      setAddSubmitting(true);
      const result = await adminApi.addUser(
        addEmail,
        addPlan,
        instId,
        {
          candidateName: addCandidateName.trim(),
          batchId: addBatchId || undefined,
        },
      );
      setAddOpen(false);
      resetAddUserForm();
      toast.success(result.message);
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add user");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    try {
      await adminApi.deleteUser(u.clerkId);
      toast.success("User removed");
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleteTarget(null);
    }
  };

  const resetEditForm = () => {
    setEditUser(null);
    setEditPlan("free");
    setEditBatchId("");
    setEditBatchLabel("");
    setEditBatchSearch("");
    setEditBatchMenuOpen(false);
    setEditInitialBatchIds([]);
  };

  const openEditDialog = async (u: User) => {
    setEditUser(u);
    setEditPlan(normalizeApiPlan(u.subscription?.plan));
    setEditBatchSearch("");
    setEditBatchMenuOpen(false);
    setEditOpen(true);
    const catalog =
      (await loadBatchCatalog({ force: true })) ?? batchCatalog;
    const memberships = catalog.filter((b) =>
      b.memberClerkIds.includes(u.clerkId),
    );
    setEditInitialBatchIds(memberships.map((b) => b._id));
    if (memberships.length > 0) {
      setEditBatchId(memberships[0]!._id);
      setEditBatchLabel(memberships[0]!.name);
    } else {
      setEditBatchId("");
      setEditBatchLabel("");
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    const currentPlan = normalizeApiPlan(editUser.subscription?.plan);
    try {
      setEditSubmitting(true);

      if (editPlan !== currentPlan) {
        await adminApi.updatePlan(editUser.clerkId, editPlan);
      }

      const targetBatchId = editBatchId || null;
      const toRemove = editInitialBatchIds.filter((id) => id !== targetBatchId);
      for (const batchId of toRemove) {
        await adminApi.removeBatchMember(batchId, editUser.clerkId);
      }
      if (targetBatchId && !editInitialBatchIds.includes(targetBatchId)) {
        await adminApi.addBatchMembers(targetBatchId, {
          clerkIds: [editUser.clerkId],
        });
      }

      setBatchCatalogLoaded(false);
      setEditOpen(false);
      resetEditForm();
      toast.success("Candidate updated");
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update candidate");
    } finally {
      setEditSubmitting(false);
    }
  };

  const rangeStart = total === 0 ? 0 : page * limit + 1;
  const rangeEnd = Math.min((page + 1) * limit, total);
  const hasBatchFilter = Boolean(batchFilter);
  const batchFilterLabel = selectedBatchLabel || batchFilter;
  const hasSearch = Boolean(search.trim());

  if (!profile) {
    return <InstituteLoader />;
  }

  const canInvite = instituteRoleCanInviteCandidates(profile.accessRole);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <InstituteCandidatesHero memberCount={total} loading={loading} />

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold text-foreground">
                Candidate directory
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {!loading && total > 0
                  ? hasBatchFilter && batchFilterLabel
                    ? `Showing ${total} member${total === 1 ? "" : "s"} in “${batchFilterLabel}”.`
                    : `Manage plans, batches, and reports for ${total} member${total === 1 ? "" : "s"}.`
                  : hasBatchFilter
                    ? "No members match this batch filter."
                    : "Invite your first candidate to populate this list."}
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:min-w-[min(100%,42rem)] lg:flex-1 lg:max-w-2xl">
              <SearchInput
                id="cand-search"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                containerClassName="max-w-none w-full min-w-0 flex-1 border-border bg-card shadow-sm"
              />
              <div className="relative w-full min-w-0 sm:max-w-[240px] sm:flex-1">
                {hasBatchFilter ? (
                  <div className="app-control flex h-11 min-w-0 items-center gap-2.5 border-border bg-card px-3 shadow-sm">
                    <Layers className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {batchFilterLabel}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Clear batch filter"
                      onClick={() => {
                        setBatchFilter("");
                        setSelectedBatchLabel("");
                        setBatchSearchQuery("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <SearchInput
                      id="cand-batch-search"
                      leadingIcon={Layers}
                      placeholder="Search batch…"
                      value={batchSearchQuery}
                      onChange={(e) => setBatchSearchQuery(e.target.value)}
                      containerClassName="max-w-none w-full border-border bg-card shadow-sm"
                      aria-expanded={batchSearchMatches.length > 0}
                      aria-controls="cand-batch-search-results"
                      autoComplete="off"
                    />
                    {batchSearchQuery.trim() ? (
                      <div
                        id="cand-batch-search-results"
                        className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-md border border-border bg-card shadow-lg"
                      >
                        {batchCatalogLoading ? (
                          <p className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Loading batches…
                          </p>
                        ) : batchSearchMatches.length === 0 ? (
                          <p className="px-3 py-2.5 text-xs text-muted-foreground">
                            No batches match “{batchSearchQuery.trim()}”.
                          </p>
                        ) : (
                          <ul className="max-h-44 overflow-y-auto py-1">
                            {batchSearchMatches.map((b) => (
                              <li key={b._id}>
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
                                  onClick={() => {
                                    setBatchFilter(b._id);
                                    setSelectedBatchLabel(b.name);
                                    setBatchSearchQuery("");
                                  }}
                                >
                                  <span className="min-w-0 truncate font-medium text-foreground">
                                    {b.name}
                                  </span>
                                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                    {b.memberCount} member{b.memberCount === 1 ? "" : "s"}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
              {canInvite ? (
                <Button
                  type="button"
                  onClick={() => {
                    resetAddUserForm();
                    setAddOpen(true);
                    void loadBatchCatalog();
                  }}
                  className={cn(institutePrimaryClass, "h-11 shrink-0 gap-2 sm:w-auto")}
                >
                  <Plus className="h-4 w-4" />
                  Add user
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-9 w-9 animate-spin text-[#7367F0]" />
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 py-6 sm:px-6">
              <InstituteEmptyState
                icon={Users}
                title={
                  hasSearch
                    ? "No matches"
                    : hasBatchFilter
                      ? "No members in this batch"
                      : "No candidates yet"
                }
                description={
                  hasSearch
                    ? "Try a different search term, or clear filters to see more people."
                    : hasBatchFilter
                      ? "This batch has no enrolled members yet, or try another batch."
                      : "Invite your first candidate to appear in this list."
                }
                action={
                  hasSearch || hasBatchFilter ? (
                    <Button
                      variant="outline"
                      className={instituteSecondaryClass}
                      onClick={clearListFilters}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setAddOpen(true)}
                      className={cn(institutePrimaryClass, "gap-2")}
                    >
                      <Plus className="h-4 w-4" />
                      Add user
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
                      <TableHead className="align-middle font-semibold text-foreground">Batch</TableHead>
                      <TableHead className="align-middle font-semibold text-foreground">Joined</TableHead>
                      {showIdentityColumn ? (
                      <TableHead className="align-middle font-semibold text-foreground">Identity</TableHead>
                      ) : null}
                      <TableHead className="w-[200px] min-w-[200px] pr-6 text-right align-middle font-semibold text-foreground">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => {
                      const apiPlan = String(u.subscription?.plan || "free");
                      return (
                        <TableRow
                          key={u._id}
                          className="group border-border align-middle transition-colors hover:bg-muted/40"
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
                          <TableCell className="max-w-[200px] align-middle">
                            {(u.instituteBatchNames?.length ?? 0) > 0 ? (
                              <span
                                className="line-clamp-2 text-sm text-foreground"
                                title={u.instituteBatchNames?.join(", ")}
                              >
                                {u.instituteBatchNames?.join(", ")}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="align-middle text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(u.createdAt)}
                          </TableCell>
                          {showIdentityColumn ? (
                          <TableCell className="align-middle">
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(instituteSecondaryClass, "h-8 gap-1")}
                              onClick={async () => {
                                setReviewUser(u);
                                setReviewNote("");
                                setReviewCred(null);
                                try {
                                  const cred = await biometricApi.getInstitutionCredential(
                                    institutionId,
                                    u.clerkId,
                                  );
                                  setReviewCred(cred);
                                } catch {
                                  setReviewCred(null);
                                }
                              }}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              {u.biometricStatus
                                ? String(u.biometricStatus).replaceAll("_", " ")
                                : "None"}
                            </Button>
                          </TableCell>
                          ) : null}
                          <TableCell className="w-[200px] min-w-[200px] pr-6 align-middle">
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
                                onClick={() => void openEditDialog(u)}
                                title="Edit candidate"
                                aria-label={`Edit ${u.email}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setDeleteTarget(u)}
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
                <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 bg-muted/10 px-4 py-4 sm:flex-row sm:px-6">
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
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) resetEditForm();
        }}
      >
        <DialogContent
          className="border-border/80 sm:max-w-md"
          {...dialogPortaledPickerHandlers}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Edit candidate</DialogTitle>
            <DialogDescription>
              {editUser
                ? `Update plan and batch for ${editUser.name || editUser.email}.`
                : "Update plan and batch."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <FormField label="Email" htmlFor="edit-email">
              <Input
                id="edit-email"
                type="email"
                value={editUser?.email ?? ""}
                disabled
                className="h-11 border-border bg-muted/40 shadow-sm"
              />
            </FormField>
            <FormField label="Plan" htmlFor="edit-plan" required>
              <Select
                value={editPlan}
                onValueChange={(v) => setEditPlan(v as InstituteInvitePlan)}
              >
                <SelectTrigger
                  id="edit-plan"
                  className="h-11 w-full border-border bg-card shadow-sm"
                >
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {planOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Batch Name" htmlFor="edit-batch-search">
              <div className="relative">
                {editBatchId ? (
                  <div className="app-control flex h-11 min-w-0 items-center gap-2.5 border-border bg-card px-3 shadow-sm">
                    <Layers className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {editBatchLabel}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Clear batch"
                      onClick={() => {
                        setEditBatchId("");
                        setEditBatchLabel("");
                        setEditBatchSearch("");
                        setEditBatchMenuOpen(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <SearchInput
                      id="edit-batch-search"
                      leadingIcon={Layers}
                      placeholder="Select or search batch…"
                      value={editBatchSearch}
                      onChange={(e) => {
                        setEditBatchSearch(e.target.value);
                        setEditBatchMenuOpen(true);
                        void loadBatchCatalog();
                      }}
                      onFocus={() => {
                        setEditBatchMenuOpen(true);
                        void loadBatchCatalog();
                      }}
                      containerClassName="max-w-none w-full border-border bg-card shadow-sm"
                      aria-expanded={editBatchMenuOpen}
                      aria-controls="edit-batch-search-results"
                      autoComplete="off"
                    />
                    {editBatchMenuOpen ? (
                      <div
                        id="edit-batch-search-results"
                        data-institute-inline-dropdown
                        className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-md border border-border bg-card shadow-lg"
                      >
                        {batchCatalogLoading ? (
                          <p className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Loading batches…
                          </p>
                        ) : batchCatalog.length === 0 ? (
                          <p className="px-3 py-2.5 text-xs text-muted-foreground">
                            No batches yet. Create a batch first.
                          </p>
                        ) : editBatchSearchMatches.length === 0 ? (
                          <p className="px-3 py-2.5 text-xs text-muted-foreground">
                            No batches match “{editBatchSearch.trim()}”.
                          </p>
                        ) : (
                          <ul className="max-h-44 overflow-y-auto py-1">
                            {editBatchSearchMatches.map((b) => (
                              <li key={b._id}>
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
                                  onClick={() => {
                                    setEditBatchId(b._id);
                                    setEditBatchLabel(b.name);
                                    setEditBatchSearch("");
                                    setEditBatchMenuOpen(false);
                                  }}
                                >
                                  <span className="min-w-0 truncate font-medium text-foreground">
                                    {b.name}
                                  </span>
                                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                    {b.memberCount} member{b.memberCount === 1 ? "" : "s"}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </FormField>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className={instituteSecondaryClass}
              onClick={() => {
                setEditOpen(false);
                resetEditForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSaveEdit()}
              disabled={editSubmitting || !editUser}
              className={cn(institutePrimaryClass, "shadow-md")}
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

      <Dialog open={!!reviewUser} onOpenChange={(open) => !open && setReviewUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Identity review</DialogTitle>
            <DialogDescription>
              {reviewUser?.name || reviewUser?.email} — play the 15s clip and ID, then
              approve or reject.
            </DialogDescription>
          </DialogHeader>
          {reviewCred ? (
            <div className="space-y-3">
              <video
                src={reviewCred.videoUrl}
                controls
                className="w-full rounded-lg bg-black"
              />
              {reviewCred.idCardUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={reviewCred.idCardUrl}
                  alt="ID card"
                  className="max-h-48 rounded-lg border object-contain"
                />
              ) : (
                <p className="text-sm text-muted-foreground">No ID card uploaded.</p>
              )}
              <p className="text-sm capitalize text-muted-foreground">
                Status: {reviewCred.status.replaceAll("_", " ")}
              </p>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Review note (optional)"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No credential uploaded yet.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewUser(null)}>
              Close
            </Button>
            <Button
              variant="destructive"
              disabled={!reviewCred || reviewBusy}
              onClick={async () => {
                if (!reviewUser) return;
                setReviewBusy(true);
                try {
                  await biometricApi.reviewInstitutionCredential(
                    institutionId,
                    reviewUser.clerkId,
                    "reject",
                    reviewNote,
                  );
                  setReviewUser(null);
                  await loadUsers();
                } finally {
                  setReviewBusy(false);
                }
              }}
            >
              Reject
            </Button>
            <Button
              disabled={!reviewCred || reviewBusy}
              onClick={async () => {
                if (!reviewUser) return;
                setReviewBusy(true);
                try {
                  await biometricApi.reviewInstitutionCredential(
                    institutionId,
                    reviewUser.clerkId,
                    "approve",
                    reviewNote,
                  );
                  setReviewUser(null);
                  await loadUsers();
                } finally {
                  setReviewBusy(false);
                }
              }}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAddUserForm();
        }}
      >
        <DialogContent
          className="border-border/80 sm:max-w-md"
          {...dialogPortaledPickerHandlers}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Add user</DialogTitle>
            <DialogDescription>
              Enter candidate details and assign a plan. The user will receive an invitation email to verify and sign up.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <FormField label="Candidate Name" htmlFor="candidate-name" required>
              <Input
                id="candidate-name"
                type="text"
                value={addCandidateName}
                onChange={(e) => setAddCandidateName(e.target.value)}
                placeholder="Full name"
                className="h-11 border-border shadow-sm"
                autoComplete="name"
              />
            </FormField>
            <FormField label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-11 border-border shadow-sm"
              />
            </FormField>
            <FormField label="Batch Name" htmlFor="add-batch-search">
              <div className="relative">
                {addBatchId ? (
                  <div className="app-control flex h-11 min-w-0 items-center gap-2.5 border-border bg-card px-3 shadow-sm">
                    <Layers className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {addBatchLabel}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Clear batch"
                      onClick={() => {
                        setAddBatchId("");
                        setAddBatchLabel("");
                        setAddBatchSearch("");
                        setAddBatchMenuOpen(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <SearchInput
                      id="add-batch-search"
                      leadingIcon={Layers}
                      placeholder="Select or search batch…"
                      value={addBatchSearch}
                      onChange={(e) => {
                        setAddBatchSearch(e.target.value);
                        setAddBatchMenuOpen(true);
                        void loadBatchCatalog();
                      }}
                      onFocus={() => {
                        setAddBatchMenuOpen(true);
                        void loadBatchCatalog();
                      }}
                      containerClassName="max-w-none w-full border-border bg-card shadow-sm"
                      aria-expanded={addBatchMenuOpen}
                      aria-controls="add-batch-search-results"
                      autoComplete="off"
                    />
                    {addBatchMenuOpen ? (
                      <div
                        id="add-batch-search-results"
                        data-institute-inline-dropdown
                        className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-md border border-border bg-card shadow-lg"
                      >
                        {batchCatalogLoading ? (
                          <p className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Loading batches…
                          </p>
                        ) : batchCatalog.length === 0 ? (
                          <p className="px-3 py-2.5 text-xs text-muted-foreground">
                            No batches yet. Create a batch first.
                          </p>
                        ) : addBatchSearchMatches.length === 0 ? (
                          <p className="px-3 py-2.5 text-xs text-muted-foreground">
                            No batches match “{addBatchSearch.trim()}”.
                          </p>
                        ) : (
                          <ul className="max-h-44 overflow-y-auto py-1">
                            {addBatchSearchMatches.map((b) => (
                              <li key={b._id}>
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
                                  onClick={() => {
                                    setAddBatchId(b._id);
                                    setAddBatchLabel(b.name);
                                    setAddBatchSearch("");
                                    setAddBatchMenuOpen(false);
                                  }}
                                >
                                  <span className="min-w-0 truncate font-medium text-foreground">
                                    {b.name}
                                  </span>
                                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                    {b.memberCount} member{b.memberCount === 1 ? "" : "s"}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </FormField>
            <FormField label="Plan" htmlFor="plan" required>
              <Select
                value={addPlan}
                onValueChange={(v) => setAddPlan(v as InstituteInvitePlan)}
              >
                <SelectTrigger
                  id="plan"
                  className="h-11 w-full border-border bg-card shadow-sm"
                >
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {planOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className={instituteSecondaryClass} onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={
                !addEmail?.trim() ||
                !addCandidateName?.trim() ||
                addSubmitting
              }
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

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Remove candidate?"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.name} (${deleteTarget.email})? This permanently removes their account, resumes, interviews, and reports.`
            : ""
        }
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) void handleDeleteUser(deleteTarget);
        }}
      />
    </div>
  );
}
