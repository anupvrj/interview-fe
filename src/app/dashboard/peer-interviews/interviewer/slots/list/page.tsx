"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { InterviewerSlotFormDialog } from "@/components/peer/InterviewerSlotFormDialog";
import { InterviewerSlotViewDialog } from "@/components/peer/InterviewerSlotViewDialog";
import {
  computeSlotStats,
  InterviewerSlotsBulkBar,
  InterviewerSlotsTable,
  InterviewerSlotsTableSelectAll,
  isPastSlot,
} from "@/components/peer/InterviewerSlotsTable";
import { PeerTimezoneBadge, PeerTimezoneSelect } from "@/components/peer/PeerTimezoneSelect";
import { usePeerTimezone } from "@/components/peer/usePeerTimezone";
import { formatPeerSchedule } from "@/components/peer/peerSlotTime";
import { canDeleteInterviewerSlot } from "@/lib/peer-slot-guards";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  peerApi,
  type PeerInterviewType,
  type PeerInterviewerProfile,
  type PeerSlot,
} from "@/lib/api";

export default function InterviewerSlotsListPage() {
  const { timezone, setTimezone, saving: savingTimezone, timezoneLabel, loading: tzLoading } =
    usePeerTimezone();
  const [profile, setProfile] = useState<PeerInterviewerProfile | null>(null);
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [slots, setSlots] = useState<PeerSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewSlot, setViewSlot] = useState<PeerSlot | null>(null);
  const [editSlot, setEditSlot] = useState<PeerSlot | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<PeerSlot | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const typeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of types) m[t.key] = t.name;
    return m;
  }, [types]);

  const stats = useMemo(() => computeSlotStats(slots), [slots]);

  const nextOpenSlot = useMemo(() => {
    const now = Date.now();
    return slots
      .filter((s) => s.status === "open" && !s.bookingId && !isPastSlot(s) && new Date(s.start).getTime() >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
  }, [slots]);

  const load = async () => {
    setLoading(true);
    try {
      const [p, t, s] = await Promise.all([
        peerApi.getMyInterviewerProfile(),
        peerApi.listInterviewTypes(),
        peerApi.listMySlots().catch(() => []),
      ]);
      setProfile(p);
      setTypes(t);
      setSlots(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const deleteOne = async (slot: PeerSlot) => {
    setDeleting(true);
    try {
      await peerApi.deleteSlot(slot.id);
      toast.success("Slot removed");
      setSlotToDelete(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(slot.id);
        return next;
      });
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not delete slot");
    } finally {
      setDeleting(false);
    }
  };

  const deleteBulk = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setDeleting(true);
    try {
      const result = await peerApi.bulkDeleteSlots(ids);
      if (result.deleted > 0) {
        toast.success(
          `Removed ${result.deleted} slot${result.deleted === 1 ? "" : "s"}${
            result.skipped > 0 ? ` (${result.skipped} skipped)` : ""
          }`,
        );
      } else {
        toast.error("No slots could be deleted. Booked slots cannot be removed.");
      }
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not delete slots");
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => {
    setEditSlot(null);
    setFormOpen(true);
  };

  const openEdit = (slot: PeerSlot) => {
    setEditSlot(slot);
    setFormOpen(true);
  };

  if (!loading && profile?.status !== "approved") {
    return (
      <div className="space-y-4">
        <PageHeader title="All slots" />
        <p className="text-muted-foreground">
          Slot management unlocks once your interviewer profile is approved.
        </p>
        <Link href="/dashboard/peer-interviews/interviewer">
          <Button variant="outline">Back</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/peer-interviews/interviewer/slots">
        <Button variant="ghost" className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to calendar
        </Button>
      </Link>

      <PageHeader
        title="All availability slots"
        badge="Slots"
        description="Manage every slot in one place — filter, view details, edit open slots, or delete in bulk."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/peer-interviews/interviewer/slots">
              <Button variant="outline">
                <CalendarDays className="mr-2 h-4 w-4" /> Calendar
              </Button>
            </Link>
            <Button
              onClick={openCreate}
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              <Plus className="mr-2 h-4 w-4" /> New slot
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className={cn(appCard, "flex h-64 items-center justify-center")}>
          <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
        </div>
      ) : slots.length === 0 ? (
        <div className={cn(appCard, "flex flex-col items-center gap-3 px-6 py-16 text-center")}>
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
            <CalendarClock className="h-8 w-8" />
          </span>
          <p className="text-lg font-semibold">No slots yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Add 30–60 minute availability windows so candidates can book mock interviews with you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Link href="/dashboard/peer-interviews/interviewer/slots">
              <Button variant="outline">
                <CalendarDays className="mr-2 h-4 w-4" /> Open calendar
              </Button>
            </Link>
            <Button
              onClick={openCreate}
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              <Plus className="mr-2 h-4 w-4" /> Create first slot
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className={cn(appCard, "p-4")}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <PeerTimezoneSelect
                timezone={timezone}
                onChange={setTimezone}
                disabled={tzLoading || savingTimezone}
                className="max-w-md flex-1"
              />
              <PeerTimezoneBadge label={timezoneLabel} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <DashboardStatCard
              theme="purple"
              label="Total slots"
              value={stats.total}
              icon={CalendarClock}
              hint={
                <>
                  <CalendarClock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>All availability windows</span>
                </>
              }
            />
            <DashboardStatCard
              theme="emerald"
              label="Open"
              value={stats.open}
              icon={CheckCircle2}
              hint={
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>Available to book</span>
                </>
              }
            />
            <DashboardStatCard
              theme="amber"
              label="Booked"
              value={stats.booked}
              icon={Video}
              hint={
                <>
                  <Video className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>Candidate reserved</span>
                </>
              }
            />
            <DashboardStatCard
              theme="violet"
              label="Past"
              value={stats.past}
              icon={Clock}
              hint={
                <>
                  <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span>Expired or ended</span>
                </>
              }
            />
          </div>

          {nextOpenSlot ? (
            <div className={cn(appCard, "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between")}>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7367F0]">
                  Next open slot
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {nextOpenSlot.availableForTypes
                    .map((k) => typeNames[k] ?? k)
                    .slice(0, 2)
                    .join(" · ")}
                  {nextOpenSlot.availableForTypes.length > 2
                    ? ` +${nextOpenSlot.availableForTypes.length - 2} more`
                    : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatPeerSchedule(nextOpenSlot.start, timezone)} · {nextOpenSlot.durationMins} min
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setViewSlot(nextOpenSlot)}
                >
                  <Clock className="mr-2 h-4 w-4" /> View details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openEdit(nextOpenSlot)}
                >
                  Edit slot
                </Button>
              </div>
            </div>
          ) : null}

          <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">Slots</CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    Filter by status or interview round. Select open slots to delete in bulk, or use
                    row actions to view, edit, or delete.
                  </CardDescription>
                </div>
                <InterviewerSlotsTableSelectAll
                  slots={slots}
                  selectedIds={selectedIds}
                  onSelectedIdsChange={setSelectedIds}
                  bulkDeleting={deleting}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              <InterviewerSlotsBulkBar
                count={selectedIds.size}
                deleting={deleting}
                onClear={() => setSelectedIds(new Set())}
                onDelete={() => setBulkDeleteOpen(true)}
              />
              <InterviewerSlotsTable
                slots={slots}
                types={types}
                typeNames={typeNames}
                timezone={timezone}
                selectedIds={selectedIds}
                onSelectedIdsChange={setSelectedIds}
                onView={setViewSlot}
                onEdit={openEdit}
                onDelete={(slot) => {
                  if (canDeleteInterviewerSlot(slot)) setSlotToDelete(slot);
                }}
                bulkDeleting={deleting}
              />
            </CardContent>
          </Card>
        </>
      )}

      <InterviewerSlotViewDialog
        slot={viewSlot}
        open={!!viewSlot}
        onOpenChange={(open) => {
          if (!open) setViewSlot(null);
        }}
        typeNames={typeNames}
        profile={profile}
        timezone={timezone}
        timezoneLabel={timezoneLabel}
        onEdit={openEdit}
      />

      {profile ? (
        <InterviewerSlotFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditSlot(null);
          }}
          slot={editSlot}
          profile={profile}
          types={types}
          typeNames={typeNames}
          timezone={timezone}
          timezoneLabel={timezoneLabel}
          onSaved={load}
        />
      ) : null}

      <AlertDialog
        open={!!slotToDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setSlotToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this slot?</AlertDialogTitle>
            <AlertDialogDescription>
              {slotToDelete ? (
                <>
                  This will remove the open slot on{" "}
                  <span className="font-medium text-foreground">
                    {formatPeerSchedule(slotToDelete.start, timezone, { dateStyle: "full" })}
                  </span>
                  . Candidates will no longer be able to book it.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (slotToDelete) void deleteOne(slotToDelete);
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete slot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!open && !deleting) setBulkDeleteOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} slot{selectedIds.size === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes all selected open slots. Booked slots in the selection are skipped
              automatically. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void deleteBulk();
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
