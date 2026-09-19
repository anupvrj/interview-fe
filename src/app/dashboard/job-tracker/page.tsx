"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Columns3, LayoutList, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { AddApplicationDialog } from "@/components/job-tracker/AddApplicationDialog";
import { JobTrackerBoard } from "@/components/job-tracker/JobTrackerBoard";
import { JobTrackerFilters } from "@/components/job-tracker/JobTrackerFilters";
import { JobTrackerList } from "@/components/job-tracker/JobTrackerList";
import { JobTrackerSheet } from "@/components/job-tracker/JobTrackerSheet";
import { Button } from "@/components/ui/button";
import { jobTrackerApi } from "@/lib/api";
import {
  appCard,
  appOutlineButton,
  appPrimaryButton,
} from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  EMPTY_JOB_TRACKER_FILTERS,
  type JobTrackerBoardResponse,
  type JobTrackerDetail,
  type JobTrackerListFilters,
  type JobTrackerListResponse,
} from "@/lib/job-tracker";

type ViewMode = "board" | "list";
type ArchiveTab = "active" | "archived";

export default function JobTrackerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [archiveTab, setArchiveTab] = useState<ArchiveTab>("active");
  const [filters, setFilters] = useState<JobTrackerListFilters>({
    ...EMPTY_JOB_TRACKER_FILTERS,
  });
  const [board, setBoard] = useState<JobTrackerBoardResponse | null>(null);
  const [list, setList] = useState<JobTrackerListResponse | null>(null);
  const [listPage, setListPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const queryFilters = useMemo(
    () => ({
      ...filters,
      archived: archiveTab === "archived",
    }),
    [filters, archiveTab],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (viewMode === "board") {
        const data = await jobTrackerApi.board(queryFilters);
        setBoard(data);
      } else {
        const data = await jobTrackerApi.list({
          ...queryFilters,
          page: listPage,
          pageSize: 20,
        });
        setList(data);
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load job tracker",
      );
    } finally {
      setLoading(false);
    }
  }, [viewMode, queryFilters, listPage]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (archiveTab === "archived") setViewMode("list");
  }, [archiveTab]);

  const totalCount = useMemo(() => {
    if (viewMode === "list") return list?.total ?? 0;
    return board?.totals.active ?? 0;
  }, [viewMode, list, board]);

  const openApplication = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.replace(`/dashboard/job-tracker?${params.toString()}`, {
      scroll: false,
    });
  };

  const closeApplication = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    const qs = params.toString();
    router.replace(qs ? `/dashboard/job-tracker?${qs}` : "/dashboard/job-tracker", {
      scroll: false,
    });
  }, [router, searchParams]);

  const handleCreated = (detail: JobTrackerDetail) => {
    void loadData();
    openApplication(detail.applicationId);
  };

  const handleSheetOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) closeApplication();
    },
    [closeApplication],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Your Job Tracker"
        badge={`${totalCount} total jobs`}
        description="Track applications, resume match scores, and practice interviews in one place."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={viewMode === "board" ? "default" : "outline"}
                className={cn(
                  "h-11 flex-1 sm:flex-none",
                  viewMode === "board" ? appPrimaryButton : appOutlineButton,
                )}
                onClick={() => setViewMode("board")}
              >
                <Columns3 className="mr-2 h-4 w-4" />
                Board
              </Button>
              <Button
                type="button"
                variant={viewMode === "list" ? "default" : "outline"}
                className={cn(
                  "h-11 flex-1 sm:flex-none",
                  viewMode === "list" ? appPrimaryButton : appOutlineButton,
                )}
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="mr-2 h-4 w-4" />
                List
              </Button>
            </div>
            <Button
              type="button"
              className={cn("h-11 w-full sm:w-auto", appPrimaryButton)}
              onClick={() => setAddOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Job
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={archiveTab === "active" ? "default" : "outline"}
          className={archiveTab === "active" ? appPrimaryButton : undefined}
          onClick={() => setArchiveTab("active")}
        >
          Active
        </Button>
        <Button
          type="button"
          size="sm"
          variant={archiveTab === "archived" ? "default" : "outline"}
          className={archiveTab === "archived" ? appPrimaryButton : undefined}
          onClick={() => setArchiveTab("archived")}
        >
          Archived
        </Button>
      </div>

      <JobTrackerFilters
        applied={filters}
        onApply={(next) => {
          setFilters(next);
          setListPage(1);
        }}
      />

      {loading && !board && !list ? (
        <div className={cn(appCard, "flex items-center justify-center p-10")}>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === "board" && board ? (
        <JobTrackerBoard
          board={board}
          onBoardChange={setBoard}
          onOpen={openApplication}
        />
      ) : (
        <JobTrackerList
          data={list}
          loading={loading}
          onOpen={openApplication}
          onItemChange={(index, next) => {
            setList((prev) => {
              if (!prev) return prev;
              const items = [...prev.items];
              items[index] = next;
              return { ...prev, items };
            });
          }}
          onPageChange={setListPage}
        />
      )}

      <JobTrackerSheet
        applicationId={selectedId}
        open={Boolean(selectedId)}
        onOpenChange={handleSheetOpenChange}
        onUpdated={() => void loadData()}
        onDeleted={() => void loadData()}
      />

      <AddApplicationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
