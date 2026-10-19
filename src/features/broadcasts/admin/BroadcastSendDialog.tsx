"use client";

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { HackathonIstDateTimeField } from "@/features/hackathon/admin/HackathonIstDateTimeField";
import { istInputToIso } from "@/features/hackathon/admin/time";
import { cn } from "@/lib/utils";

/**
 * Last step before anything goes out: shows who gets it and makes the admin type the
 * number of recipients, so a send can't happen by a stray click.
 */
export function BroadcastSendDialog({
  open,
  onOpenChange,
  count,
  audience,
  subject,
  sending,
  onConfirm,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  audience: string;
  subject: string;
  sending: boolean;
  onConfirm: (scheduledAtIso: string | null) => void;
}>) {
  const [mode, setMode] = useState<"now" | "later">("now");
  const [when, setWhen] = useState("");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) {
      setTyped("");
      setMode("now");
      setWhen("");
    }
  }, [open]);

  const scheduledIso = mode === "later" ? istInputToIso(when) : null;
  const futureOk = mode === "now" || (scheduledIso !== null && Date.parse(scheduledIso) > Date.now());
  const confirmed = typed.trim() === String(count);

  return (
    <Dialog open={open} onOpenChange={(next) => !sending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send to {count.toLocaleString("en-IN")} people?</DialogTitle>
          <DialogDescription>
            {audience}. Each person gets their own email with an unsubscribe link. This can’t be undone once it starts,
            but you can stop it part-way.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <p className="text-xs text-muted-foreground">Subject</p>
            <p className="font-medium text-foreground">{subject}</p>
          </div>

          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="When to send">
            {(["now", "later"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  mode === value ? "border-[#7367F0] bg-[#7367F0]/10 text-foreground" : "border-border text-muted-foreground hover:border-[#7367F0]/50",
                )}
              >
                {value === "now" ? "Send now" : "Schedule"}
              </button>
            ))}
          </div>

          {mode === "later" ? (
            <HackathonIstDateTimeField
              id="bc-schedule"
              label="Send at (IST)"
              hint="The audience is counted again at that time; the cooldown and unsubscribes still apply."
              value={when}
              onChange={setWhen}
              previewVerb="Sends"
            />
          ) : null}

          <div className="grid gap-1.5">
            <label htmlFor="bc-confirm" className="text-sm font-medium text-foreground">
              Type <span className="font-mono">{count}</span> to confirm
            </label>
            <Input id="bc-confirm" inputMode="numeric" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={String(count)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(scheduledIso)} disabled={!confirmed || !futureOk || sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {mode === "now" ? `Send to ${count}` : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
