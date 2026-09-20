"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { returnToExtensionJobTab } from "@/lib/extension-resume-sync";
import { appOutlineButton, appPrimaryButton } from "@/lib/app-theme";

const AUTO_RETURN_MS = 1600;

export function ExtensionSyncedDialog({
  open,
  onOpenChange,
  variant = "synced",
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "synced" | "connected";
}>) {
  const [returning, setReturning] = useState(false);
  const stayRef = useRef(false);

  const goBack = async () => {
    setReturning(true);
    try {
      const result = await returnToExtensionJobTab(2500);
      if (result.ok) {
        onOpenChange(false);
      }
    } finally {
      setReturning(false);
    }
  };

  useEffect(() => {
    if (!open) {
      stayRef.current = false;
      setReturning(false);
      return;
    }
    const timer = window.setTimeout(() => {
      if (!stayRef.current) void goBack();
    }, AUTO_RETURN_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  const connected = variant === "connected";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) stayRef.current = true;
        onOpenChange(next);
      }}
    >
      <DialogContent className="w-[min(22rem,calc(100vw-2rem))] max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {connected ? "Connected to InterviewTrix" : "Extension synced"}
          </DialogTitle>
          <DialogDescription>
            {connected
              ? "You're signed in. We'll take you back to the tab you came from."
              : "This resume is loaded in Chrome. We'll take you back to the tab you came from."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className={`${appOutlineButton} w-full sm:w-auto`}
            onClick={() => {
              stayRef.current = true;
              onOpenChange(false);
            }}
          >
            Stay here
          </Button>
          <Button
            type="button"
            className={`${appPrimaryButton} w-full min-w-0 sm:w-auto`}
            disabled={returning}
            onClick={() => void goBack()}
          >
            <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
            Go back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
