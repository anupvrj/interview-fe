"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { jobTrackerApi } from "@/lib/api";
import { appCard, appTableHeaderRow, appTableShell } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  JOB_TRACKER_ACTIVE_STATUSES,
  JOB_TRACKER_STATUS_LABELS,
  formatJobTrackerDate,
  statusBadgeClass,
  type JobTrackerCard,
  type JobTrackerListResponse,
  type JobTrackerStatus,
} from "@/lib/job-tracker";

function FavoriteButton({
  card,
  onChange,
}: {
  card: JobTrackerCard;
  onChange: (next: JobTrackerCard) => void;
}) {
  const toggle = async () => {
    try {
      const detail = await jobTrackerApi.patch(card.applicationId, {
        isFavorite: !card.isFavorite,
      });
      onChange({ ...card, isFavorite: detail.isFavorite });
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update favorite",
      );
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={toggle}
      aria-label={card.isFavorite ? "Remove favorite" : "Mark favorite"}
    >
      <Heart
        className={cn(
          "h-4 w-4",
          card.isFavorite ? "fill-[#7367F0] text-[#7367F0]" : "text-muted-foreground",
        )}
      />
    </Button>
  );
}

function StatusSelect({
  card,
  onChange,
}: {
  card: JobTrackerCard;
  onChange: (next: JobTrackerCard) => void;
}) {
  const [saving, setSaving] = useState(false);

  const update = async (status: JobTrackerStatus) => {
    setSaving(true);
    try {
      const detail = await jobTrackerApi.updateStatus(card.applicationId, status);
      onChange({ ...card, status: detail.status });
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-w-[10rem] items-center gap-2">
      <AppSelect
        value={card.status}
        onChange={(status) => update(status as JobTrackerStatus)}
        disabled={saving}
        options={JOB_TRACKER_ACTIVE_STATUSES.map((status) => ({
          value: status,
          label: JOB_TRACKER_STATUS_LABELS[status],
        }))}
        className="h-10"
      />
      {saving ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
    </div>
  );
}

export function JobTrackerList({
  data,
  loading,
  onOpen,
  onItemChange,
  onPageChange,
}: {
  data: JobTrackerListResponse | null;
  loading: boolean;
  onOpen: (id: string) => void;
  onItemChange: (index: number, next: JobTrackerCard) => void;
  onPageChange: (page: number) => void;
}) {
  const items = data?.items ?? [];

  if (loading && items.length === 0) {
    return (
      <div className={cn(appCard, "flex items-center justify-center p-10")}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className={cn(appCard, "space-y-2 p-8 text-center")}>
        <p className="text-base font-semibold">No applications yet</p>
        <p className="text-sm text-muted-foreground">
          Add your first job application to start tracking your pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto lg:block">
        <div className={appTableShell}>
          <Table>
            <TableHeader>
              <TableRow className={appTableHeaderRow}>
                <TableHead>Job</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Match</TableHead>
                <TableHead className="w-12">Fav</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((card, index) => (
                <TableRow
                  key={card.applicationId}
                  className="cursor-pointer"
                  onClick={() => onOpen(card.applicationId)}
                >
                  <TableCell className="font-medium">{card.title}</TableCell>
                  <TableCell>{card.company}</TableCell>
                  <TableCell>{card.locationText || "—"}</TableCell>
                  <TableCell>{formatJobTrackerDate(card.appliedAt)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <StatusSelect
                      card={card}
                      onChange={(next) => onItemChange(index, next)}
                    />
                  </TableCell>
                  <TableCell>
                    {card.matchScore != null ? (
                      <Badge variant="info">{card.matchScore}%</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <FavoriteButton
                      card={card}
                      onChange={(next) => onItemChange(index, next)}
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {card.jobLink ? (
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={card.jobLink} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid gap-3 lg:hidden">
        {items.map((card, index) => (
          <div
            key={card.applicationId}
            className={cn(appCard, "space-y-3 p-4")}
            onClick={() => onOpen(card.applicationId)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{card.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {card.company}
                </p>
              </div>
              <FavoriteButton
                card={card}
                onChange={(next) => onItemChange(index, next)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusBadgeClass(card.status)}>
                {JOB_TRACKER_STATUS_LABELS[card.status]}
              </Badge>
              {card.matchScore != null ? (
                <Badge variant="info">{card.matchScore}% match</Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {card.locationText || "Location N/A"} · Applied{" "}
              {formatJobTrackerDate(card.appliedAt)}
            </p>
            <div onClick={(e) => e.stopPropagation()}>
              <StatusSelect
                card={card}
                onChange={(next) => onItemChange(index, next)}
              />
            </div>
          </div>
        ))}
      </div>

      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} · {data.total} total
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={data.page <= 1}
              onClick={() => onPageChange(data.page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={data.page >= data.totalPages}
              onClick={() => onPageChange(data.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
