"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { appSurfaceMuted } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import { hackathonAdminApi, toHackathonError, type AdminHackathonOverview } from "../api";
import { formatIst } from "../copy";
import { hackathonKeys } from "../hooks";
import { HackathonAdminField } from "./HackathonAdminField";
import {
  adminStatusValue,
  canPickDraft,
  isStatusOptionDisabled,
  STATUS_OPTIONS,
  type AdminStatusValue,
} from "./hackathonAdminStatus";
import { istInputToIso } from "./time";

type ConfirmKind =
  | "start"
  | "end"
  | "publish"
  | "unpublish"
  | "restore-upcoming"
  | "restore-live";

type StatusChangePlan = "confirm" | "blocked" | "noop";

export function HackathonStatusActions({
  hackathon,
  onUpdated,
}: Readonly<{
  hackathon: AdminHackathonOverview;
  onUpdated?: (data: AdminHackathonOverview) => void;
}>) {
  const queryClient = useQueryClient();
  const serverValue = adminStatusValue(hackathon);
  const [uiValue, setUiValue] = useState<AdminStatusValue>(serverValue);
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);
  const [askNewEnd, setAskNewEnd] = useState(false);
  const [reopenEndsAt, setReopenEndsAt] = useState("");

  useEffect(() => {
    setUiValue(serverValue);
  }, [serverValue]);

  const patchCache = (data: AdminHackathonOverview) => {
    queryClient.setQueryData<AdminHackathonOverview[]>(hackathonKeys.adminList, (prev) =>
      prev?.map((h) => (h.hackathonId === data.hackathonId ? data : h)),
    );
    queryClient.setQueryData(hackathonKeys.adminOne(data.hackathonId), data);
    onUpdated?.(data);
  };

  const closeConfirm = () => {
    setConfirm(null);
    setUiValue(serverValue);
  };

  const onError = (err: unknown) => {
    toast.error(toHackathonError(err).message);
    closeConfirm();
  };

  const start = useMutation({
    mutationFn: () => hackathonAdminApi.start(hackathon.hackathonId),
    onSuccess: (data) => {
      patchCache(data);
      toast.success("Hackathon is live");
      setConfirm(null);
    },
    onError,
  });
  const end = useMutation({
    mutationFn: () => hackathonAdminApi.end(hackathon.hackathonId),
    onSuccess: (data) => {
      patchCache(data);
      toast.success("Hackathon marked completed");
      setConfirm(null);
    },
    onError,
  });
  const restore = useMutation({
    mutationFn: (body: { target: "upcoming" | "live"; endsAt?: string }) =>
      hackathonAdminApi.restoreStatus(hackathon.hackathonId, body.target, body.endsAt),
    onSuccess: (data) => {
      patchCache(data);
      setConfirm(null);
      setAskNewEnd(false);
      setReopenEndsAt("");
      toast.success(data.phase === "upcoming" ? "Status set to not started" : "Status set to on-going");
    },
    onError,
  });
  const publish = useMutation({
    mutationFn: () => hackathonAdminApi.publish(hackathon.hackathonId),
    onSuccess: (data) => {
      patchCache(data);
      toast.success("Public page is live.");
      setConfirm(null);
    },
    onError,
  });
  const unpublish = useMutation({
    mutationFn: () => hackathonAdminApi.unpublish(hackathon.hackathonId),
    onSuccess: (data) => {
      patchCache(data);
      toast.success("Public page hidden — status is Draft.");
      setConfirm(null);
    },
    onError,
  });

  const planStatusChange = (target: AdminStatusValue): StatusChangePlan => {
    if (target === serverValue) return "noop";

    if (target === "draft") {
      if (!canPickDraft(hackathon)) {
        toast.error("Draft is only allowed while not started and nobody has registered.");
        return "blocked";
      }
      setConfirm("unpublish");
      return "confirm";
    }

    if (target === "upcoming") {
      setAskNewEnd(false);
      if (hackathon.visibility === "draft") {
        setConfirm("publish");
        return "confirm";
      }
      if (hackathon.phase === "ended" || hackathon.phase === "live") {
        setConfirm("restore-upcoming");
        return "confirm";
      }
      return "noop";
    }

    if (target === "ended") {
      setAskNewEnd(false);
      if (hackathon.visibility === "draft") {
        toast.error("Set status to Not started first to publish the public page.");
        return "blocked";
      }
      setConfirm("end");
      return "confirm";
    }

    if (hackathon.visibility === "draft") {
      toast.error("Set status to Not started first to publish the public page.");
      return "blocked";
    }
    if (hackathon.phase === "upcoming") {
      setAskNewEnd(false);
      setConfirm("start");
      return "confirm";
    }
    if (hackathon.phase === "ended") {
      if (hackathon.endsAt && Date.parse(hackathon.endsAt) > Date.now()) {
        setAskNewEnd(false);
        setConfirm("restore-live");
        return "confirm";
      }
      setAskNewEnd(true);
      toast.info("The end time has passed. Pick a new end time below, then choose On-going again.");
      return "blocked";
    }

    return "noop";
  };

  const selectOptions = STATUS_OPTIONS.map((item) => ({
    value: item.value,
    label: item.label,
    disabled: isStatusOptionDisabled(item.value, hackathon),
  }));

  return (
    <>
      <HackathonAdminField
        id={`status-${hackathon.hackathonId}`}
        label="Status"
        className="max-w-md"
        hint="Draft hides the landing page. Not started publishes it. On-going and Completed control submissions."
      >
        <AppSelect
          id={`status-${hackathon.hackathonId}`}
          value={uiValue}
          options={selectOptions}
          onChange={(next) => {
            const target = next as AdminStatusValue;
            if (target === serverValue) {
              setUiValue(serverValue);
              return;
            }
            setUiValue(target);
            const plan = planStatusChange(target);
            if (plan === "blocked" || plan === "noop") {
              setUiValue(serverValue);
            }
          }}
        />
      </HackathonAdminField>

      {hackathon.phase === "ended" && askNewEnd ? (
        <div className={cn(appSurfaceMuted, "max-w-md space-y-3 p-4")}>
          <p className="text-sm font-semibold text-foreground">New end time required</p>
          <p className="text-xs text-muted-foreground">Choose a future end so submissions can open again.</p>
          <HackathonAdminField id={`reopen-end-${hackathon.hackathonId}`} label="New end (IST)">
            <Input
              id={`reopen-end-${hackathon.hackathonId}`}
              type="datetime-local"
              className="h-11 w-full min-w-0"
              value={reopenEndsAt}
              onChange={(e) => setReopenEndsAt(e.target.value)}
            />
          </HackathonAdminField>
          <Button
            variant="outline"
            disabled={restore.isPending}
            onClick={() => {
              const iso = istInputToIso(reopenEndsAt);
              if (!iso) return toast.error("Enter a valid new end date and time");
              restore.mutate({ target: "live", endsAt: iso });
            }}
          >
            {restore.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1.5 h-4 w-4" />}
            Apply and mark on-going
          </Button>
        </div>
      ) : null}

      <ConfirmationDialog
        open={confirm === "start"}
        onOpenChange={(open) => !open && closeConfirm()}
        title="Start the hackathon now?"
        description={
          hackathon.endsAt
            ? `Participants can submit immediately until ${formatIst(hackathon.endsAt)}.`
            : "Participants can submit immediately until you mark it Completed."
        }
        confirmText="Start now"
        onConfirm={() => start.mutate()}
        isLoading={start.isPending}
      />
      <ConfirmationDialog
        open={confirm === "end"}
        onOpenChange={(open) => !open && closeConfirm()}
        title="Mark this hackathon as completed?"
        description="Submissions close immediately. In-flight interviews can still finish within the grace window."
        confirmText="Mark as completed"
        variant="destructive"
        onConfirm={() => end.mutate()}
        isLoading={end.isPending}
      />
      <ConfirmationDialog
        open={confirm === "restore-upcoming"}
        onOpenChange={(open) => !open && closeConfirm()}
        title="Mark as not started?"
        description="Submissions pause. Past start/end times may be cleared so the event does not jump straight back to live or completed."
        confirmText="Mark as not started"
        onConfirm={() => restore.mutate({ target: "upcoming" })}
        isLoading={restore.isPending}
      />
      <ConfirmationDialog
        open={confirm === "restore-live"}
        onOpenChange={(open) => !open && closeConfirm()}
        title="Mark as on-going?"
        description={
          hackathon.endsAt ? `Submissions open again until ${formatIst(hackathon.endsAt)}.` : "Submissions open again."
        }
        confirmText="Mark as on-going"
        onConfirm={() => restore.mutate({ target: "live" })}
        isLoading={restore.isPending}
      />
      <ConfirmationDialog
        open={confirm === "publish"}
        onOpenChange={(open) => !open && closeConfirm()}
        title="Set status to Not started?"
        description="Publishes the landing page. Registration still follows your start and end times."
        confirmText="Publish public page"
        onConfirm={() => publish.mutate()}
        isLoading={publish.isPending}
      />
      <ConfirmationDialog
        open={confirm === "unpublish"}
        onOpenChange={(open) => !open && closeConfirm()}
        title="Set status to Draft?"
        description="The public page goes offline until you choose Not started again."
        confirmText="Hide public page"
        variant="destructive"
        onConfirm={() => unpublish.mutate()}
        isLoading={unpublish.isPending}
      />
    </>
  );
}
