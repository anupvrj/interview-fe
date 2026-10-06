"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { SuperAdminPageHeader } from "@/components/super-admin/SuperAdminPageHeader";
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
import { phaseBadge } from "./AdminHackathonsPage";
import { HackathonAdminField, hackathonAdminControlClass } from "./HackathonAdminField";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

const STATUS_LABEL: Record<ParticipantStatus, string> = {
  registered: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  disqualified: "Disqualified",
  withdrawn: "Withdrawn",
};

export function participantStatusBadge(status: ParticipantStatus) {
  const variant =
    status === "completed" ? "success" : status === "in_progress" ? "info" : status === "registered" ? "neutral" : "danger";
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

export function AdminSubmissionsPage({ hackathonId }: Readonly<{ hackathonId: string }>) {
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ParticipantStatus | "all">("all");
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
    queryKey: ["admin", "hackathons", hackathonId],
    queryFn: () => hackathonAdminApi.get(hackathonId),
  });
  const list = useQuery({
    queryKey: ["admin", "hackathons", hackathonId, "participants", { q, status, sort, page }],
    queryFn: () =>
      hackathonAdminApi.participants(hackathonId, {
        q: q || undefined,
        status: status === "all" ? undefined : status,
        sort,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <SuperAdminPageHeader
        backHref={HACKATHON_ADMIN_PATH}
        backLabel="Hackathons"
        title={hackathon.data ? `${hackathon.data.title} submissions` : undefined}
        actions={hackathon.data ? phaseBadge(hackathon.data.phase) : undefined}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <HackathonAdminField id="hk-sub-search" label="Search" className="flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="hk-sub-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email"
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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">ATS score</TableHead>
                    <TableHead className="text-right">Interview 1</TableHead>
                    <TableHead className="text-right">Interview 2</TableHead>
                    <TableHead>Social</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="sr-only">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.data!.rows.map((row) => (
                    <TableRow key={row.participantId}>
                      <TableCell className="min-w-[200px]">
                        <p className="font-medium text-foreground">{row.profileSnapshot?.name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{row.profileSnapshot?.email || row.userId}</p>
                        {row.profileSnapshot?.targetJobRole ? (
                          <p className="text-xs text-muted-foreground">{row.profileSnapshot.targetJobRole}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>{participantStatusBadge(row.status)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{scoreText(row.summary?.resumeAtsScore)}</TableCell>
                      <TableCell className="text-right tabular-nums">{scoreText(row.summary?.interview1Score)}</TableCell>
                      <TableCell className="text-right tabular-nums">{scoreText(row.summary?.interview2Score)}</TableCell>
                      <TableCell>{socialBadge(row.summary?.socialReviewStatus)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatIst(row.registeredAt)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {row.completedAt ? formatIst(row.completedAt) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`${HACKATHON_ADMIN_PATH}/${hackathonId}/participants/${row.participantId}`}>
                            View submission
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
  );
}
