"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  LayoutDashboard,
  Loader2,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  AccountStatusBadge,
  BillingStateBadge,
  InstitutionModeBadge,
} from "@/components/institution-lifecycle/StatusBadges";
import {
  BILLING_TERM_LABELS,
  formatLifecycleDate,
  type InstitutionLifecycle,
} from "@/lib/institution-lifecycle";
import { InstitutionOnboardingWizard } from "@/components/super-admin/institution-onboarding/InstitutionOnboardingWizard";
import { RenewalsOverviewCard } from "@/components/super-admin/institution-lifecycle/RenewalsOverviewCard";

const headClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]";

export function SuperAdminInstitutionsManager() {
  const router = useRouter();
  const { showDialog, Dialog: confirmDialog } = useConfirmationDialog();
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    void loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      setInstitutions(await adminApi.listInstitutions());
    } catch (err) {
      console.error(err);
      toast.error("Failed to load institutions");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return institutions;
    return institutions.filter((inst) =>
      [inst.name, inst.slug, inst.domain, inst.contactEmail]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q)),
    );
  }, [institutions, search]);

  const openCreate = () => {
    setEditing(null);
    setWizardOpen(true);
  };

  const openEdit = (inst: any) => {
    setEditing(inst);
    setWizardOpen(true);
  };

  const handleDelete = (inst: any) => {
    showDialog({
      title: `Delete ${inst.name}?`,
      description:
        "Deletion is only allowed when no users are assigned. This cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await adminApi.deleteInstitution(String(inst._id));
          toast.success("Institution deleted");
          await loadInstitutions();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to delete institution");
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <RenewalsOverviewCard />

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg">Partner institutions</CardTitle>
            <CardDescription>
              Onboard institutes, manage seats and billing, and control access.
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search institutions"
                className="h-11 pl-9"
                aria-label="Search institutions"
              />
            </div>
            <Button className="h-11 w-full sm:w-auto" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Onboard institution
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : null}
          {!loading && filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {institutions.length === 0 ? "No institutions yet" : "No institutions match your search"}
              </p>
            </div>
          ) : null}
          {!loading && filtered.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[960px] border-collapse text-left">
                <TableHeader>
                  <TableRow className="border-b border-border/70 hover:bg-transparent">
                    <TableHead className={headClass}>Institution</TableHead>
                    <TableHead className={headClass}>Mode</TableHead>
                    <TableHead className={headClass}>Status</TableHead>
                    <TableHead className={headClass}>Seats used</TableHead>
                    <TableHead className={headClass}>Billing</TableHead>
                    <TableHead className={headClass}>Next renewal</TableHead>
                    <TableHead className={`${headClass} text-right`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inst) => {
                    const lifecycle = inst.lifecycle as InstitutionLifecycle | undefined;
                    const total = inst.totalSeats ?? inst.maxUsers;
                    return (
                      <TableRow
                        key={inst._id}
                        className="border-b border-border/60 hover:bg-muted/30"
                      >
                        <TableCell className="px-4 py-3">
                          <Link
                            href={`/super-admin/institutions/${String(inst._id)}`}
                            className="font-medium text-foreground hover:text-primary"
                          >
                            {inst.name}
                          </Link>
                          <p className="mt-0.5 break-all text-xs text-muted-foreground">
                            {inst.contactEmail || inst.slug}
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <InstitutionModeBadge mode={lifecycle?.mode ?? inst.mode} />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <AccountStatusBadge
                            status={lifecycle?.effectiveStatus ?? inst.accountStatus}
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3 tabular-nums">
                          {inst.seatsUsed ?? 0}
                          <span className="text-muted-foreground"> / {total ?? "∞"}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1">
                            {lifecycle ? <BillingStateBadge state={lifecycle.billingState} /> : null}
                            <span className="text-xs text-muted-foreground">
                              {BILLING_TERM_LABELS[
                                (inst.billing?.term ?? "yearly") as keyof typeof BILLING_TERM_LABELS
                              ]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm">
                          {formatLifecycleDate(lifecycle?.renewalDate)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/super-admin/institutions/${String(inst._id)}`)
                              }
                              title="Manage billing, status, and features"
                              aria-label="Manage institution"
                            >
                              <Settings2 className="h-4 w-4" />
                            </Button>
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
                              onClick={() => openEdit(inst)}
                              title="Edit institution"
                              aria-label="Edit institution"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(inst)}
                              title="Delete institution"
                              aria-label="Delete institution"
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
            </div>
          ) : null}
        </CardContent>
      </Card>

      <InstitutionOnboardingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        institution={editing}
        onSaved={loadInstitutions}
      />
      {confirmDialog}
    </div>
  );
}
