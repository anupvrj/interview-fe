"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { Button } from "@/components/ui/button";
import { hackathonAdminApi, toHackathonError, type AdminParticipantDetail } from "../api";
import { formatIst } from "../copy";
import { hackathonKeys } from "../hooks";
import { AdminParticipantChallengeSections } from "./AdminParticipantChallengeSections";
import { participantStatusBadge } from "./AdminSubmissionsPage";
import { hackathonAdminTabHref } from "./hackathonAdminNav";
import { confirmAdminRemoveParticipant } from "./adminRemoveParticipant";
import { RequestResubmissionDialog } from "./RequestResubmissionDialog";

export function AdminSubmissionDetailPage({
  hackathonId,
  participantId,
}: Readonly<{ hackathonId: string; participantId: string }>) {
  const queryClient = useQueryClient();
  const key = ["admin", "hackathons", hackathonId, "participant", participantId];
  const detail = useQuery({ queryKey: key, queryFn: () => hackathonAdminApi.participant(hackathonId, participantId) });
  const overview = useQuery({
    queryKey: hackathonKeys.adminOne(hackathonId),
    queryFn: () => hackathonAdminApi.get(hackathonId),
  });
  const [reviewNote, setReviewNote] = useState("");
  const [resubmitTarget, setResubmitTarget] = useState<{
    challengeId: string;
    label: string;
    slot?: number;
  } | null>(null);
  const router = useRouter();
  const listKey = ["admin", "hackathons", hackathonId, "participants"];

  const refreshAfterModeration = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: key }),
      queryClient.invalidateQueries({ queryKey: listKey }),
      queryClient.invalidateQueries({ queryKey: hackathonKeys.adminOne(hackathonId) }),
    ]);
  };

  const suspend = useMutation({
    mutationFn: (note?: string) => hackathonAdminApi.suspendParticipant(hackathonId, participantId, note),
    onSuccess: async () => {
      await refreshAfterModeration();
      toast.success("Participant suspended. Their challenges are locked and they see the suspension notice.");
    },
    onError: (err) => toast.error(toHackathonError(err).message),
  });

  const unsuspend = useMutation({
    mutationFn: () => hackathonAdminApi.unsuspendParticipant(hackathonId, participantId),
    onSuccess: async () => {
      await refreshAfterModeration();
      toast.success("Suspension lifted. The participant can continue where they left off.");
    },
    onError: (err) => toast.error(toHackathonError(err).message),
  });

  const remove = useMutation({
    mutationFn: () => hackathonAdminApi.deleteParticipant(hackathonId, participantId),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: key });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: listKey }),
        queryClient.invalidateQueries({ queryKey: hackathonKeys.adminOne(hackathonId) }),
      ]);
      toast.success("Participant removed. They can register for this hackathon again.");
      router.push(hackathonAdminTabHref(hackathonId, "submissions"));
    },
    onError: (err) => toast.error(toHackathonError(err).message),
  });

  const moderating = suspend.isPending || unsuspend.isPending || remove.isPending;

  const confirmSuspend = (who: string) => {
    const note = window.prompt(
      `Suspend ${who}?\n\nEvery challenge locks and they see: "Your hackathon has been suspended due to some suspicious activity found. Drop us an email at info@interviewtrix.com."\n\nInternal reason (optional, only admins see it):`,
      "",
    );
    if (note === null) return;
    suspend.mutate(note.trim() || undefined);
  };

  const confirmUnsuspend = (who: string) => {
    if (window.confirm(`Lift the suspension for ${who}? Their entry goes back to where it was.`)) unsuspend.mutate();
  };

  const confirmRemove = (who: string) => {
    if (confirmAdminRemoveParticipant(who)) remove.mutate();
  };

  const reset = useMutation({
    mutationFn: ({ challengeId, slot, note }: { challengeId: string; slot?: number; note?: string }) =>
      hackathonAdminApi.resetChallenge(hackathonId, participantId, challengeId, { slot, note }),
    onSuccess: (data: AdminParticipantDetail) => {
      queryClient.setQueryData(key, data);
      void queryClient.invalidateQueries({ queryKey: listKey });
      setResubmitTarget(null);
      toast.success("Challenge reopened. The participant can submit again.");
    },
    onError: (err) => toast.error(toHackathonError(err).message),
  });

  const review = useMutation({
    mutationFn: (decision: "approved" | "rejected") =>
      hackathonAdminApi.reviewSocial(hackathonId, participantId, decision, reviewNote.trim() || undefined),
    onSuccess: (data: AdminParticipantDetail, decision) => {
      queryClient.setQueryData(key, data);
      void queryClient.invalidateQueries({ queryKey: listKey });
      setReviewNote("");
      toast.success(decision === "approved" ? "Social posts approved" : "Social posts rejected");
    },
    onError: (err) => toast.error(toHackathonError(err).message),
  });

  const backHref = hackathonAdminTabHref(hackathonId, "submissions");
  const requiredChallenges = overview.data?.challenges?.length ?? 3;

  if (detail.isLoading) {
    return (
      <div className="space-y-5">
        <SuperAdminPageHeader backHref={backHref} backLabel="Submissions" />
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading submission…
        </div>
      </div>
    );
  }
  if (detail.isError || !detail.data) {
    return (
      <div className="space-y-5">
        <SuperAdminPageHeader backHref={backHref} backLabel="Submissions" />
        <p className="text-sm text-destructive">{toHackathonError(detail.error).message}</p>
      </div>
    );
  }

  const { participant } = detail.data;
  const profile = participant.profileSnapshot;
  const who = profile?.name || profile?.email || "this participant";

  return (
    <div className="space-y-5">
      <SuperAdminPageHeader
        backHref={backHref}
        backLabel="Submissions"
        title={profile?.name || "Hackathon submission"}
        description={[profile?.email, profile?.targetJobRole, typeof profile?.experience === "number" ? `${profile.experience} yrs` : null]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {participantStatusBadge(participant.status)}
            <Button asChild variant="outline" size="sm">
              <Link href={`/super-admin/users/${participant.userId}`}>User profile</Link>
            </Button>
            {participant.status === "suspended" ? (
              <Button variant="outline" size="sm" disabled={moderating} onClick={() => confirmUnsuspend(who)}>
                {unsuspend.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Unsuspend
              </Button>
            ) : participant.status !== "withdrawn" ? (
              <Button variant="outline" size="sm" disabled={moderating} onClick={() => confirmSuspend(who)}>
                {suspend.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                Suspend
              </Button>
            ) : null}
            <Button variant="destructive" size="sm" disabled={moderating} onClick={() => confirmRemove(who)}>
              {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Remove from hackathon
            </Button>
          </div>
        }
      />

      {participant.status === "suspended" ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <span className="font-semibold">Suspended</span>
            {participant.suspension?.at ? ` since ${formatIst(participant.suspension.at)}` : ""}. All challenges are locked
            and the participant sees the suspension notice.
            {participant.suspension?.note ? ` Reason: “${participant.suspension.note}”.` : ""}
          </p>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Registered {formatIst(participant.registeredAt)}
        {participant.completedAt ? ` · Marked complete ${formatIst(participant.completedAt)}` : ""}
        {participant.summary ? ` · ${participant.summary.challengesCompleted} of ${requiredChallenges} challenges done` : ""}
      </p>

      <AdminParticipantChallengeSections
        hackathonId={hackathonId}
        participantId={participantId}
        detail={detail.data}
        overview={overview.data}
        reviewNote={reviewNote}
        onReviewNoteChange={setReviewNote}
        onRequestResubmit={(args) => setResubmitTarget(args)}
        resetPending={reset.isPending}
        onReviewSocial={(decision) => review.mutate(decision)}
        reviewPending={review.isPending}
      />

      <RequestResubmissionDialog
        open={Boolean(resubmitTarget)}
        onOpenChange={(open) => !open && setResubmitTarget(null)}
        title={resubmitTarget ? `Request resubmission · ${resubmitTarget.label}` : "Request resubmission"}
        isLoading={reset.isPending}
        onConfirm={(note) => {
          if (!resubmitTarget) return;
          reset.mutate({
            challengeId: resubmitTarget.challengeId,
            slot: resubmitTarget.slot,
            note: note || undefined,
          });
        }}
      />
    </div>
  );
}
