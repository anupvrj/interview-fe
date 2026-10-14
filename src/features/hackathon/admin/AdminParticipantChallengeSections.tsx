"use client";

import Link from "next/link";
import {
  Check,
  ExternalLink,
  FileText,
  Instagram,
  Linkedin,
  Mic,
  PlayCircle,
  VideoOff,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/api";
import { appSurfaceMuted } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  hackathonAdminApi,
  eventTargets,
  type AdminHackathonOverview,
  type AdminParticipantDetail,
  type HackathonChallenge,
  type HackathonChallengeKind,
} from "../api";
import { resolveChallengeId, resolveChallengeKind } from "./challengeMeta";
import { failureReasonText, formatIst } from "../copy";
import { scoreText, socialBadge } from "./AdminSubmissionsPage";
import { HackathonAdminField } from "./HackathonAdminField";

const INTERVIEW_KINDS: HackathonChallengeKind[] = ["screening", "coding", "system_design"];

function ScoreBlock({ label, score, target }: Readonly<{ label: string; score: number | null; target: number }>) {
  const met = typeof score === "number" && score >= target;
  return (
    <div className={cn(appSurfaceMuted, "px-4 py-3")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-2xl font-bold tabular-nums",
          met ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
        )}
      >
        {scoreText(score)}
      </p>
      <p className="text-xs text-muted-foreground">Target {target}%</p>
    </div>
  );
}

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
  } catch {
    tab?.close();
    throw new Error("Couldn't open the file");
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
  if (status === "submitted") return <Badge variant="success">Submitted</Badge>;
  if (status === "processing") return <Badge variant="info">Report generating</Badge>;
  if (status === "in_progress") return <Badge variant="info">In progress</Badge>;
  return <Badge variant="neutral">Not submitted</Badge>;
}

function AdminResetBanner({
  adminReset,
}: Readonly<{ adminReset?: { at: string; note: string | null } | null }>) {
  if (!adminReset?.note && !adminReset?.at) return null;
  return (
    <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
      {adminReset.note ? (
        <>
          <span className="font-semibold">Resubmission requested:</span> {adminReset.note}
        </>
      ) : (
        <span className="font-semibold">Resubmission requested</span>
      )}
      {adminReset.at ? <span className="text-amber-800/80 dark:text-amber-200/80"> · {formatIst(adminReset.at)}</span> : null}
    </p>
  );
}

