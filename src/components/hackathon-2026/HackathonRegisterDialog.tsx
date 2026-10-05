"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHackathonRegister } from "@/components/hackathon-2026/HackathonRegisterContext";
import {
  HACKATHON_PROFESSIONS,
  type HackathonProfession,
} from "@/lib/hackathon-2026-content";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function HackathonRegisterDialog() {
  const { open, setOpen } = useHackathonRegister();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profession, setProfession] = useState<HackathonProfession | "">("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setProfession("");
    setError(null);
    setSubmitting(false);
    setSubmitted(false);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedName.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!profession) {
      setError("Select your profession.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/hackathon-2026/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, profession }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error || "Registration failed. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogContent
        overlayClassName="bg-[#040b17]/80 backdrop-blur-sm"
        className="max-h-[calc(100vh-2rem)] w-[calc(100vw-1.5rem)] max-w-md overflow-y-auto border-[#1d4268] bg-[#0a1930] text-[#f6f9ff] sm:rounded-2xl [&>button]:text-white [&>button]:opacity-80"
      >
        {submitted ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto size-12 text-[#29d6a0]" aria-hidden />
            <DialogHeader className="mt-4 space-y-2 text-center sm:text-center">
              <DialogTitle className="text-xl text-white">You’re registered</DialogTitle>
              <DialogDescription className="text-[#9eb2ca]">
                Invite email will follow with joining details for the live launch.
              </DialogDescription>
            </DialogHeader>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Register for Hackathon 2026</DialogTitle>
              <DialogDescription className="text-[#9eb2ca]">
                Free registration. We’ll send your live-event invite to this email.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="mt-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hackathon-name" className="text-[#dbe9f8]">
                  Name
                </Label>
                <Input
                  id="hackathon-name"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full !border-[#1d4268] !bg-[#071426] !text-white placeholder:!text-[#7189a6] focus-visible:!border-[#2a7fd4]"
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackathon-email" className="text-[#dbe9f8]">
                  Email
                </Label>
                <Input
                  id="hackathon-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full !border-[#1d4268] !bg-[#071426] !text-white placeholder:!text-[#7189a6] focus-visible:!border-[#2a7fd4]"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackathon-profession" className="text-[#dbe9f8]">
                  Profession
                </Label>
                <Select
                  value={profession}
                  onValueChange={(value) => setProfession(value as HackathonProfession)}
                >
                  <SelectTrigger
                    id="hackathon-profession"
                    className="h-11 w-full !border-[#1d4268] !bg-[#071426] !text-white"
                  >
                    <SelectValue placeholder="Select one" />
                  </SelectTrigger>
                  <SelectContent className="border-[#1d4268] bg-[#0a1930] text-white">
                    {HACKATHON_PROFESSIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error ? <p className="text-sm text-[#ff4e8b]">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="hk-btn h-12 w-full text-sm disabled:pointer-events-none disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Submitting
                  </>
                ) : (
                  "Register — It’s Free"
                )}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
