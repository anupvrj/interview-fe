"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ExternalLink,
  FileText,
  Instagram,
  Linkedin,
  Loader2,
  Mic,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/api";
import { appSurfaceMuted } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import { hackathonAdminApi, eventTargets, toHackathonError, type AdminParticipantDetail } from "../api";
import { HACKATHON_ADMIN_PATH } from "../config";
import { failureReasonText, formatIst } from "../copy";
import { hackathonKeys } from "../hooks";
import { participantStatusBadge, scoreText, socialBadge } from "./AdminSubmissionsPage";
import { HackathonAdminField } from "./HackathonAdminField";

function ScoreBlock({ label, score, target }: Readonly<{ label: string; score: number | null; target: number }>) {
  const met = typeof score === "number" && score >= target;
  return (
    <div className={cn(appSurfaceMuted, "px-4 py-3")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-2xl font-bold tabular-nums", met ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
        {scoreText(score)}
      </p>
      <p className="text-xs text-muted-foreground">Target {target}%</p>
    </div>
  );
}

/** Opens a tab synchronously so the async signed URL isn't popup-blocked. */
async function openInNewTab(getUrl: () => Promise<string>) {
  const tab = window.open("", "_blank");
  try {
    const url = await getUrl();
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  } catch (err) {
    tab?.close();
    toast.error(toHackathonError(err, "Couldn't open the file").message);
  }
}

function PriorNote({ count }: Readonly<{ count?: number }>) {
  if (!count) return null;
  return (
    <p className="text-xs text-muted-foreground">
      {count} prior submission{count === 1 ? "" : "s"} archived. Live score is the latest attempt only.
    </p>
  );
}

function StepBadge({ status }: Readonly<{ status: string }>) {
  if (status === "completed") return <Badge variant="success">Submitted</Badge>;
  if (status === "processing") return <Badge variant="info">Report generating</Badge>;
  if (status === "in_progress") return <Badge variant="info">In progress</Badge>;
  return <Badge variant="neutral">Not submitted</Badge>;
}

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
      router.push(`${HACKATHON_ADMIN_PATH}/${hackathonId}`);
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
    const ok = window.confirm(
      `Remove ${who} from this hackathon?\n\nTheir entry, resume, interview and social submissions for this hackathon are deleted and can't be restored. Their InterviewTrix account is not affected, and they can register again from scratch.`,
    );
    if (ok) remove.mutate();
  };

  const reset = useMutation({
    mutationFn: ({ challengeId, slot }: { challengeId: string; slot?: number }) =>
      hackathonAdminApi.resetChallenge(hackathonId, participantId, challengeId, {
        slot,
        note: "Requested reattempt",
      }),
    onSuccess: (data: AdminParticipantDetail) => {
      queryClient.setQueryData(key, data);
      void queryClient.invalidateQueries({ queryKey: ["admin", "hackathons", hackathonId, "participants"] });
      toast.success("Challenge reopened. The next submission is the live one.");
    },
    onError: (err) => toast.error(toHackathonError(err).message),
  });

  const confirmReset = (label: string, challengeId: string, slot?: number) => {
    const ok = window.confirm(
      `Allow ${label} to be submitted again? The current score stays in admin history. Only the next attempt will count.`,
    );
    if (ok) reset.mutate({ challengeId, slot });
  };

  const review = useMutation({
    mutationFn: (decision: "approved" | "rejected") =>
      hackathonAdminApi.reviewSocial(hackathonId, participantId, decision, reviewNote.trim() || undefined),
    onSuccess: (data: AdminParticipantDetail, decision) => {
      queryClient.setQueryData(key, data);
      void queryClient.invalidateQueries({ queryKey: ["admin", "hackathons", hackathonId, "participants"] });
      setReviewNote("");
      toast.success(decision === "approved" ? "Social posts approved" : "Social posts rejected");
    },
    onError: (err) => toast.error(toHackathonError(err).message),
  });

  const backHref = `${HACKATHON_ADMIN_PATH}/${hackathonId}`;

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

  const { participant, resume, interviews, social } = detail.data;
  const profile = participant.profileSnapshot;
  const who = profile?.name || profile?.email || "this participant";
  const targets = eventTargets(overview.data);
  const requiredCount = overview.data?.interviewConfig.requiredCount ?? 2;
  const socialEnabled = overview.data?.socialConfig.enabled !== false;
  const requiredChallenges = overview.data?.challenges?.length ?? (socialEnabled ? 3 : 2);
  const challenges = overview.data?.challenges ?? [];
  const resumeChallengeId = challenges.find((c) => c.kind === "resume")?.challengeId;
  const socialChallengeId = challenges.find((c) => c.kind === "social")?.challengeId;
  const interviewChallenge =
    challenges.find((c) => c.kind === "screening") ??
    challenges.find((c) => c.kind === "coding" || c.kind === "system_design");
  const interviewChallengeId = interviewChallenge?.challengeId;
  const slotTotal = interviewChallenge?.config?.requiredCount ?? requiredCount;
  const slots = Array.from({ length: slotTotal }, (_, i) => interviews.find((item) => item.slot === i + 1) ?? null);

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

      <Card>
        <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" /> Challenge 1 · Resume
            </CardTitle>
            <CardDescription>
              {resume ? `${resume.title || "Untitled resume"} · submitted ${formatIst(resume.submittedAt)}` : "No resume submitted yet."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {resume ? <StepBadge status={resume.status} /> : null}
            {resumeChallengeId && resume ? (
              <Button
                size="sm"
                variant="outline"
                disabled={reset.isPending || resume.status === "in_progress"}
                onClick={() => confirmReset("the resume", resumeChallengeId)}
              >
                Allow resubmit
              </Button>
            ) : null}
          </div>
        </CardHeader>
        {resume ? (
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 sm:w-48">
              <ScoreBlock label="ATS score" score={resume.atsScore} target={targets.atsScore} />
              <PriorNote count={resume.priorCount} />
            </div>
            {resume.status === "submitted" ? (
              <Button
                variant="outline"
                onClick={() =>
                  void openInNewTab(async () => (await hackathonAdminApi.resumeUrl(hackathonId, participantId)).url)
                }
              >
                <ExternalLink className="mr-1.5 h-4 w-4" /> View resume PDF
              </Button>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      {interviewChallengeId && slotTotal > 1 && slots.some((item) => item) ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            disabled={reset.isPending}
            onClick={() => confirmReset("every interview in this challenge", interviewChallengeId)}
          >
            Allow resubmit (all interviews)
          </Button>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {slots.map((item, idx) => {
          const slot = idx + 1;
          return (
            <Card key={slot}>
              <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mic className="h-4 w-4 text-primary" /> Challenge 2 · Interview {slot}
                  </CardTitle>
                  <CardDescription>
                    {item?.submittedAt ? `Submitted ${formatIst(item.submittedAt)}` : "No report yet."}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StepBadge status={item?.status ?? "not_started"} />
                  {interviewChallengeId && item ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={reset.isPending || (item.status === "in_progress" && item.attempts.length === 0)}
                      onClick={() => confirmReset(`interview ${slot}`, interviewChallengeId, slot)}
                    >
                      Reset interview {slot}
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreBlock label="Overall score" score={item?.overallScore ?? null} target={targets.interviewScore} />
                <PriorNote count={item?.priorCount} />
                {item?.categoryScores && Object.keys(item.categoryScores).length > 0 ? (
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {Object.entries(item.categoryScores).map(([name, value]) => (
                      <li key={name} className="flex justify-between gap-2">
                        <span className="truncate capitalize text-muted-foreground">{name.replace(/[_-]/g, " ")}</span>
                        <span className="font-medium tabular-nums text-foreground">{scoreText(value)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {item?.interviewId ? (
                  <div className="flex flex-wrap gap-2">
                    {item.reportId || item.status === "completed" ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/super-admin/users/${participant.userId}/reports/${item.interviewId}`}>
                          <FileText className="mr-1.5 h-4 w-4" /> View report
                        </Link>
                      </Button>
                    ) : null}
                    {item.hasRecording ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void openInNewTab(async () => (await adminApi.getInterviewVideoUrl(item.interviewId!)).videoUrl)
                        }
                      >
                        <PlayCircle className="mr-1.5 h-4 w-4" /> Watch recording
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {item && item.attempts.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-foreground">Attempts</p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {item.attempts.map((a, i) => (
                        <li key={a.attemptId} className="flex flex-wrap items-center gap-x-2">
                          <span className="font-medium text-foreground">#{i + 1}</span>
                          <span className="capitalize">{a.status.replace(/_/g, " ")}</span>
                          <span>· {formatIst(a.startedAt ?? a.claimedAt)}</span>
                          {a.failureReason ? <span>· {failureReasonText(a.failureReason)}</span> : null}
                          {!a.countsTowardLimit ? <span>· not counted</span> : null}
                          {a.interviewId && a.interviewId !== item.interviewId ? (
                            <Link
                              href={`/super-admin/users/${participant.userId}/reports/${a.interviewId}`}
                              className="text-primary hover:underline"
                            >
                              open
                            </Link>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {socialEnabled ? (
      <Card>
        <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Challenge 3 · Social posts</CardTitle>
            <CardDescription>
              {social?.submittedAt ? `Submitted ${formatIst(social.submittedAt)}` : "No links submitted yet."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {socialBadge(social?.reviewStatus)}
            {socialChallengeId && social ? (
              <Button
                size="sm"
                variant="outline"
                disabled={reset.isPending || social.status === "in_progress"}
                onClick={() => confirmReset("the social posts", socialChallengeId)}
              >
                Allow resubmit
              </Button>
            ) : null}
          </div>
        </CardHeader>
        {social?.linkedinUrl || social?.instagramUrl ? (
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: "LinkedIn", url: social.linkedinUrl, Icon: Linkedin },
                { label: "Instagram", url: social.instagramUrl, Icon: Instagram },
              ].map(({ label, url, Icon }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={cn(appSurfaceMuted, "flex items-center gap-3 px-4 py-3 text-sm hover:border-primary/40")}
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted-foreground">{label}</span>
                    <span className="block truncate font-medium text-foreground">{url}</span>
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              ))}
            </div>
            <PriorNote count={social.priorCount} />
            {social.reviewNote ? (
              <p className="text-xs text-muted-foreground">
                Review note: “{social.reviewNote}”{social.reviewedAt ? ` · ${formatIst(social.reviewedAt)}` : ""}
              </p>
            ) : null}
            <div className="space-y-2">
              <HackathonAdminField id="hk-review-note" label="Review note">
                <Textarea
                  id="hk-review-note"
                  rows={2}
                  className="w-full min-w-0"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Optional note. Shown to the participant if you reject."
                />
              </HackathonAdminField>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={review.isPending || social.reviewStatus === "approved"}
                  onClick={() => review.mutate("approved")}
                >
                  <Check className="mr-1.5 h-4 w-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={review.isPending || social.reviewStatus === "rejected"}
                  onClick={() => review.mutate("rejected")}
                >
                  <X className="mr-1.5 h-4 w-4" /> Reject
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Rejecting while the hackathon is live moves a completed participant back to in progress so they can fix
                their links.
              </p>
            </div>
          </CardContent>
        ) : null}
      </Card>
      ) : null}
    </div>
  );
}
