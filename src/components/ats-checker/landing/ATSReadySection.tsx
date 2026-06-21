"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Briefcase,
  FilePenLine,
  FileText,
  ScanLine,
  Sparkles,
  Shield,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { appMarketingSectionPurple } from "@/lib/app-theme";

const FLOAT_ICONS = [FileText, ScanLine, FileCheck, Sparkles, Shield, Send, Briefcase, FilePenLine];

const FEATURES = [
  {
    icon: Send,
    title: "Optimize for the Right Keywords",
    tagline: "Match what ATS scans for.",
    description:
      "Scans for skills and qualifications ATS software is built to detect before a recruiter ever opens your file.",
    iconClass: "bg-primary",
  },
  {
    icon: Briefcase,
    title: "Data-Driven Suggestions",
    tagline: "Expert tips, not guesswork.",
    description:
      "Actionable fixes backed by how real hiring systems score resumes—so you reach hiring managers faster.",
    iconClass: "bg-gradient-to-br from-indigo-500 to-indigo-600",
  },
  {
    icon: FilePenLine,
    title: "Fix ATS-Blocking Format",
    tagline: "Clean layout. Full parse rate.",
    description:
      "Flags layout issues, broken links, and formatting traps so automated screening reads your resume cleanly.",
    iconClass: "bg-gradient-to-br from-emerald-500 to-emerald-600",
  },
] as const;

function FloatingBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(10)].map((_, i) => {
        const Icon = FLOAT_ICONS[i % FLOAT_ICONS.length];
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${(i * 11) % 92}%`,
              top: `${(i * 17) % 88}%`,
              opacity: 0.14,
              animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.45}s`,
            }}
          >
            <Icon className="h-10 w-10 text-white sm:h-14 sm:w-14" />
          </div>
        );
      })}
      {[...Array(6)].map((_, i) => {
        const Icon = FLOAT_ICONS[(i + 3) % FLOAT_ICONS.length];
        return (
          <div
            key={`b-${i}`}
            className="absolute"
            style={{
              left: `${(i * 18 + 3) % 88}%`,
              top: `${(i * 23 + 5) % 90}%`,
              opacity: 0.09,
              animation: `float-${i % 3} ${8 + (i % 2) * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.75}s`,
            }}
          >
            <Icon className="h-7 w-7 text-white sm:h-10 sm:w-10" />
          </div>
        );
      })}
    </div>
  );
}

export function ATSReadySection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={cn(
        appMarketingSectionPurple,
        "relative scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16 lg:py-20",
      )}
    >
      <FloatingBackdrop />

      <div className="container relative z-10 mx-auto max-w-6xl">
        <div
          className={cn(
            "mb-12 text-center transition-all duration-500",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-sm font-medium text-white/95">
            <ScanLine className="h-3 w-3" />
            <span>ATS Resume Checker</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white/95 sm:text-4xl lg:text-5xl">
            Is Your Resume Ready for ATS?
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/75">
            Applicant tracking systems screen for skills, experience, and keywords before a
            recruiter ever sees you. Our checker finds what blocks you—and you can fix it
            instantly with{" "}
            <Link href="/ai-resume-builder" className="font-medium text-white underline-offset-2 hover:underline">
              InterviewTrix&apos;s Resume Builder
            </Link>
            .
          </p>
        </div>

        <div
          className={cn(
            "grid gap-6 lg:grid-cols-3 transition-all duration-700 delay-100",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          {FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-header"
              >
                <div className="absolute inset-0 rounded-2xl bg-card/30 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div
                    className={cn(
                      "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-110",
                      item.iconClass,
                    )}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="mb-2 text-sm font-semibold text-gray-800">{item.tagline}</p>
                  <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
