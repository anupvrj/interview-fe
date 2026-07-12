"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { InterviewerOnboardingForm } from "@/components/peer/InterviewerOnboardingForm";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import type { PeerInterviewType } from "@/lib/api";

const STEPS = [
  {
    icon: Users,
    title: "What is a peer interviewer?",
    body: "You are a verified engineer who runs live mock interviews for candidates preparing for real hiring loops. Share your experience from top companies, give actionable feedback, and help others practice DSA, system design, HR rounds, and more.",
  },
  {
    icon: IndianRupee,
    title: "How you earn",
    body: "You set your own price per interview round (within platform caps). When a candidate books your slot and you accept, they pay through InterviewTrix. After the session is completed, your earnings are tracked in your interviewer dashboard and paid out through our ledger.",
  },
  {
    icon: CalendarClock,
    title: "Your schedule, your rules",
    body: "Create 30–60 minute availability slots when it suits you. Google Meet is created when a candidate pays. Choose which rounds you can take, and control visibility with Available, Away, or Offline.",
  },
  {
    icon: ShieldCheck,
    title: "Verification process",
    body: "We verify every interviewer to keep the marketplace trusted. You submit your work email and corporate ID. Our team reviews applications within 24–48 hours. Once approved, you can publish slots and start receiving bookings.",
  },
] as const;

export function InterviewerApplyIntro({
  types,
  initialName,
}: {
  types: PeerInterviewType[];
  initialName?: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Button
          variant="ghost"
          onClick={() => setShowForm(false)}
          className="-ml-2 w-fit text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to overview
        </Button>
        <PageHeader
          title="Apply as interviewer"
          badge="Application"
          description="Tell us about your experience. We will review and email you once approved."
          className="text-center sm:text-left"
        />
        <InterviewerOnboardingForm
          types={types}
          initialName={initialName}
          showHeader={false}
          onSubmitted={() => router.push("/dashboard/peer-interviews/interviewer")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Link href="/dashboard/peer-interviews">
        <Button variant="ghost" className="-ml-2 w-fit text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to peer interviews
        </Button>
      </Link>

      <PageHeader
        title="Become a peer interviewer"
        badge="Earn by mentoring"
        description="Turn your interview experience into paid mock sessions for candidates on InterviewTrix."
      />

      <div className={cn(appCard, "relative overflow-hidden p-0")}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-[#7367F0]/15 via-[#7367F0]/5 to-transparent" />
        <div className="relative space-y-6 px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                Help candidates practice. Get paid for your time.
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Peer interviewers are working professionals who conduct live mock interviews.
                Candidates book your open slots, you accept requests you want, run the session on
                video, and earn for each completed interview.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-4 py-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="text-sm leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">What happens after you apply?</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Submit your profile, work email, and corporate ID.</li>
                  <li>Our team verifies your details (typically 24–48 hours).</li>
                  <li>Once approved, create slots and appear in the peer interviewer directory.</li>
                  <li>Accept bookings, run interviews, and track earnings on your dashboard.</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Ready to start? The application takes about 5 minutes.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5] sm:shrink-0"
            >
              Apply to become an interviewer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
