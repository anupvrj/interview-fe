"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Sparkles,
  ArrowRight,
  Target,
  Brain,
  MessageSquare,
  BarChart3,
  PlayCircle,
  Star,
  Bot,
  UserCircle,
  Building2,
  Languages,
  FileText,
  Check,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import {
  appMarketingSection,
  appMarketingSectionAlt,
} from "@/lib/app-theme";
import { cn } from "@/lib/utils";

const trustedCompanies = [
  { name: "Razorpay", file: "razorpay.png" },
  { name: "Amazon", file: "amazon.png" },
  { name: "TCS", file: "tcs.png" },
  { name: "Accenture", file: "accenture.png" },
  { name: "Deloitte", file: "deloitte.png" },
  { name: "Bosch Group", file: "bosch-group.png" },
  { name: "Mercedes-Benz", file: "mercedes-benz.png" },
  { name: "Fortinet", file: "fortinet.png" },
  { name: "News Corp", file: "news-corp.png" },
  { name: "Walmart", file: "walmart.png" },
  { name: "PayPal", file: "paypal.png" },
  { name: "BCE Global Tech", file: "bce-global-tech.png" },
];

type Feature = {
  title: string;
  tagline: string;
  body: string;
  icon: LucideIcon;
  gradient: string;
};

const features: Feature[] = [
  {
    title: "Conversational Voice AI",
    tagline: "Talk, don't type.",
    body: "Answer out loud in a real-time voice conversation that feels like sitting across from a live recruiter.",
    icon: Mic,
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    title: "Company-Specific Questions",
    tagline: "Target your exact employer.",
    body: "Name your target company and role, and the AI shapes questions around how that team actually interviews.",
    icon: Building2,
    gradient: "from-cyan-500 to-sky-600",
  },
  {
    title: "Role & Experience Tailored",
    tagline: "Calibrated to your level.",
    body: "Set your role, discipline, and years of experience so every question fits you—from fresher to senior.",
    icon: Target,
    gradient: "from-violet-500 to-violet-700",
  },
  {
    title: "English & Hindi",
    tagline: "Practice in your language.",
    body: "Run fluent, natural mock interviews in English or Hindi with human-like voice interaction.",
    icon: Languages,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    title: "Resume-Aware Follow-ups",
    tagline: "Built around your story.",
    body: "Use your saved resume or upload a PDF—the AI digs into your real projects and pushes for specifics.",
    icon: FileText,
    gradient: "from-slate-700 to-slate-900",
  },
  {
    title: "Detailed Reports & Scores",
    tagline: "Know exactly what to fix.",
    body: "Get a full transcript plus Technical, Behavioral, Communication, and Confidence scores with clear next steps.",
    icon: BarChart3,
    gradient: "from-amber-500 to-orange-600",
  },
];

const howItWorksSteps: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Set Up Your Session",
    body: "Pick your role, target company, language, and duration in seconds.",
    icon: PlayCircle,
  },
  {
    title: "Talk to the AI Interviewer",
    body: "Answer behavioral and technical questions out loud in a live voice session.",
    icon: Mic,
  },
  {
    title: "Get Instant Feedback",
    body: "The AI analyzes your delivery and scores each answer as you speak.",
    icon: Brain,
  },
  {
    title: "Review Your Report",
    body: "Read your transcript, category scores, and exactly what to improve next.",
    icon: BarChart3,
  },
];

