"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resumeSaveButton } from "@/components/resume-editor/resumeEditorStyles";

type ResumeEditorTitleProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
};

export function ResumeEditorTitle({
  value,
  onChange,
  placeholder = "Resume Title",
  compact = false,
}: ResumeEditorTitleProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, value]);

  const handleDone = () => {
    const trimmed = draft.trim();
    onChange(trimmed || placeholder);
    setOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "flex min-w-0 items-center gap-1",
          compact ? "w-full" : "max-w-xs",
        )}
      >
        <span
          className={cn(
            "min-w-0 truncate font-semibold text-foreground",
            compact ? "text-base leading-tight" : "text-lg",
          )}
        >
          {value.trim() || placeholder}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-primary"
          aria-label="Edit resume name"
          title="Edit name"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setDraft(value);
          }
        }}
      >
        <DialogContent className="max-w-sm gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border/60 px-4 py-4 text-left sm:px-5">
            <DialogTitle>Edit name</DialogTitle>
            <DialogDescription>
              Update the title for this resume.
            </DialogDescription>
          </DialogHeader>

          <div className="px-4 py-4 sm:px-5">
            <Input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleDone();
                }
              }}
              placeholder={placeholder}
              aria-label="Resume name"
              className="h-11"
            />
          </div>

          <DialogFooter className="border-t border-border/60 px-4 py-3 sm:px-5">
            <Button
              type="button"
              className={cn(resumeSaveButton, "w-full sm:w-auto")}
              onClick={handleDone}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
