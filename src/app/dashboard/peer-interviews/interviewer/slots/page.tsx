"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, List, Loader2, Plus } from "lucide-react";
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
import { PeerCalendarGrid } from "@/components/peer/PeerCalendarGrid";
import { InterviewerSlotFormDialog } from "@/components/peer/InterviewerSlotFormDialog";
import { PeerTimezoneSettingsButton } from "@/components/peer/PeerTimezoneSelect";
import { usePeerTimezone } from "@/components/peer/usePeerTimezone";
import { formatPeerSchedule } from "@/components/peer/peerSlotTime";
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

  const openCreate = (day: Date) => {
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
      <div className="space-y-4">
        <PageHeader title="Availability slots" />
        <p className="text-muted-foreground">
          Slot creation unlocks once your interviewer profile is approved.
        </p>
        <Link href="/dashboard/peer-interviews/interviewer">
          <Button variant="outline">Back</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/peer-interviews/interviewer">
        <Button variant="ghost" className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </Link>
      <PageHeader
        title="Availability slots"
        badge="Calendar"
        description="Click the + on any day to create a 30–60 minute slot. Green slots are open; orange are booked."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PeerTimezoneSettingsButton
              timezone={timezone}
              timezoneLabel={timezoneLabel}
              onChange={setTimezone}
              disabled={tzLoading}
              saving={savingTimezone}
            />
            <Link href="/dashboard/peer-interviews/interviewer/slots/list">
              <Button variant="outline">
                <List className="mr-2 h-4 w-4" /> View slots
              </Button>
            </Link>
            <Button
              onClick={() => openCreate(new Date())}
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              <Plus className="mr-2 h-4 w-4" /> New slot
            </Button>
          </div>
        }
      />

      <PeerCalendarGrid
        mode="interviewer"
        slots={slots}
        timezone={timezone}
        onCreate={openCreate}
        onEditSlot={openEdit}
        onDeleteSlot={setSlotToDelete}
      />

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
