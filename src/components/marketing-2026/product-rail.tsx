"use client";
import Image from "next/image";
import { useRef } from "react";
import { ArrowLeft, ArrowRight, Chrome, Code2, FileText, Mic, Network, ScanSearch, Share2, MessageSquare } from "lucide-react";
import { Index, Mono } from "./primitives";
import { MK26_ROUTES } from "./cta";

/** Zoom's homepage pattern: the product family as the hero's second beat. Each card shows real UI. */
const cards = [
  { icon: Mic, title: "AI Mock Interview", line: "A voice interviewer that pushes back.", media: { v: "interview" }, tint: "from-[#1d2a6b] to-[#0b1530]", href: MK26_ROUTES.interview },
  { icon: FileText, title: "Resume Builder", line: "ATS-ready. Rewrites in place.", media: { v: "rewrite" }, tint: "from-[#3a2a8a] to-[#120f33]", href: MK26_ROUTES.resume },
  { icon: ScanSearch, title: "ATS Checker", line: "34 checks. Free score, no sign-up.", media: { v: "agent" }, tint: "from-[#0e4b5a] to-[#06202a]", href: MK26_ROUTES.ats },
  { icon: Code2, title: "Coding Round", line: "Hidden tests. Then defend your logic.", media: { img: "/marketing-2026/shots/Interviewtrix-AI-Interview-History.png" }, tint: "from-[#123a2a] to-[#07160f]", href: MK26_ROUTES.coding },
  { icon: Network, title: "System Design", line: "It reads your diagram and asks what breaks.", media: { img: "/marketing-2026/shots/Interviewtrix-report.png" }, tint: "from-[#2b1b4d] to-[#100a1e]", href: MK26_ROUTES.systemDesign },
  { icon: Share2, title: "iX Score & Skills Graph", line: "One score. Strong, slipping, hidden.", media: { img: "/marketing-2026/shots/Interview-trix-Report.png" }, tint: "from-[#1b2f5c] to-[#0a1224]", href: MK26_ROUTES.ixReport },
  { icon: MessageSquare, title: "InterviewTrix for ChatGPT", line: "Build and score a resume in chat.", media: { v: "templates" }, tint: "from-[#0f3d34] to-[#071b17]", href: MK26_ROUTES.connectors },
  { icon: Chrome, title: "Chrome extension", line: "Match and tailor your resume to any job post.", media: { img: "/marketing-2026/shots/Interviewtrix-resume-editor.png" }, tint: "from-[#4a2a14] to-[#1d1008]", href: MK26_ROUTES.chrome },
];

export function ProductRail() {
  const rail = useRef<HTMLDivElement>(null);
  const go = (d: number) => rail.current?.scrollBy({ left: d * 340, behavior: "smooth" });
  return (
    <section className="relative overflow-clip border-y border-primary/10 bg-[linear-gradient(180deg,#F3F1FF_0%,#ECEBFF_100%)] py-20">
      <div className="bg-dots mask-fade pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto flex max-w-[1120px] items-end justify-between px-5">
        <div><Index n="03" label="The whole kit" /><h2 className="max-w-[18ch] text-[30px] font-extrabold leading-[1.08] tracking-[-0.045em] md:text-[64px]">Everything between “applied” and “offer”.</h2></div>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => go(-1)} aria-label="Previous" className="grid size-10 place-items-center rounded-full border border-border bg-card hover:border-primary"><ArrowLeft className="size-4" /></button>
          <button onClick={() => go(1)} aria-label="Next" className="grid size-10 place-items-center rounded-full border border-border bg-card hover:border-primary"><ArrowRight className="size-4" /></button>
        </div>
      </div>
      <div ref={rail} className="relative mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(20px,calc((100vw-1120px)/2))] pb-6 [scrollbar-width:none]">
        {cards.map(({ icon: I, title, line, media, tint, href }) => (
          <a key={title} href={href} className={`group relative flex h-[380px] w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] bg-gradient-to-b ${tint} p-5 text-white`}>
            <div className="flex items-center gap-2 text-[15px] font-semibold"><I className="size-4 text-sky-300" />{title}</div>
            <p className="mt-1 text-[13.5px] text-white/65">{line}</p>
            <div className="absolute inset-x-5 bottom-0 top-[96px] overflow-hidden rounded-t-xl border border-white/10 transition-transform duration-500 group-hover:-translate-y-1.5">
              {"v" in media ? (
                <video className="h-full w-full object-cover object-left-top" src={`/marketing-2026/video/${media.v}.mp4?v=5`} poster={`/marketing-2026/video/${media.v}.jpg?v=5`} muted loop playsInline preload="none"
                  onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()} />
              ) : (
                <Image src={media.img} alt="" fill sizes="300px" className="object-cover object-left-top" />
              )}
            </div>
            <Mono className="absolute right-4 top-5 text-[10px] text-white/40 opacity-0 transition-opacity group-hover:opacity-100">OPEN →</Mono>
          </a>
        ))}
      </div>
    </section>
  );
}