export default function InterviewCoachPage() {
  // How It Works scroll-reveal state
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  // "See It In Action" animation state
  const [currentQuestion, setCurrentQuestion] = useState("Tell me about yourself");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const interviewRef = useRef<HTMLDivElement>(null);
  const animationContainerRef = useRef<HTMLDivElement>(null);

  // How It Works Section Animation
  useEffect(() => {
    const node = howItWorksRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHowItWorksVisible(true);
          }
        });
      },
      { threshold: 0.2 },
    );

    if (node) {
      observer.observe(node);
    }

    return () => {
      if (node) {
        observer.unobserve(node);
      }
    };
  }, []);

  // Interview Animation Loop
  useEffect(() => {
    const questions = [
      "Tell me about yourself",
      "What are your strengths?",
      "Why do you want this role?",
      "Where do you see yourself in 5 years?",
    ];

    const steps = [
      { type: "question", delay: 0, loadingDelay: 0 },
      { type: "recording", delay: 2000, loadingDelay: 300 },
      { type: "feedback", delay: 2500, loadingDelay: 400 },
      { type: "score", delay: 2000, loadingDelay: 200 },
    ];

    let stepIndex = 0;
    let questionIndex = 0;
    const timeouts: NodeJS.Timeout[] = [];

    const runStep = () => {
      const step = steps[stepIndex];

      if (step.type === "question") {
        setIsQuestionLoading(true);
        setShowFeedback(false);
        setShowScore(false);
        setCurrentStep(0);
      } else if (step.type === "recording") {
        setIsLoading(true);
      } else if (step.type === "feedback") {
        setIsLoading(true);
        setShowFeedback(false);
      } else if (step.type === "score") {
        setIsLoading(true);
        setShowScore(false);
      }

      const loadingTimeout = setTimeout(() => {
        if (step.type === "question") {
          setCurrentQuestion(questions[questionIndex]);
          setIsQuestionLoading(false);
          setTimeout(() => {
            animationContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          }, 100);
        } else if (step.type === "recording") {
          setCurrentStep(1);
          setIsLoading(false);
          setTimeout(() => {
            const isSmall = window.innerWidth >= 640;
            animationContainerRef.current?.scrollTo({
              top: isSmall ? 75 : 70,
              behavior: "smooth",
            });
          }, 100);
        } else if (step.type === "feedback") {
          setShowFeedback(true);
          setCurrentStep(2);
          setIsLoading(false);
          setTimeout(() => {
            const isSmall = window.innerWidth >= 640;
            animationContainerRef.current?.scrollTo({
              top: isSmall ? 165 : 155,
              behavior: "smooth",
            });
          }, 100);
        } else if (step.type === "score") {
          setShowScore(true);
          setCurrentStep(3);
          setIsLoading(false);
          setTimeout(() => {
            const isSmall = window.innerWidth >= 640;
            animationContainerRef.current?.scrollTo({
              top: isSmall ? 240 : 225,
              behavior: "smooth",
            });
          }, 100);
        }
      }, step.loadingDelay);

      timeouts.push(loadingTimeout);

      const stepTimeout = setTimeout(() => {
        stepIndex = (stepIndex + 1) % steps.length;
        if (stepIndex === 0) {
          questionIndex = (questionIndex + 1) % questions.length;
        }
        runStep();
      }, step.delay);

      timeouts.push(stepTimeout);
    };

    runStep();

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        @keyframes shimmer-content {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .skeleton {
          background: linear-gradient(
            90deg,
            #f0f0f0 0%,
            #f8f8f8 50%,
            #f0f0f0 100%
          );
          background-size: 2000px 100%;
          animation: shimmer 2s infinite;
        }
        .shimmer-effect {
          position: relative;
          overflow: hidden;
        }
        .shimmer-effect::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 100%
          );
          animation: shimmer-content 2.5s infinite;
          pointer-events: none;
        }
        .skeleton-text {
          height: 1em;
          border-radius: 4px;
        }
        .skeleton-text-short {
          width: 60%;
        }
        .skeleton-text-medium {
          width: 80%;
        }
        .skeleton-text-long {
          width: 100%;
        }
        .fade-in {
          animation: fadeIn 0.4s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
        <SiteHeader />

        {/* Hero Section */}
        <section
          className={cn(
            appMarketingSection,
            "relative overflow-hidden px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24 md:pt-28 lg:pb-20 lg:pt-32",
          )}
        >
          {/* Floating background icons */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={`hero-float-${i}`}
                className="absolute"
                style={{
                  left: `${(i * 13 + 4) % 92}%`,
                  top: `${(i * 19 + 6) % 88}%`,
                  opacity: 0.08,
                  animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                {i % 3 === 0 ? (
                  <Mic className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
                ) : i % 3 === 1 ? (
                  <Brain className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
                ) : (
                  <MessageSquare className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
                )}
              </div>
            ))}
          </div>

          <div className="container relative z-10 mx-auto max-w-7xl">
            <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left - Marketing Content */}
              <div className="order-2 space-y-4 text-center sm:space-y-5 md:space-y-6 lg:order-1 lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Voice Interview Practice</span>
                </div>

                <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                  Practice Real Interviews with Your{" "}
                  <span className="text-primary">AI Interview Coach</span>
                </h1>

                <p className="mx-auto max-w-xl px-2 text-base leading-relaxed text-gray-600 sm:px-0 sm:text-lg lg:text-xl">
                  Get 100% ready before the real one. Run realistic, voice-based
                  mock interviews with company-specific questions, instant AI
                  feedback, and a detailed scorecard—so nothing surprises you on
                  interview day.
                </p>

                <div className="flex flex-col items-center justify-center gap-3 px-2 pt-2 sm:flex-row sm:gap-4 sm:px-0 lg:justify-start">
                  <Link href="/dashboard/interviews/new" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="h-auto w-full bg-primary px-5 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-900 hover:shadow-xl sm:w-auto sm:px-6 sm:py-5 sm:text-base"
                    >
                      Start Free Interview
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 sm:h-4 sm:w-4"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-gray-600 sm:text-sm">
                      4.9/5
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm font-medium text-gray-500 lg:justify-start">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>English &amp; Hindi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Instant AI feedback</span>
                  </div>
                </div>
              </div>

              {/* Right - Interview Preview */}
              <div className="relative order-1 flex justify-center lg:order-2 lg:justify-end">
                <div className="relative w-full max-w-[600px] overflow-hidden rounded-lg border-2 border-border bg-white shadow-2xl sm:max-w-[700px] sm:rounded-xl sm:border-4">
                  <Image
                    src="/mock-interview-previewiew.png"
                    alt="AI voice interview practice interface with real-time feedback"
                    width={700}
                    height={560}
                    className="h-auto w-full object-contain"
                    priority
                  />
                  <div
                    className="absolute right-1.5 top-1.5 flex animate-bounce items-center gap-1 rounded-md bg-green-500 px-1.5 py-0.5 text-white shadow-lg sm:right-2 sm:top-2 sm:gap-1.5 sm:px-2 sm:py-1"
                    style={{ animationDuration: "2s" }}
                  >
                    <div className="flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-white text-[9px] font-bold text-green-600 sm:h-6 sm:w-6 sm:text-[10px]">
                      AI
                    </div>
                    <div className="hidden text-[9px] leading-tight xs:block sm:text-[10px]">
                      <div className="font-semibold">Live</div>
                      <div className="text-[8px] text-green-100 sm:text-[9px]">
                        Interview
                      </div>
                    </div>
                  </div>
                  <div
                    className="absolute left-1.5 top-1.5 animate-pulse rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-lg sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-[10px]"
                    style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}
                  >
                    <span className="hidden sm:inline">Real-time Feedback</span>
                    <span className="sm:hidden">Feedback</span>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2">
                    <Button
                      size="sm"
                      className="h-6 animate-bounce bg-primary px-1.5 text-[9px] text-white shadow-lg hover:bg-slate-900 sm:h-7 sm:px-2 sm:text-[10px]"
                      style={{ animationDuration: "2.2s", animationDelay: "1s" }}
                    >
                      <Mic className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">Start Answer</span>
                      <span className="sm:hidden">Start</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted Companies — continuously running, faded logos that colorize on hover */}
        <section className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-white to-slate-50/80 py-10 sm:py-14">
          <div
            className="overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            }}
          >
            <div className="flex w-max animate-trusted-logos-marquee items-center">
              {[...trustedCompanies, ...trustedCompanies].map((company, index) => (
                <div
                  key={`${company.file}-${index}`}
                  className="flex w-[42vw] shrink-0 items-center justify-center px-5 sm:w-[24vw] sm:px-6 md:w-[18vw] lg:w-[14vw]"
                >
                  <Image
                    src={`/company-logos/${company.file}`}
                    alt={`${company.name} logo`}
                    width={180}
                    height={56}
                    className="h-8 w-auto max-w-[130px] object-contain opacity-50 grayscale transition-all duration-300 hover:scale-105 hover:opacity-100 hover:grayscale-0 sm:h-10 sm:max-w-[150px]"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          ref={howItWorksRef}
          className={cn(appMarketingSectionAlt, "px-4 py-16 sm:px-6 sm:py-20 lg:py-24")}
        >
          <div className="container mx-auto max-w-7xl">
            <div
              className={`mb-12 text-center transition-all duration-700 sm:mb-16 ${
                howItWorksVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
                <span>How It Works</span>
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Go from nervous to{" "}
                <span className="text-primary">interview-ready</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
                Set up, speak, get scored, and iterate—four simple steps to a
                sharper performance.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
              {howItWorksSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className={`group relative flex flex-col rounded-xl border border-border/80 bg-card p-6 text-left shadow-card transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl ${
                      howItWorksVisible
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0"
                    }`}
                    style={{
                      transitionDelay: howItWorksVisible
                        ? `${0.1 + index * 0.1}s`
                        : "0s",
                    }}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-md transition-transform group-hover:scale-105">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <span className="text-4xl font-bold text-primary/15">
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      {step.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* See It In Action — Animated Interview Preview */}
        <section
          ref={interviewRef}
          className={cn(
            appMarketingSection,
            "relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
          )}
        >
          {/* Floating background icons */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={`action-float-${i}`}
                className="absolute"
                style={{
                  left: `${(i * 16 + 4) % 92}%`,
                  top: `${(i * 21 + 6) % 88}%`,
                  opacity: 0.07,
                  animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                {i % 3 === 0 ? (
                  <Brain className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
                ) : i % 3 === 1 ? (
                  <Mic className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
                ) : (
                  <Bot className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
                )}
              </div>
            ))}
          </div>

          <div className="container relative z-10 mx-auto max-w-7xl">
            <div className="mb-10 text-center sm:mb-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
                <span>See It In Action</span>
              </div>
              <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                From first question to{" "}
                <span className="text-primary">scorecard</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
                Watch a live mock unfold—question, spoken answer, instant feedback,
                and a score—the way shortlists are really decided.
              </p>
            </div>

            {/* Animation Card Container */}
            <div className="w-full">
              <div className="relative w-full overflow-hidden rounded-lg border border-border bg-white shadow-2xl sm:rounded-xl sm:border-2 md:border-4">
                <div className="grid md:grid-cols-2">
                  {/* Left Side - Image */}
                  <div className="relative flex w-full items-center justify-center bg-white p-4 sm:p-5 md:p-6">
                    <div className="relative flex w-full items-center justify-center overflow-hidden rounded-lg">
                      <Image
                        src="/image-candidate-ai-interview.jpg"
                        alt="Candidate practicing a live AI voice interview"
                        width={700}
                        height={444}
                        className="h-auto w-full rounded-lg object-contain"
                        priority
                        unoptimized
                        style={{ objectPosition: "center" }}
                      />
                    </div>
                    <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md bg-green-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg sm:text-sm">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
                      Live Interview
                    </div>
                  </div>

                  {/* Right Side - Animation */}
                  <div className="flex items-center bg-white p-3 sm:p-4 md:p-5">
                    <div
                      ref={animationContainerRef}
                      className="relative min-h-[350px] w-full overflow-y-auto scroll-smooth sm:min-h-[400px] md:min-h-[395px]"
                      style={{ scrollBehavior: "smooth" }}
                    >
                      {/* Question Section */}
                      <div className="absolute left-0 right-0 top-0 transition-all duration-500 ease-in-out">
                        <div className="fade-in shimmer-effect rounded-xl border border-border bg-card p-2 pt-3 shadow-lg shadow-primary/10 backdrop-blur-sm">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 ring-2 ring-border/50 sm:h-12 sm:w-12">
                              <Bot className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                            </div>
                            <div className="flex-1">
                              <div className="mb-1.5 text-xs font-bold text-primary sm:text-sm">
                                AI Interviewer
                              </div>
                              {isQuestionLoading ? (
                                <div className="space-y-2">
                                  <div className="skeleton skeleton-text skeleton-text-medium"></div>
                                  <div className="skeleton skeleton-text skeleton-text-short"></div>
                                </div>
                              ) : (
                                <div className="fade-in text-xs font-medium leading-relaxed text-gray-800 sm:text-sm">
                                  {currentQuestion || "Tell me about yourself"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Answer Section */}
                      <div
                        className={`absolute left-0 right-0 top-[70px] transition-all duration-500 ease-in-out sm:top-[75px] ${
                          currentStep >= 1
                            ? "translate-y-0 opacity-100"
                            : "pointer-events-none translate-y-4 opacity-0"
                        }`}
                      >
                        <div className="fade-in shimmer-effect rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-white p-2 pt-3 shadow-lg shadow-slate-500/10 backdrop-blur-sm">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg shadow-slate-500/30 ring-2 ring-slate-200/50 sm:h-12 sm:w-12">
                              <UserCircle className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                            </div>
                            <div className="flex-1">
                              <div className="mb-1.5 text-xs font-bold text-slate-700 sm:text-sm">
                                You
                              </div>
                              {isLoading && currentStep < 1 ? (
                                <div className="space-y-2">
                                  <div className="skeleton skeleton-text skeleton-text-long"></div>
                                  <div className="skeleton skeleton-text skeleton-text-medium"></div>
                                </div>
                              ) : currentStep === 1 ? (
                                <div className="fade-in flex items-center gap-2 text-xs font-medium italic text-slate-600 sm:text-sm">
                                  Speaking...{" "}
                                  <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-primary"></span>
                                </div>
                              ) : currentStep >= 2 ? (
                                <div className="fade-in text-xs font-medium leading-relaxed text-slate-800 sm:text-sm">
                                  I am a software engineer with 5+ years of
                                  experience in building scalable web
                                  applications...
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Feedback Section */}
                      <div
                        className={`absolute left-0 right-0 top-[155px] transition-all duration-500 ease-in-out sm:top-[165px] ${
                          showFeedback
                            ? "translate-y-0 opacity-100"
                            : "pointer-events-none translate-y-4 opacity-0"
                        }`}
                      >
                        <div className="fade-in shimmer-effect rounded-xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-green-50/50 p-2 pt-3 shadow-lg shadow-emerald-500/10 backdrop-blur-sm">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-200/50 sm:h-12 sm:w-12">
                              <Brain className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                            </div>
                            <div className="flex-1">
                              <div className="mb-1.5 text-xs font-bold text-emerald-700 sm:text-sm">
                                AI Feedback
                              </div>
                              {isLoading && !showFeedback ? (
                                <div className="space-y-2">
                                  <div className="skeleton skeleton-text skeleton-text-medium"></div>
                                  <div className="skeleton skeleton-text skeleton-text-short"></div>
                                </div>
                              ) : (
                                <div className="fade-in text-xs font-medium leading-relaxed text-emerald-900 sm:text-sm">
                                  Good structure. Consider adding specific
                                  examples of your achievements.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Score Section */}
                      <div
                        className={`absolute left-0 right-0 top-[225px] transition-all duration-500 ease-in-out sm:top-[240px] ${
                          showScore
                            ? "translate-y-0 opacity-100"
                            : "pointer-events-none translate-y-4 opacity-0"
                        }`}
                      >
                        <div className="fade-in shimmer-effect rounded-xl border border-border bg-card p-2 pt-3 shadow-card">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="mb-1.5 text-xs font-bold text-primary sm:text-sm">
                                Overall Score
                              </div>
                              {isLoading && !showScore ? (
                                <div className="space-y-2">
                                  <div className="skeleton skeleton-text skeleton-text-short w-12"></div>
                                </div>
                              ) : (
                                <div className="fade-in text-2xl font-bold text-primary sm:text-3xl">
                                  85%
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {isLoading && !showScore ? (
                                <>
                                  <div className="skeleton skeleton-text skeleton-text-short w-16"></div>
                                  <div className="skeleton skeleton-text skeleton-text-short w-12"></div>
                                </>
                              ) : (
                                <>
                                  <div className="fade-in text-xs font-medium text-slate-600 sm:text-sm">
                                    Confidence: 88%
                                  </div>
                                  <div className="fade-in text-xs font-medium text-slate-600 sm:text-sm">
                                    Clarity: 82%
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className={cn(
            "relative overflow-hidden border-y border-[#7367F0]/20 bg-gradient-to-br from-[#7367F0]/[0.16] via-[#7367F0]/[0.06] to-[#7367F0]/[0.22]",
            "px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
          )}
        >
          {/* Floating background icons */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <div
                key={`feat-float-${i}`}
                className="absolute"
                style={{
                  left: `${(i * 11) % 92}%`,
                  top: `${(i * 17) % 88}%`,
                  opacity: 0.12,
                  animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.45}s`,
                }}
              >
                {i % 3 === 0 ? (
                  <Mic className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
                ) : i % 3 === 1 ? (
                  <Target className="h-9 w-9 text-primary sm:h-12 sm:w-12" />
                ) : (
                  <BarChart3 className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
                )}
              </div>
            ))}
          </div>

          <div className="container relative z-10 mx-auto max-w-7xl">
            <div className="mb-12 text-center sm:mb-16">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
                <span>Why It Works</span>
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Don&apos;t just practice. <span className="text-primary">Perform.</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
                Skip generic Q&amp;A and simulate the exact interview you&apos;ll
                face—right down to the company, role, and language.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group relative flex h-full min-h-[230px] flex-col rounded-xl border border-border/80 bg-card p-6 text-left shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl"
                  >
                    <div className="absolute inset-0 rounded-xl bg-muted/40 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex h-full flex-col">
                      <div className="mb-4 flex items-start gap-4">
                        <div
                          className={cn(
                            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md transition-transform group-hover:scale-105",
                            feature.gradient,
                          )}
                        >
                          <Icon className="h-7 w-7 text-white" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xl font-bold text-slate-900">
                            {feature.title}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-gray-800">
                            {feature.tagline}
                          </p>
                        </div>
                      </div>
                      <p className="flex-1 text-sm leading-relaxed text-gray-600">
                        {feature.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className={cn(appMarketingSectionAlt, "px-4 py-16 sm:px-6 sm:py-20 lg:py-24")}
        >
          <div className="container relative z-10 mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:mb-6 sm:text-4xl lg:text-5xl">
              Don&apos;t just apply.{" "}
              <span className="text-primary">Rehearse to win.</span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600 sm:mb-10 sm:text-xl">
              Transform how you sound and show up—with a voice-based AI mock
              interview and a report that tells you exactly what to improve before
              offer week.
            </p>
            <Link href="/dashboard/interviews/new">
              <Button
                size="lg"
                className="h-auto bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-slate-900 hover:shadow-xl sm:py-5 sm:text-lg"
              >
                Start Your Free Interview
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-4 text-sm font-medium text-gray-500">
              No credit card required · English &amp; Hindi · Instant feedback
            </p>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </>
  );
}
