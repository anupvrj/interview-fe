"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HackathonAdminField } from "./HackathonAdminField";

export function RequestResubmissionDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: (note: string) => void | Promise<void>;
  isLoading?: boolean;
}>) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) setNote("");
  }, [open]);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm(note.trim());
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const pending = isLoading || busy;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? "The participant can submit again and gets an email about it. Prior scores stay in admin history."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <HackathonAdminField id="hk-resubmit-note" label="Message to participant" hint="Optional. Shown on their dashboard and in the email.">
          <Textarea
            id="hk-resubmit-note"
            rows={3}
            className="w-full min-w-0"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Please share public post links again."
          />
        </HackathonAdminField>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button onClick={() => void handleConfirm()} disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Request resubmission
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
