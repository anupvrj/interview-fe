"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { formatIst } from "../copy";
import { hackathonKeys } from "../hooks";
import { ADMIN_REMOVE_PARTICIPANT_DESCRIPTION } from "./adminRemoveParticipant";
import { buildSubmissionTableColumns, cellForColumn } from "./buildSubmissionTableColumns";
import { buildChallengeFilterOptions } from "./challengeFilterOptions";
import { ChallengeMultiFilter } from "./ChallengeMultiFilter";
import { HackathonAdminField, hackathonAdminControlClass } from "./HackathonAdminField";
import { HackathonAdminShell } from "./HackathonAdminShell";
import {
  buildSubmissionsListQueryString,
  parseSubmissionsListSearchParams,
  participantDetailHref,
  type SubmissionsListFilters,
} from "./submissionListQuery";
import { cn } from "@/lib/utils";
import type { AdminPhoneFollowUpKey, AdminParticipantRow } from "../api";

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

const PHONE_FOLLOW_UP_KEYS: AdminPhoneFollowUpKey[] = ["first", "second", "third"];

function PhoneFollowUpCheckbox({
  participantId,
  followKey,
  checked,
  disabled,
  onToggle,
}: Readonly<{
  participantId: string;
  followKey: AdminPhoneFollowUpKey;
  checked: boolean;
  disabled: boolean;
  onToggle: (participantId: string, followKey: AdminPhoneFollowUpKey, next: boolean) => void;
}>) {
  return (
    <input
      type="checkbox"
      className="size-4 rounded border-input"
      checked={checked}
      disabled={disabled}
      aria-label={`Phone follow-up ${followKey}`}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onToggle(participantId, followKey, e.target.checked)}
    />
  );
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const filters = useMemo(() => parseSubmissionsListSearchParams(searchParams), [searchParams]);
  const [searchInput, setSearchInput] = useState(filters.q);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ participantId: string; who: string } | null>(null);
  const [followUpPending, setFollowUpPending] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  const replaceFilters = useCallback(
    (patch: Partial<SubmissionsListFilters>) => {
      const next: SubmissionsListFilters = { ...filters, ...patch };
      const qs = buildSubmissionsListQueryString(next);
      router.replace(`${pathname}${qs}`, { scroll: false });
    },
    [filters, pathname, router],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed === filters.q) return;
      replaceFilters({ q: trimmed, page: 1 });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, filters.q, replaceFilters]);

  const hackathon = useQuery({
    queryKey: hackathonKeys.adminOne(hackathonId),
    queryFn: () => hackathonAdminApi.get(hackathonId),
  });
  const challengeOptions = useMemo(() => buildChallengeFilterOptions(hackathon.data), [hackathon.data]);
  const validChallengeIds = useMemo(() => new Set(challengeOptions.map((o) => o.challengeId)), [challengeOptions]);
  const passedChallenges = useMemo(
    () => filters.passedChallenges.filter((id) => validChallengeIds.has(id)),
    [filters.passedChallenges, validChallengeIds],
  );

  useEffect(() => {
    if (challengeOptions.length === 0) return;
    const stale = filters.passedChallenges.some((id) => !validChallengeIds.has(id));
    if (!stale) return;
    replaceFilters({ passedChallenges });
  }, [challengeOptions.length, filters.passedChallenges, passedChallenges, replaceFilters, validChallengeIds]);

  const list = useQuery({
    queryKey: [
      "admin",
      "hackathons",
      hackathonId,
      "participants",
      {
        q: filters.q,
        status: filters.status,
        socialReview: filters.socialReview,
        missingVideo: filters.missingVideo,
        sort: filters.sort,
        page: filters.page,
        passedChallenges,
      },
    ],
    queryFn: () =>
      hackathonAdminApi.participants(hackathonId, {
        q: filters.q || undefined,
        status: filters.status === "all" ? undefined : filters.status,
        socialReview: filters.socialReview === "all" ? undefined : filters.socialReview,
        missingVideo: filters.missingVideo === "yes" ? true : undefined,
        passedChallenges: passedChallenges.length ? passedChallenges : undefined,
        sort: filters.sort,
        page: filters.page,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const phoneFollowUp = useMutation({
    mutationFn: ({
      participantId,
      key,
      value,
    }: {
      participantId: string;
      key: AdminPhoneFollowUpKey;
      value: boolean;
    }) => hackathonAdminApi.updatePhoneFollowUps(hackathonId, participantId, { [key]: value }),
    onMutate: async ({ participantId, key, value }) => {
      setFollowUpPending(`${participantId}:${key}`);
      const queryKey = [
        "admin",
        "hackathons",
        hackathonId,
        "participants",
        {
          q: filters.q,
          status: filters.status,
          socialReview: filters.socialReview,
          missingVideo: filters.missingVideo,
          sort: filters.sort,
          page: filters.page,
          passedChallenges,
        },
      ] as const;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ rows: AdminParticipantRow[] }>(queryKey);
      if (previous) {
        queryClient.setQueryData(queryKey, {
          ...previous,
          rows: previous.rows.map((row) =>
            row.participantId === participantId
              ? { ...row, phoneFollowUps: { ...row.phoneFollowUps, [key]: value } }
              : row,
          ),
        });
      }
      return { previous, queryKey };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(context.queryKey, context.previous);
      toast.error(toHackathonError(err).message);
    },
    onSettled: (_data, _err, _vars, context) => {
      setFollowUpPending(null);
      if (context?.queryKey) void queryClient.invalidateQueries({ queryKey: context.queryKey });
    },
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
  const listFiltersForLinks: SubmissionsListFilters = { ...filters, passedChallenges };
  const detailHref = (participantId: string) => participantDetailHref(hackathonId, participantId, listFiltersForLinks);

  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleFollowUp = (participantId: string, key: AdminPhoneFollowUpKey, next: boolean) => {
    phoneFollowUp.mutate({ participantId, key, value: next });
  };

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
          <HackathonAdminField id="hk-sub-challenges" label="Challenges passed" className="sm:w-56">
            <ChallengeMultiFilter
              id="hk-sub-challenges"
              options={challengeOptions}
              selectedIds={passedChallenges}
              onChange={(ids) => replaceFilters({ passedChallenges: ids, page: 1 })}
            />
          </HackathonAdminField>
          <HackathonAdminField id="hk-sub-status" label="Status" className="sm:w-44">
            <Select
              value={filters.status}
              onValueChange={(v) => {
                replaceFilters({ status: v as ParticipantStatus | "all", page: 1 });
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
              value={filters.socialReview}
              onValueChange={(v) => {
                replaceFilters({ socialReview: v as SocialReviewStatus | "all", page: 1 });
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
              value={filters.missingVideo}
              onValueChange={(v) => {
                replaceFilters({ missingVideo: v as "all" | "yes", page: 1 });
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
              value={filters.sort}
              onValueChange={(v) => {
                replaceFilters({ sort: v as AdminParticipantSort, page: 1 });
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
                      <TableHead className="text-center" title="1st phone follow-up">
                        Call 1
                      </TableHead>
                      <TableHead className="text-center" title="2nd phone follow-up">
                        Call 2
                      </TableHead>
                      <TableHead className="text-center" title="3rd phone follow-up">
                        Call 3
                      </TableHead>
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
                          {PHONE_FOLLOW_UP_KEYS.map((key) => (
                            <TableCell key={`${row.participantId}-${key}`} className="text-center">
                              <PhoneFollowUpCheckbox
                                participantId={row.participantId}
                                followKey={key}
                                checked={Boolean(row.phoneFollowUps?.[key])}
                                disabled={followUpPending === `${row.participantId}:${key}`}
                                onToggle={toggleFollowUp}
                              />
                            </TableCell>
                          ))}
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
              Page {filters.page} of {pages} · {total} participants
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => replaceFilters({ page: filters.page - 1 })}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page >= pages}
                onClick={() => replaceFilters({ page: filters.page + 1 })}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </HackathonAdminShell>
  );
}
