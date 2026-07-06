"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import type { HiringStatus } from "@/lib/api";
import { HIRING_STATUS_LABELS, HIRING_STATUS_ORDER } from "@/lib/recruiter";
import { appPrimaryButton } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

const HIRING_STATUS_OPTIONS = HIRING_STATUS_ORDER.map((status) => ({
  value: status,
  label: HIRING_STATUS_LABELS[status],
}));

export function UpdateHiringStatusDialog({
  open,
  candidateName,
  current,
  saving,
  onClose,
  onSave,
}: Readonly<{
  open: boolean;
  candidateName: string;
  current: HiringStatus | null;
  saving: boolean;
  onClose: () => void;
  onSave: (status: HiringStatus) => void;
}>) {
  const [selected, setSelected] = useState<HiringStatus>(
    current ?? "shortlisted",
  );

  useEffect(() => {
    if (open) setSelected(current ?? "shortlisted");
  }, [open, current]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update hiring status</DialogTitle>
          <DialogDescription>
            Set the internal hiring status for {candidateName}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hiring-status-update">Hiring status</Label>
          <AppSelect
            id="hiring-status-update"
            value={selected}
            onChange={(value) => setSelected(value as HiringStatus)}
            options={HIRING_STATUS_OPTIONS}
            className="h-11 bg-card"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || selected === current}
            onClick={() => onSave(selected)}
            className={cn(appPrimaryButton)}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