export function AdminParticipantChallengeSections({
  hackathonId,
  participantId,
  detail,
  overview,
  reviewNote,
  onReviewNoteChange,
  onRequestResubmit,
  resetPending,
  onReviewSocial,
  reviewPending,
}: Readonly<{
  hackathonId: string;
  participantId: string;
  detail: AdminParticipantDetail;
  overview: AdminHackathonOverview | undefined;
  reviewNote: string;
  onReviewNoteChange: (v: string) => void;
  onRequestResubmit: (args: { challengeId: string; label: string; slot?: number }) => void;
  resetPending: boolean;
  onReviewSocial: (decision: "approved" | "rejected") => void;
  reviewPending: boolean;
}>) {
  const { participant, resume, interviews, social } = detail;
  const targets = eventTargets(overview);
  const challenges = overview?.challenges ?? [];
  const socialEnabled = overview?.socialConfig.enabled !== false;
  const userId = participant.userId;

  const interviewsByChallenge = new Map<string, AdminParticipantDetail["interviews"]>();
  for (const row of interviews) {
    const cid = row.challengeId ?? "_legacy";
    const list = interviewsByChallenge.get(cid) ?? [];
    list.push(row);
    interviewsByChallenge.set(cid, list);
  }

  if (!challenges.length) {
    return <p className="text-sm text-muted-foreground">Challenge configuration not loaded.</p>;
  }

  return (
    <div className="space-y-5">
      {challenges.map((challenge: HackathonChallenge) => {
        const kind = resolveChallengeKind(challenge);
        const challengeId = resolveChallengeId(challenge);
        if (!kind || !challengeId) return null;

        if (kind === "resume") {
          return (
            <Card key={challengeId}>
              <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-primary" /> {challenge.title}
                  </CardTitle>
                  <CardDescription>
                    {resume
                      ? `${resume.title || "Untitled resume"} · submitted ${formatIst(resume.submittedAt)}`
                      : "No resume submitted yet."}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {resume ? <StepBadge status={resume.status} /> : null}
                  {resume ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resetPending || resume.status === "in_progress"}
                      onClick={() =>
                        onRequestResubmit({ challengeId, label: challenge.title })
                      }
                    >
                      Request resubmission
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              {resume ? (
                <CardContent className="flex flex-col gap-4">
                  <AdminResetBanner adminReset={resume.adminReset} />
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                  </div>
                </CardContent>
              ) : null}
            </Card>
          );
        }

        if (INTERVIEW_KINDS.includes(kind)) {
          const slotTotal = challenge.config?.requiredCount ?? overview?.interviewConfig.requiredCount ?? 1;
          const rows = interviewsByChallenge.get(challengeId) ?? [];
          const slots = Array.from({ length: slotTotal }, (_, i) => rows.find((item) => item.slot === i + 1) ?? null);

          return (
            <div key={challengeId} className="space-y-3">
              {slotTotal > 1 && slots.some(Boolean) ? (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resetPending}
                    onClick={() =>
                      onRequestResubmit({
                        challengeId,
                        label: `${challenge.title} (all slots)`,
                      })
                    }
                  >
                    Request resubmission (all slots)
                  </Button>
                </div>
              ) : null}
              <div className="grid gap-5 lg:grid-cols-2">
                {slots.map((item, idx) => {
                  const slot = idx + 1;
                  const slotLabel = slotTotal > 1 ? `${challenge.title} · Slot ${slot}` : challenge.title;
                  return (
                    <Card key={`${challengeId}-${slot}`}>
                      <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Mic className="h-4 w-4 text-primary" /> {slotLabel}
                          </CardTitle>
                          <CardDescription>
                            {item?.submittedAt ? `Submitted ${formatIst(item.submittedAt)}` : "No report yet."}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StepBadge status={item?.status ?? "not_started"} />
                          {item ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={resetPending || (item.status === "in_progress" && item.attempts.length === 0)}
                              onClick={() =>
                                onRequestResubmit({
                                  challengeId,
                                  label: slotLabel,
                                  slot,
                                })
                              }
                            >
                              Request resubmission
                            </Button>
                          ) : null}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <AdminResetBanner adminReset={item?.adminReset} />
                        <ScoreBlock
                          label="Overall score"
                          score={item?.overallScore ?? null}
                          target={targets.interviewScore}
                        />
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
                            {item.reportId || item.status === "submitted" || item.status === "processing" ? (
                              <Button asChild size="sm" variant="default">
                                <Link href={`/super-admin/users/${userId}/reports/${item.interviewId}`}>
                                  <FileText className="mr-1.5 h-4 w-4" /> Interview report
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
                            ) : item.interviewId ? (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <VideoOff className="h-3.5 w-3.5" /> Recording not found
                              </span>
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
                                      href={`/super-admin/users/${userId}/reports/${a.interviewId}`}
                                      className="text-primary hover:underline"
                                    >
                                      open report
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
            </div>
          );
        }

        if (kind === "social" && socialEnabled) {
          return (
            <Card key={challengeId}>
              <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base">{challenge.title}</CardTitle>
                  <CardDescription>
                    {social?.submittedAt ? `Submitted ${formatIst(social.submittedAt)}` : "No links submitted yet."}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {socialBadge(social?.reviewStatus)}
                  {social ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resetPending || social.status === "in_progress"}
                      onClick={() => onRequestResubmit({ challengeId, label: challenge.title })}
                    >
                      Request resubmission
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              {social?.linkedinUrl || social?.instagramUrl ? (
                <CardContent className="space-y-4">
                  <AdminResetBanner adminReset={social.adminReset} />
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
                        onChange={(e) => onReviewNoteChange(e.target.value)}
                        placeholder="Optional note. Shown to the participant if you reject."
                      />
                    </HackathonAdminField>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewPending || social.reviewStatus === "approved"}
                        onClick={() => onReviewSocial("approved")}
                      >
                        <Check className="mr-1.5 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={reviewPending || social.reviewStatus === "rejected"}
                        onClick={() => onReviewSocial("rejected")}
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
          );
        }

        return null;
      })}
    </div>
  );
}
