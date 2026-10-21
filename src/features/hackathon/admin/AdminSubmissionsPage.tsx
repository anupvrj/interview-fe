"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Search, Trash2, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  hackathonAdminApi,
  toHackathonError,
  type AdminParticipantSort,
  type ParticipantStatus,
  type SocialReviewStatus,
} from "../api";
import { HACKATHON_ADMIN_PATH } from "../config";
import { formatIst } from "../copy";
import { hackathonKeys } from "../hooks";
import { ADMIN_REMOVE_PARTICIPANT_DESCRIPTION } from "./adminRemoveParticipant";
import { buildSubmissionTableColumns, cellForColumn } from "./buildSubmissionTableColumns";
import { HackathonAdminField, hackathonAdminControlClass } from "./HackathonAdminField";
import { HackathonAdminShell } from "./HackathonAdminShell";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

const STATUS_LABEL: Record<ParticipantStatus, string> = {
  registered: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  disqualified: "Disqualified",
  withdrawn: "Withdrawn",
  suspended: "Suspended",
};

export function participantStatusBadge(status: ParticipantStatus) {
  const variant =
    status === "completed"
      ? "success"
      : status === "in_progress"
        ? "info"
        : status === "registered"
          ? "neutral"
          : status === "suspended"
            ? "warning"
            : "danger";
  return <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>;
}

export function socialBadge(status: SocialReviewStatus | undefined) {
  if (!status || status === "none") return <span className="text-muted-foreground">—</span>;
  if (status === "approved") return <Badge variant="success">Approved</Badge>;
  if (status === "rejected") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="warning">Pending review</Badge>;
}

export function scoreText(score: number | null | undefined) {
  return typeof score === "number" ? `${Math.round(score)}%` : "—";
}

function InterviewScoreCell({ score, hasRecording }: Readonly<{ score: number | null; hasRecording: boolean | null }>) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className={cn("tabular-nums", typeof score === "number" ? "font-semibold" : "")}>{scoreText(score)}</span>
      {hasRecording === false ? (
        <Badge variant="warning" className="gap-1 text-[10px] font-medium">
          <VideoOff className="h-3 w-3" aria-hidden />
          No video
        </Badge>
      ) : null}
    </div>
  );
}

