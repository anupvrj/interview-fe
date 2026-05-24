"use client";

import { useEffect, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Layers, Plus, ChevronRight, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { userApi, adminApi } from "@/lib/api";
import { apiErrorMessage, isConflictError } from "@/lib/api-errors";
import { cn, formatDate } from "@/lib/utils";
import {
  InstituteEmptyState,
  InstituteLoader,
  InstitutePageHeader,
  InstituteTableShell,
  institutePanelClass,
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";

export default function InstituteBatchesPage() {
  const params = useParams();
  const router = useRouter();
  const institutionId = params.institutionId as string;
  const [profile, setProfile] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    userApi.getMyProfile().then(setProfile).catch(() => {});
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const list = await adminApi.listBatches(institutionId);
      setBatches(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile) return;
    if (
      profile.accessRole !== "institution_admin" &&
      profile.accessRole !== "super_admin"
    ) {
      router.replace("/dashboard");
      return;
    }
    if (
      profile.accessRole === "institution_admin" &&
      profile.institutionId &&
      String(profile.institutionId) !== institutionId
    ) {
      router.replace("/dashboard");
      return;
    }
    load();
  }, [profile, institutionId, router]);

  const handleCreate = async () => {
    const n = newName.trim();
    if (!n) return;
    try {
      setCreating(true);
      const b = await adminApi.createBatch(institutionId, n);
      setCreateOpen(false);
      setNewName("");
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

  return (
    <div className="space-y-8">
      <InstitutePageHeader
        badge="Cohorts"
        title="Batches"
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className={cn(institutePrimaryClass, "gap-2 shadow-lg")}
          >
            <Plus className="h-4 w-4" />
            New batch
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
        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-6">
          <div className="flex shrink-0 justify-center sm:justify-start">
            {loading ? (
              <div
                className="h-16 w-16 animate-pulse rounded-2xl bg-slate-200/90 ring-2 ring-white"
                aria-hidden
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30 ring-2 ring-border/60 sm:h-[4.5rem] sm:w-[4.5rem]">
                <Layers className="h-8 w-8 text-white sm:h-9 sm:w-9" strokeWidth={1.75} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Total batches
              </p>
              <div className="mt-2 flex flex-wrap items-end justify-center gap-x-3 gap-y-1 sm:justify-start">
                {loading ? (
                  <div className="h-11 w-20 animate-pulse rounded-lg bg-slate-200/90" aria-hidden />
                ) : (
                  <span className="text-4xl font-bold tabular-nums leading-none tracking-tight text-slate-900 sm:text-5xl">
                    {batchCount}
                  </span>
                )}
                <span className="pb-1 text-sm font-medium text-slate-600">
                  {loading
                    ? ""
                    : batchCount === 1
                      ? "cohort in this institution"
                      : "cohorts in this institution"}
                </span>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              Group candidates by cohort or class, add members, then bulk-schedule interviews for the
              whole group. Each batch has its own members and scheduled rounds — open one to manage
              people and schedules.
            </p>
          </div>
        </div>
      </section>

      <Card className={cn(institutePanelClass, "overflow-hidden shadow-xl")}>
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/50 via-white to-indigo-50/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/25 ring-2 ring-border/40">
                <Layers className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 space-y-1.5">
                <CardTitle className="text-lg leading-tight">Your batches</CardTitle>
                <CardDescription>
                  {!loading && batchCount > 0 ? (
                    <span>
                      <span className="font-semibold text-slate-800">{batchCount}</span>{" "}
                      {batchCount === 1 ? "batch" : "batches"} — open one to manage members and
                      schedules
                    </span>
                  ) : (
                    "Create a batch to start grouping candidates"
                  )}
                </CardDescription>
              </div>
            </div>
            {!loading && batchCount > 0 ? (
              <span className="inline-flex w-fit shrink-0 items-center gap-1.5 self-start rounded-full border border-border/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-primary shadow-sm sm:mt-1">
                <Sparkles className="h-3.5 w-3.5" />
                Cohort list
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
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
          ) : (
            <InstituteTableShell>
              <Table className="w-full min-w-[640px]">
                <TableHeader>
                  <TableRow className="border-b border-slate-200/80 bg-slate-50/90 hover:bg-slate-50/90">
                    <TableHead className="pl-6 text-left align-middle font-semibold text-slate-700">
                      Batch
                    </TableHead>
                    <TableHead className="align-middle font-semibold text-slate-700">Members</TableHead>
                    <TableHead className="align-middle font-semibold text-slate-700">Updated</TableHead>
                    <TableHead className="w-[120px] min-w-[120px] pr-6 text-right align-middle font-semibold text-slate-700">
                      Open
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => {
                    const n = Array.isArray(b.memberClerkIds) ? b.memberClerkIds.length : 0;
                    return (
                      <TableRow
                        key={b._id}
                        className="group border-slate-100 align-middle transition-colors hover:bg-gradient-to-r hover:bg-muted/50 hover:to-transparent"
                      >
                        <TableCell className="pl-6 align-middle">
                          <div className="flex items-center gap-3 py-1">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/80 text-primary shadow-inner ring-2 ring-white"
                              aria-hidden
                            >
                              <Layers className="h-5 w-5" />
                            </div>
                            <span className="font-semibold text-slate-900">{b.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/90 px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-800">
                            <Users className="h-3.5 w-3.5 text-slate-500" />
                            {n}
                          </span>
                        </TableCell>
                        <TableCell className="align-middle text-sm text-slate-600 whitespace-nowrap">
                          {b.updatedAt ? formatDate(b.updatedAt) : "—"}
                        </TableCell>
                        <TableCell className="w-[120px] min-w-[120px] pr-6 text-right align-middle">
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(instituteSecondaryClass, "h-8 gap-1 px-3")}
                            asChild
                          >
                            <Link href={`/dashboard/institute/${institutionId}/batches/${b._id}`}>
                              Open
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
          <div className="space-y-2 py-2">
            <Label htmlFor="batch-name">Batch name</Label>
            <Input
              id="batch-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Placement batch Jan 2026"
              className="h-11 border-slate-200 shadow-sm"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className={instituteSecondaryClass} onClick={() => setCreateOpen(false)}>
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
