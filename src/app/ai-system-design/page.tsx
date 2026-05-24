"use client";

import {
  BarChart3,
  Boxes,
  LayoutGrid,
  MessageCircle,
  Mic,
  Network,
  PlayCircle,
  Scale,
  Target,
  Workflow,
} from "lucide-react";
import { PracticeProductLanding } from "@/components/marketing/PracticeProductLanding";
import { SystemDesignHeroPreview } from "@/components/system-design/SystemDesignHeroPreview";

export default function AiSystemDesignPage() {
  return (
    <PracticeProductLanding
      badge="Practice System Design"
      headingFull="Practice System Design with AI"
      headingAccent="System Design with AI"
      topSubtitle="Sketch architecture on a whiteboard, narrate trade-offs with an AI interviewer, and get a rubric-based report on scope, scaling, and communication."
      heroTitle="Design Systems Like You're Already in the Loop"
      heroDescription="Pick a classic problem, draw on an infinite canvas, and talk through requirements, components, and scaling—AI listens, probes, and scores how you think out loud."
      heroCtaLabel="Start Free Design Session"
      heroCtaSignedInHref="/dashboard/system-design"
      heroCtaSignedOutHref="/sign-up"
      floatIcons={[LayoutGrid, Network, Boxes]}
      preview={
        <div className="relative flex w-full justify-center">
          <SystemDesignHeroPreview />
          <div
            className="absolute left-2 top-2 animate-pulse rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-white shadow-lg sm:text-xs"
            style={{ animationDuration: "2.5s" }}
          >
            Live whiteboard
          </div>
        </div>
      }
      howItWorksSubtitle="Pick a problem → sketch → discuss → evaluate → improve"
      steps={[
        {
          icon: PlayCircle,
          title: "Pick a problem",
          description:
            "URL shortener, chat, feed, or payment flow—start from a curated prompt",
        },
        {
          icon: LayoutGrid,
          title: "Whiteboard your design",
          description:
            "Draw components, data flows, and APIs on an Excalidraw canvas",
        },
        {
          icon: Mic,
          title: "Voice with AI interviewer",
          description:
            "Clarify requirements, justify trade-offs, and go deep on bottlenecks",
        },
        {
          icon: Scale,
          title: "Rubric report",
          description:
            "Scores for scope, architecture, scaling, and communication—with next steps",
        },
      ]}
      actionTitle="See It In Action"
      actionDescription="From blank canvas to architecture diagram—practice the full system design loop interviewers expect."
      actionPreview={<SystemDesignHeroPreview />}
      featuresTitle="Built for real system design interviews"
      featuresSubtitle="Go beyond memorizing diagrams—practice clarifying, sketching, and defending your design."
      features={[
        {
          icon: LayoutGrid,
          title: "Interactive whiteboard",
          description:
            "Excalidraw-powered canvas with shapes, arrows, and labels that save with your session",
        },
        {
          icon: MessageCircle,
          title: "AI voice interviewer",
          description:
            "Live prompts on capacity, failure modes, and consistency—like a senior panelist",
        },
        {
          icon: Network,
          title: "Architecture focus",
          description:
            "Practice component diagrams, data stores, queues, caches, and load balancers",
        },
        {
          icon: BarChart3,
          title: "Dimension scoring",
          description:
            "Weighted rubric: scope, architecture, scaling deep dive, and communication",
        },
        {
          icon: Workflow,
          title: "Session recording",
          description:
            "Replay your session to review pacing, clarity, and diagram evolution",
        },
        {
          icon: Target,
          title: "Coding round combo",
          description:
            "Round out tech prep with coding practice and AI screening sessions",
          href: "/ai-coding-practice",
          footer: "Explore coding practice",
        },
      ]}
      ctaTitle="Ready for your next system design loop?"
      ctaDescription="Walk into the room knowing you've already whiteboarded, narrated, and scored a full session."
      ctaLabel="Start Your Free Session"
      ctaSignedInHref="/dashboard/system-design"
      ctaSignedOutHref="/sign-up"
    />
  );
}
