"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  List,
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
import { PeerCalendarGrid } from "@/components/peer/PeerCalendarGrid";
import { InterviewerSlotFormDialog } from "@/components/peer/InterviewerSlotFormDialog";
import { computeSlotStats } from "@/components/peer/InterviewerSlotsTable";
import { PeerTimezoneSettingsButton } from "@/components/peer/PeerTimezoneSelect";
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

export default function InterviewerSlotsPage() {
  const { timezone, setTimezone, saving: savingTimezone, timezoneLabel, loading: tzLoading } =
    usePeerTimezone();
  const [profile, setProfile] = useState<PeerInterviewerProfile | null>(null);
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [slots, setSlots] = useState<PeerSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<PeerSlot | null>(null);
  const [createDay, setCreateDay] = useState<Date | undefined>();
  const [slotToDelete, setSlotToDelete] = useState<PeerSlot | null>(null);
  const [deleting, setDeleting] = useState(false);

  const typeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of types) m[t.key] = t.name;
    return m;
  }, [types]);

  const stats = useMemo(() => computeSlotStats(slots), [slots]);

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

  const openCreate = (day?: Date) => {
    setEditingSlot(null);
    setCreateDay(day);
    setFormOpen(true);
  };

  const openEdit = (slot: PeerSlot) => {
    setEditingSlot(slot);
    setCreateDay(undefined);
    setFormOpen(true);
  };

  const closeFormDialog = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingSlot(null);
      setCreateDay(undefined);
    }
  };

  const deleteSlot = async (slot: PeerSlot) => {
    setDeleting(true);
    try {
      await peerApi.deleteSlot(slot.id);
      toast.success("Slot removed");
      setSlotToDelete(null);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not delete slot");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (profile?.status !== "approved") {
    return (
      <div className="space-y-6">
        <PageHeader title="Availability slots" />
        <div className={cn(appCard, "flex flex-col items-center gap-3 px-6 py-12 text-center")}>
          <p className="text-sm text-muted-foreground">
            Slot creation unlocks once your interviewer profile is approved.
          </p>
          <Link href="/dashboard/peer-interviews/interviewer">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/peer-interviews/interviewer">
        <Button variant="ghost" className="-ml-2 w-fit px-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </Link>

      <PageHeader
        title="Availability slots"
        description="Create 30–60 minute windows for candidates to book. Green slots are open; orange are booked."
        actions={
          <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-wrap">
            <PeerTimezoneSettingsButton
              timezone={timezone}
              timezoneLabel={timezoneLabel}
              onChange={setTimezone}
              disabled={tzLoading}
              saving={savingTimezone}
              compact
              className="min-w-0 flex-1 shrink basis-0 px-2 sm:flex-none sm:basis-auto sm:px-3"
            />
            <Link
              href="/dashboard/peer-interviews/interviewer/slots/list"
              className="min-w-0 flex-1 sm:flex-none"
            >
              <Button
                variant="outline"
                className="h-10 w-full gap-2 px-3 font-semibold shadow-sm sm:w-auto"
              >
                <List className="h-4 w-4 shrink-0" />
                <span className="truncate">View all slots</span>
              </Button>
            </Link>
            <Button
              onClick={() => openCreate(new Date())}
              className="h-10 min-w-0 flex-1 gap-2 bg-[#7367F0] px-3 font-semibold text-white hover:bg-[#6e62e5] sm:flex-none"
            >
              <Plus className="h-4 w-4 shrink-0" /> New slot
            </Button>
          </div>
        }
      />

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

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Calendar</CardTitle>
            <CardDescription className="mt-1 text-sm">
              Switch day, week, or month view. Click + on any day to add a slot, or use the toolbar
              to jump between dates.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <PeerCalendarGrid
            embedded
            mode="interviewer"
            slots={slots}
            timezone={timezone}
            onCreate={openCreate}
            onEditSlot={openEdit}
            onDeleteSlot={(slot) => {
              if (canDeleteInterviewerSlot(slot)) setSlotToDelete(slot);
            }}
          />
        </CardContent>
      </Card>

      {profile ? (
        <InterviewerSlotFormDialog
          open={formOpen}
          onOpenChange={closeFormDialog}
          slot={editingSlot}
          createDay={createDay}
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
                  . Candidates will no longer be able to book it. This cannot be undone.
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
                if (slotToDelete) void deleteSlot(slotToDelete);
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete slot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
