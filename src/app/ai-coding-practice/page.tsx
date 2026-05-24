"use client";

import {
  BarChart3,
  Code2,
  MessageSquare,
  Mic,
  PlayCircle,
  Terminal,
  CheckCircle2,
  Brain,
  Target,
} from "lucide-react";
import { PracticeProductLanding } from "@/components/marketing/PracticeProductLanding";
import { CodingRoundHeroPreview } from "@/components/coding-interviews/CodingRoundHeroPreview";

export default function AiCodingPracticePage() {
  return (
    <PracticeProductLanding
      badge="Practice Coding Round"
      headingFull="Practice Coding Round with AI"
      headingAccent="Coding Round with AI"
      topSubtitle="Solve real interview problems in the editor, run public and hidden tests, then defend your approach in an AI discussion—with a full report and scores."
      heroTitle="Code Like It's Already Offer Week"
      heroDescription="Structured problems, automated test feedback, and AI follow-ups on your exact solution—complexity, trade-offs, and edge cases—so you're ready when the interviewer asks why."
      heroCtaLabel="Start Free Coding Session"
      heroCtaSignedInHref="/dashboard/coding-interviews/new"
      heroCtaSignedOutHref="/sign-up"
      floatIcons={[Code2, Terminal, CheckCircle2]}
      preview={
        <div className="relative flex w-full justify-center">
          <CodingRoundHeroPreview />
          <div
            className="absolute right-2 top-2 animate-pulse rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white shadow-lg sm:text-xs"
            style={{ animationDuration: "2.5s" }}
          >
            Live tests
          </div>
        </div>
      }
      howItWorksSubtitle="Pick a problem → code → test → discuss → review your report"
      steps={[
        {
          icon: PlayCircle,
          title: "Choose a problem",
          description:
            "Select difficulty and language—start a practice session in one click",
        },
        {
          icon: Code2,
          title: "Code in the editor",
          description:
            "Write your solution with syntax highlighting and run public test cases",
        },
        {
          icon: Terminal,
          title: "Submit & get scored",
          description:
            "Hidden tests run on submit—see pass/fail and your coding score",
        },
        {
          icon: Mic,
          title: "AI discussion & report",
          description:
            "Explain your approach to AI, get discussion scores, and a full session report",
        },
      ]}
      actionTitle="See It In Action"
      actionDescription="From typing your first line to hidden tests passing—watch how a practice coding round flows."
      actionPreview={<CodingRoundHeroPreview />}
      featuresTitle="Everything you need for coding rounds"
      featuresSubtitle="Don't just grind LeetCode—practice the full loop: solve, test, explain, and improve."
      features={[
        {
          icon: Code2,
          title: "Structured problems",
          description:
            "Curated interview-style problems with clear constraints and examples",
        },
        {
          icon: Terminal,
          title: "Public + hidden tests",
          description:
            "Run samples while you code; hidden cases score your final submit",
        },
        {
          icon: Mic,
          title: "AI defense round",
          description:
            "Voice discussion on complexity, alternatives, and trade-offs in your code",
        },
        {
          icon: BarChart3,
          title: "Coding + discussion scores",
          description:
            "Separate scores for implementation and how well you explain your solution",
        },
        {
          icon: Brain,
          title: "Per-problem feedback",
          description:
            "Strengths, gaps, and suggested improvements for each problem you attempt",
        },
        {
          icon: Target,
          title: "Screening round combo",
          description:
            "Pair with AI Interview Practice for behavioral + coding in one prep flow",
          href: "/ai-interview-coach",
          footer: "Explore screening practice",
        },
      ]}
      ctaTitle="Ready to ace your next coding round?"
      ctaDescription="Build muscle memory for solving under pressure—and explaining your code like a senior engineer."
      ctaLabel="Start Your Free Session"
      ctaSignedInHref="/dashboard/coding-interviews/new"
      ctaSignedOutHref="/sign-up"
    />
  );
}