export function AdminSubmissionsPage({ hackathonId }: Readonly<{ hackathonId: string }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ participantId: string; who: string } | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ParticipantStatus | "all">("all");
  const [socialReview, setSocialReview] = useState<SocialReviewStatus | "all">("all");
  const [missingVideo, setMissingVideo] = useState<"all" | "yes">("all");
  const [sort, setSort] = useState<AdminParticipantSort>("recent");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const hackathon = useQuery({
    queryKey: hackathonKeys.adminOne(hackathonId),
    queryFn: () => hackathonAdminApi.get(hackathonId),
  });
  const list = useQuery({
    queryKey: [
      "admin",
      "hackathons",
      hackathonId,
      "participants",
      { q, status, socialReview, missingVideo, sort, page },
    ],
    queryFn: () =>
      hackathonAdminApi.participants(hackathonId, {
        q: q || undefined,
        status: status === "all" ? undefined : status,
        socialReview: socialReview === "all" ? undefined : socialReview,
        missingVideo: missingVideo === "yes" ? true : undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const removeParticipant = useMutation({
    mutationFn: (participantId: string) => hackathonAdminApi.deleteParticipant(hackathonId, participantId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "hackathons", hackathonId, "participants"] }),
        queryClient.invalidateQueries({ queryKey: hackathonKeys.adminOne(hackathonId) }),
      ]);
      toast.success("Participant removed. They can register for this hackathon again.");
      setRemovingId(null);
    },
    onError: (err) => {
      toast.error(toHackathonError(err).message);
      setRemovingId(null);
    },
  });

  const columns = useMemo(() => buildSubmissionTableColumns(hackathon.data), [hackathon.data]);
  const requiredChallenges = hackathon.data?.challenges?.length ?? 3;
  const detailHref = (participantId: string) =>
    `${HACKATHON_ADMIN_PATH}/${hackathonId}/participants/${participantId}`;

  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <HackathonAdminShell hackathonId={hackathonId} activeTab="submissions">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <HackathonAdminField id="hk-sub-search" label="Search" className="min-w-[200px] flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="hk-sub-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name, email, or role"
                className={cn(hackathonAdminControlClass, "pl-9")}
              />
            </div>
          </HackathonAdminField>
          <HackathonAdminField id="hk-sub-status" label="Status" className="sm:w-44">
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as ParticipantStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger id="hk-sub-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(STATUS_LABEL) as ParticipantStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </HackathonAdminField>
          <HackathonAdminField id="hk-sub-social" label="Social review" className="sm:w-44">
            <Select
              value={socialReview}
              onValueChange={(v) => {
                setSocialReview(v as SocialReviewStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger id="hk-sub-social" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="none">Not submitted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </HackathonAdminField>
          <HackathonAdminField id="hk-sub-video" label="Recording" className="sm:w-40">
            <Select
              value={missingVideo}
              onValueChange={(v) => {
                setMissingVideo(v as "all" | "yes");
                setPage(1);
              }}
            >
              <SelectTrigger id="hk-sub-video" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Missing video</SelectItem>
              </SelectContent>
            </Select>
          </HackathonAdminField>
          <HackathonAdminField id="hk-sub-sort" label="Sort" className="sm:w-48">
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v as AdminParticipantSort);
                setPage(1);
              }}
            >
              <SelectTrigger id="hk-sub-sort" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Newest first</SelectItem>
                <SelectItem value="ats">Highest ATS score</SelectItem>
                <SelectItem value="interview">Highest interview score</SelectItem>
                <SelectItem value="completed">Completed first</SelectItem>
              </SelectContent>
            </Select>
          </HackathonAdminField>
        </div>

        <Card>
          <CardContent className="p-0">
            {list.isLoading ? (
              <div className="flex items-center gap-2 p-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading submissions…
              </div>
            ) : list.isError ? (
              <p className="p-6 text-sm text-destructive">{toHackathonError(list.error).message}</p>
            ) : (list.data?.rows.length ?? 0) === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No participants match.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Progress</TableHead>
                      {columns.map((col) => (
                        <TableHead
                          key={`${col.kind}-${col.kind === "interview_slot" ? `${col.challengeId}-${col.slot}` : col.challengeId}`}
                          className={col.kind === "social" ? "" : "text-right"}
                          title={col.kind === "interview_slot" ? col.label : undefined}
                        >
                          {col.kind === "interview_slot" ? col.shortLabel : col.label}
                        </TableHead>
                      ))}
                      <TableHead>Registered</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="sr-only">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.data!.rows.map((row) => {
                      const href = detailHref(row.participantId);
                      return (
                        <TableRow
                          key={row.participantId}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(href)}
                        >
                          <TableCell className="min-w-[200px]">
                            <p className="font-medium text-foreground">{row.profileSnapshot?.name || "Unnamed"}</p>
                            <p className="text-xs text-muted-foreground">{row.profileSnapshot?.email || row.userId}</p>
                            {row.profileSnapshot?.targetJobRole ? (
                              <p className="text-xs text-muted-foreground">{row.profileSnapshot.targetJobRole}</p>
                            ) : null}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm tabular-nums">
                            {row.phone ? (
                              <a
                                href={`tel:${row.phone.replace(/\s+/g, "")}`}
                                className="text-foreground hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {row.phone}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{participantStatusBadge(row.status)}</TableCell>
                          <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                            {row.summary?.challengesCompleted ?? 0}/{requiredChallenges}
                          </TableCell>
                          {columns.map((col) => {
                            const { score, hasRecording } = cellForColumn(row, col);
                            if (col.kind === "social") {
                              return (
                                <TableCell key={`${row.participantId}-social`}>
                                  {socialBadge(row.summary?.socialReviewStatus)}
                                </TableCell>
                              );
                            }
                            if (col.kind === "resume") {
                              return (
                                <TableCell key={`${row.participantId}-resume`} className="text-right font-semibold tabular-nums">
                                  {scoreText(score)}
                                </TableCell>
                              );
                            }
                            return (
                              <TableCell key={`${row.participantId}-${col.challengeId}-${col.slot}`} className="text-right">
                                <InterviewScoreCell score={score} hasRecording={hasRecording} />
                              </TableCell>
                            );
                          })}
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {formatIst(row.registeredAt)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {row.completedAt ? formatIst(row.completedAt) : "—"}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button asChild size="sm" variant="outline">
                                <Link href={href}>View</Link>
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={removeParticipant.isPending}
                                aria-label={`Remove ${row.profileSnapshot?.name || row.profileSnapshot?.email || "participant"} from hackathon`}
                                title="Remove from hackathon"
                                onClick={() => {
                                  const who =
                                    row.profileSnapshot?.name || row.profileSnapshot?.email || "this participant";
                                  setRemoveTarget({ participantId: row.participantId, who });
                                }}
                              >
                                {removeParticipant.isPending && removingId === row.participantId ? (
                                  <Loader2 className="size-4 animate-spin" aria-hidden />
                                ) : (
                                  <Trash2 className="size-4" aria-hidden />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <ConfirmationDialog
          open={removeTarget !== null}
          onOpenChange={(open) => {
            if (!open && !removeParticipant.isPending) setRemoveTarget(null);
          }}
          title={removeTarget ? `Remove ${removeTarget.who}?` : "Remove participant?"}
          description={ADMIN_REMOVE_PARTICIPANT_DESCRIPTION}
          confirmText="Remove from hackathon"
          cancelText="Cancel"
          variant="destructive"
          isLoading={removeParticipant.isPending}
          onConfirm={async () => {
            if (!removeTarget) return;
            setRemovingId(removeTarget.participantId);
            await removeParticipant.mutateAsync(removeTarget.participantId);
            setRemoveTarget(null);
          }}
        />

        {total > PAGE_SIZE ? (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {page} of {pages} · {total} participants
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </HackathonAdminShell>
  );
}
