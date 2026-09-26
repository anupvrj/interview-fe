"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Loader2, Layers, Plus, ChevronRight, Users } from "lucide-react";
import { toast } from "sonner";
import { userApi, adminApi } from "@/lib/api";
import { apiErrorMessage, isConflictError } from "@/lib/api-errors";
import { cn, formatDate } from "@/lib/utils";
import {
  InstituteEmptyState,
  InstituteLoader,
  InstituteTableShell,
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { InstituteBatchesHero } from "@/components/institute/InstituteBatchesHero";
import { FormField } from "@/components/app/FormField";
import { SearchInput } from "@/components/app/SearchInput";
import { canViewInstitutePage } from "@/lib/institute-access";

type BatchRow = {
  _id: string;
  name: string;
  memberClerkIds?: string[];
  updatedAt?: string;
  startDate?: string | null;
  endDate?: string | null;
  scheduledInterviewCount?: number;
  averageBatchScore?: number | null;
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

export default function InstituteBatchesPage() {
  const params = useParams();
  const router = useRouter();
  const institutionId = params.institutionId as string;
  const [profile, setProfile] = useState<any>(null);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [totalMembers, setTotalMembers] = useState<number | null>(null);

  useEffect(() => {
    userApi.getMyProfile().then(setProfile).catch(() => {});
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [list, stats] = await Promise.all([
        adminApi.listBatches(institutionId),
        adminApi.getInstitutionBatchStats(institutionId).catch(() => null),
      ]);
      setBatches(Array.isArray(list) ? list : []);
      setTotalMembers(
        stats && typeof stats.totalMembers === "number" ? stats.totalMembers : null,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile) return;
    if (!canViewInstitutePage(profile, institutionId, "batches")) {
      router.replace("/dashboard");
      return;
    }
    load();
  }, [profile, institutionId, router]);

  const filteredBatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...batches].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }),
    );
    if (!q) return sorted;
    return sorted.filter((b) => (b.name || "").toLowerCase().includes(q));
  }, [batches, search]);

  const handleCreate = async () => {
    const n = newName.trim();
    if (!n) return;
    try {
      setCreating(true);
      const b = await adminApi.createBatch(institutionId, {
        name: n,
        maxStudents: maxStudents.trim()
          ? Number.parseInt(maxStudents, 10)
          : null,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      setCreateOpen(false);
      setNewName("");
      setMaxStudents("");
      setStartDate("");
      setEndDate("");
      router.push(`/dashboard/institute/${institutionId}/batches/${b._id}`);
    } catch (err: unknown) {
      const msg = apiErrorMessage(err, "Failed to create batch");
      if (isConflictError(err)) {
        toast.error("Name already in use", {
          description: msg,
          duration: 6000,
        });
      } else {
        toast.error("Couldn’t create batch", {
          description: msg,
          duration: 6000,
        });
      }
    } finally {
      setCreating(false);
    }
  };

  if (!profile) {
    return <InstituteLoader />;
  }

  const batchCount = batches.length;
  const hasSearch = Boolean(search.trim());

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 lg:space-y-6">
      <InstituteBatchesHero
        batchCount={batchCount}
        totalMembers={totalMembers}
        loading={loading}
      />

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold text-foreground">
                Batch directory
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {!loading && batchCount > 0
                  ? hasSearch
                    ? `${filteredBatches.length} of ${batchCount} batch${batchCount === 1 ? "" : "es"} match your search.`
                    : `Open a batch to manage members, runs, and bulk schedules.`
                  : "Create your first batch to group candidates."}
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:min-w-[min(100%,28rem)] lg:flex-1 lg:max-w-xl">
              <SearchInput
                id="batch-list-search"
                placeholder="Search batch name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                containerClassName="max-w-none w-full min-w-0 flex-1 border-border bg-card shadow-sm"
              />
              <Button
                type="button"
                onClick={() => setCreateOpen(true)}
                className={cn(institutePrimaryClass, "h-11 shrink-0 gap-2 sm:w-auto")}
              >
                <Plus className="h-4 w-4" />
                New batch
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-9 w-9 animate-spin text-[#7367F0]" />
            </div>
          ) : batchCount === 0 ? (
            <div className="px-4 py-6 sm:px-6">
              <InstituteEmptyState
                icon={Layers}
                title="No batches yet"
                description="Create a batch to group candidates and schedule interviews in one step."
                action={
                  <Button
                    onClick={() => setCreateOpen(true)}
                    className={cn(institutePrimaryClass, "gap-2")}
                  >
                    <Plus className="h-4 w-4" />
                    Create batch
                  </Button>
                }
              />
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="px-4 py-6 sm:px-6">
              <InstituteEmptyState
                icon={Layers}
                title="No matches"
                description="Try a different batch name or clear the search."
                action={
                  <Button
                    variant="outline"
                    className={instituteSecondaryClass}
                    onClick={() => setSearch("")}
                  >
                    Clear search
                  </Button>
                }
              />
            </div>
          ) : (
            <InstituteTableShell>
              <Table className="w-full min-w-[760px]">
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-6 text-left align-middle font-semibold text-foreground">
                      Batch
                    </TableHead>
                    <TableHead className="align-middle font-semibold text-foreground">
                      Members
                    </TableHead>
                    <TableHead className="align-middle font-semibold text-foreground">
                      Scheduled
                    </TableHead>
                    <TableHead className="align-middle font-semibold text-foreground">
                      Avg. score
                    </TableHead>
                    <TableHead className="align-middle font-semibold text-foreground">
                      Updated
                    </TableHead>
                    <TableHead className="w-[88px] min-w-[88px] pr-6 text-right align-middle font-semibold text-foreground">
                      Open
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((b) => {
                    const memberCount = Array.isArray(b.memberClerkIds)
                      ? b.memberClerkIds.length
                      : 0;
                    return (
                      <TableRow
                        key={b._id}
                        className="group border-border align-middle transition-colors hover:bg-muted/40"
                      >
                        <TableCell className="pl-6 align-middle">
                          <div className="flex items-center gap-3 py-2">
                            <div
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-sm font-bold text-white shadow-md shadow-primary/15 ring-2 ring-white"
                              aria-hidden
                            >
                              {batchInitials(b.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">
                                {b.name?.trim() || "Untitled batch"}
                              </p>
                              {b.startDate || b.endDate ? (
                                <p className="truncate text-sm text-muted-foreground">
                                  {b.startDate ? formatDate(b.startDate) : "—"}
                                  {b.endDate ? ` → ${formatDate(b.endDate)}` : ""}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">Cohort roster</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {memberCount}
                          </span>
                        </TableCell>
                        <TableCell className="align-middle text-sm font-semibold tabular-nums text-foreground">
                          {b.scheduledInterviewCount ?? 0}
                        </TableCell>
                        <TableCell className="align-middle text-sm tabular-nums text-foreground">
                          {b.averageBatchScore != null ? (
                            <span>{Math.round(b.averageBatchScore)}/100</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="align-middle text-sm text-muted-foreground whitespace-nowrap">
                          {b.updatedAt ? formatDate(b.updatedAt) : "—"}
                        </TableCell>
                        <TableCell className="w-[88px] min-w-[88px] pr-6 text-right align-middle">
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(instituteSecondaryClass, "h-8 w-8 shrink-0 p-0")}
                            asChild
                            title="Open batch"
                            aria-label={`Open ${b.name}`}
                          >
                            <Link
                              href={`/dashboard/institute/${institutionId}/batches/${b._id}`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </InstituteTableShell>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-border/80 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Create batch</DialogTitle>
            <DialogDescription>
              Choose a name you will recognize (e.g. &quot;CS 2026 — Spring&quot;). Names must be
              unique within your institution (same spelling with different capitalization counts as
              the same name).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <FormField label="Batch name" htmlFor="batch-name" required className="sm:col-span-2">
              <Input
                id="batch-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Placement batch Jan 2026"
                className="h-11 border-border shadow-sm"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </FormField>
            <FormField label="Max students" htmlFor="batch-max" hint="Optional cap for roster size">
              <Input
                id="batch-max"
                type="number"
                min={1}
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                className="h-11 border-border shadow-sm"
              />
            </FormField>
            <FormField label="Start date" htmlFor="batch-start">
              <Input
                id="batch-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 border-border shadow-sm"
              />
            </FormField>
            <FormField label="End date" htmlFor="batch-end">
              <Input
                id="batch-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 border-border shadow-sm"
              />
            </FormField>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className={instituteSecondaryClass}
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className={institutePrimaryClass}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & open"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
