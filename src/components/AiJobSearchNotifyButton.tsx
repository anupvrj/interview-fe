"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AiJobSearchNotifyButtonProps = {
  className?: string;
  buttonClassName?: string;
};

export function AiJobSearchNotifyButton({
  className,
  buttonClassName,
}: AiJobSearchNotifyButtonProps) {
  const { user, isLoaded } = useUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");

  const showSuccessToast = (targetEmail: string) => {
    toast.success("You're on the list", {
      description: `We'll email you at ${targetEmail} when AI job search is available.`,
    });
  };

  const handleClick = () => {
    if (!isLoaded) return;
    if (user) {
      const addr =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress;
      if (addr) {
        showSuccessToast(addr);
      } else {
        toast.success("You're on the list", {
          description:
            "We'll notify you when AI job search is available.",
        });
      }
      return;
    }
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEmail("");
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      toast.error("Invalid email", {
        description: "Please enter a valid email address.",
      });
      return;
    }
    showSuccessToast(trimmed);
    setDialogOpen(false);
    setEmail("");
  };

  return (
    <>
      <div className={className}>
        <Button
          type="button"
          size="lg"
          onClick={handleClick}
          disabled={!isLoaded}
          className={cn(
            "w-full sm:w-auto text-white font-medium shadow-sm transition-all h-12 px-6 hover:opacity-90 !bg-primary",
            buttonClassName,
          )}
        >
          Get Notified
          <Bell className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleGuestSubmit}>
            <DialogHeader>
              <DialogTitle>Get notified</DialogTitle>
              <DialogDescription>
                Enter your email and we will let you know when AI job search
                launches.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="notify-email">Email</Label>
              <Input
                id="notify-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="w-full sm:w-auto bg-primary hover:bg-slate-900"
              >
                Confirm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
