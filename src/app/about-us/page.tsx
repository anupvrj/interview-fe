"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Mic,
  TrendingUp,
  Award,
  Clock,
  Globe,
  ArrowRight,
  Sparkles,
  Star,
  Users,
  Zap,
  FileText,
  MessageSquare,
  Quote,
  Target,
  Rocket,
  CheckCircle,
  Lightbulb,
  Search,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { ScrollSection } from "@/components/ScrollSection";
import { appMarketingSection, appMarketingSectionAlt } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  const [timelineProgress, setTimelineProgress] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [currentReviewSlide, setCurrentReviewSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate progress from 0 to 100% over 2 seconds
            let progress = 0;
            const interval = setInterval(() => {
              progress += 2;
              if (progress >= 100) {
                setTimelineProgress(100);
                clearInterval(interval);
              } else {
                setTimelineProgress(progress);
              }
            }, 40);
            return () => clearInterval(interval);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }

    return () => {
      if (timelineRef.current) {
        observer.unobserve(timelineRef.current);
      }
    };
  }, []);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const wasMobile = isMobile;
      const nowMobile = window.innerWidth < 640; // sm breakpoint
      setIsMobile(nowMobile);
      
      // Reset slide index when switching between mobile and desktop
      if (wasMobile !== nowMobile) {
        setCurrentReviewSlide(0);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  // Auto-slide carousel for reviews
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const getMaxSlides = () => {
      return window.innerWidth < 640 ? 9 : 3;
    };
    
    const maxSlides = getMaxSlides();
    
    // Reset slide index if it's out of bounds
    setCurrentReviewSlide((prev) => {
      if (prev >= maxSlides) {
        return 0;
      }
      return prev;
    });
    
    const interval = setInterval(() => {
      setCurrentReviewSlide((prev) => {
        const currentMax = getMaxSlides();
        return (prev + 1) % currentMax;
      });
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
      <SiteHeader />

      <section
        className={cn(
          appMarketingSection,
          "relative overflow-hidden px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:pt-32",
        )}
      >
        <div className="relative z-10 container mx-auto max-w-4xl">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-muted px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              <span>About Us</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your ally in an
              <span className="text-primary block">AI-filtered hiring world</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Recruiters lean on ATS and AI long before they read your story. Interview Trix is built to get you visible—ATS-ready resumes, AI Interview Practice and coding practice, peer sessions, and smart job matching—your end-to-end career partner so you don&apos;t just apply, you win.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <ScrollSection
        id="what-we-do"
        className={cn(
          appMarketingSectionAlt,
          "scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16",
        )}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              What We Do
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Resume, rehearsals, peers, and job search aligned to how hiring actually works now
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-border hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Mic className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                AI Interview Practice
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                AI Interview Practice in multiple languages, company-specific prep, coding rounds plus AI discussion on your solutions—and actionable scorecards afterward.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-border hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                AI Resume Builder
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                ATS-optimized templates, real-time suggestions, and a Smart ATS Score engineered to get you past the bots and onto a recruiter&apos;s desk.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-border hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Peers &amp; Smart Job Search
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Practice with real engineers when you want human reassurance—then discover roles, gauge fit, refine your resume per JD, and apply with confidence.
              </p>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Our Product Section */}
      <ScrollSection
        id="our-product"
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 bg-white scroll-mt-20"
      >
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-primary font-medium text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Our Products</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              Three Powerful Tools.
              <span className="block text-primary">One Complete Platform.</span>
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Match · Refine · Apply—backed by the practice loop that seals the interview
            </p>
          </div>

          {/* Product Cards */}
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {/* AI Interview Practice product */}
            <div 
              className="group relative bg-white rounded-3xl p-8 sm:p-10 border-2 border-gray-200 hover:border-border shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              style={{
                animation: 'fadeInUp 0.6s ease-out 0.1s both'
              }}
            >
              {/* Decorative Background Gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-muted to-indigo-100 rounded-full opacity-50 blur-3xl -z-0 group-hover:opacity-70 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                  <Mic className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                  AI Interview Practice
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6 text-base">
                  Shortlisted? Rehearse with AI Interview Practice in multiple languages, dial in company-specific style, and tackle coding challenges with follow-up questions on your exact solution.
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">AI Interview Practice + instant feedback</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Company-specific prep paths</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Coding rounds + AI discussion scores</span>
                  </li>
                </ul>

                {/* CTA Button */}
                <Link href="/dashboard/interviews/new">
                  <Button
                    size="lg"
                    className="w-full bg-primary hover:bg-slate-900 text-white font-medium shadow-lg hover:shadow-xl transition-all h-12"
                  >
                    Try AI Interview Practice
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Resume Builder Product */}
            <div 
              className="group relative bg-white rounded-3xl p-8 sm:p-10 border-2 border-gray-200 hover:border-indigo-300 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              style={{
                animation: 'fadeInUp 0.6s ease-out 0.2s both'
              }}
            >
              {/* Decorative Background Gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-50 blur-3xl -z-0 group-hover:opacity-70 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                  <FileText className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                  Resume Builder
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6 text-base">
                  Start where most hiring gates close first: ATS parsing. Fresher or pro—real-time tweaks, templates built for parsers, and a Smart ATS Score proving you cleared the bots.
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">ATS-optimized templates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Instant AI improvements</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Live preview + scoring</span>
                  </li>
                </ul>

                {/* CTA Button */}
                <Link href="/dashboard/resumes/new">
                  <Button
                    size="lg"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all h-12"
                  >
                    Build Resume
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* AI Job Search Product */}
            <div 
              className="group relative bg-white rounded-3xl p-8 sm:p-10 border-2 border-gray-200 hover:border-amber-300 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              style={{
                animation: 'fadeInUp 0.6s ease-out 0.3s both'
              }}
            >
              {/* Decorative Background Gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full opacity-50 blur-3xl -z-0 group-hover:opacity-70 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                  <Search className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                  AI Job Search
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6 text-base">
                  The finish line: explore matches with hiring context, see where you shine, tighten your resume to that JD, and apply knowing you staged the strongest version of your story (plus peers when you crave human critique).
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Match insights beyond a single feed</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Resume refinement per posting</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Optional peer interviews for live feedback</span>
                  </li>
                </ul>

                {/* CTA Button */}
                <Link href="/ai-job-search">
                  <Button
                    size="lg"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-lg hover:shadow-xl transition-all h-12"
                  >
                    Search Jobs
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* How Did We Start Section */}
      <ScrollSection
        id="how-we-started"
        className={cn(
          appMarketingSection,
          "scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:py-24",
        )}
      >
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-primary font-medium text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Our Story</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              How Did We Start?
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our journey began with a simple observation and a powerful mission to transform interview preparation
            </p>
          </div>

          {/* Story Cards - Enhanced Design */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div
              className="hover:shadow-header rounded-2xl border border-border bg-card p-8 shadow-lg transition-all duration-300 hover:-translate-y-1"
              style={{ animation: "fadeInUp 0.6s ease-out 0.1s both" }}
            >
              <div className="border-primary/15 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border bg-primary-muted text-primary shadow-sm">
                <Lightbulb className="h-8 w-8" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">The Problem</h3>
              <p className="leading-relaxed text-muted-foreground">
                Candidates were drowning in ATS black holes long before nerves ever showed up—AI tossed résumés aside, recruiters never saw the brilliance. Legacy prep skipped that reality entirely, priced out too many seekers, and still didn&apos;t mirror how companies hired.
              </p>
            </div>

            <div
              className="hover:shadow-header rounded-2xl border border-border bg-card p-8 shadow-lg transition-all duration-300 hover:-translate-y-1"
              style={{ animation: "fadeInUp 0.6s ease-out 0.2s both" }}
            >
              <div className="border-primary/15 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border bg-primary-muted text-primary shadow-sm">
                <Rocket className="h-8 w-8" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">Our Solution</h3>
              <p className="leading-relaxed text-muted-foreground">
                Interview Trix fights filters with your own AI ally—starting with ATS-smart resumes, layering AI Interview Practice and coding drills, pairing you with seasoned engineers when you need humans, then bringing search + JD-level tuning so applying isn&apos;t a spray-and-pray loop.
              </p>
            </div>

            <div
              className="hover:shadow-header rounded-2xl border border-border bg-card p-8 shadow-lg transition-all duration-300 hover:-translate-y-1"
              style={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}
            >
              <div className="border-primary/15 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border bg-primary-muted text-primary shadow-sm">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">Our Mission</h3>
              <p className="leading-relaxed text-muted-foreground">
                Today we stand beside scholars, seekers, and teams across India—determined that anyone can learn to surf AI-driven hiring rather than disappear inside it.
              </p>
            </div>
          </div>

          {/* Horizontal Timeline - Enhanced with Animation */}
          <div ref={timelineRef} className="relative">
            <div className="bg-gradient-to-br bg-card rounded-3xl p-8 sm:p-12 lg:p-16 border border-border relative overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-muted rounded-full opacity-10 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary-muted opacity-40 blur-3xl" />
              
              {/* Animated Background Icons */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => {
                  const positions = [
                    { left: '8%', top: '15%' },
                    { left: '35%', top: '10%' },
                    { left: '65%', top: '18%' },
                    { left: '88%', top: '12%' },
                    { left: '15%', top: '75%' },
                    { left: '72%', top: '80%' },
                  ];
                  return (
                    <div
                      key={`rocket-${i}`}
                      className="absolute opacity-15"
                      style={{
                        left: positions[i].left,
                        top: positions[i].top,
                        animation: `float-${i % 3} ${5 + (i % 3) * 2}s ease-in-out infinite`,
                        animationDelay: `${i * 0.3}s`,
                      }}
                    >
                      <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-primary/70" />
                    </div>
                  );
                })}
                {[...Array(6)].map((_, i) => {
                  const positions = [
                    { left: '12%', top: '25%' },
                    { left: '42%', top: '20%' },
                    { left: '68%', top: '28%' },
                    { left: '92%', top: '22%' },
                    { left: '20%', top: '70%' },
                    { left: '58%', top: '75%' },
                  ];
                  return (
                    <div
                      key={`award-${i}`}
                      className="absolute opacity-15"
                      style={{
                        left: positions[i].left,
                        top: positions[i].top,
                        animation: `float-${i % 3} ${6 + (i % 2) * 2}s ease-in-out infinite`,
                        animationDelay: `${i * 0.4}s`,
                      }}
                    >
                      <Award className="w-5 h-5 sm:w-7 sm:h-7 text-primary/70" />
                    </div>
                  );
                })}
                {[...Array(5)].map((_, i) => {
                  const positions = [
                    { left: '5%', top: '45%' },
                    { left: '38%', top: '40%' },
                    { left: '62%', top: '48%' },
                    { left: '85%', top: '42%' },
                    { left: '25%', top: '60%' },
                  ];
                  return (
                    <div
                      key={`trending-${i}`}
                      className="absolute opacity-15"
                      style={{
                        left: positions[i].left,
                        top: positions[i].top,
                        animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                        animationDelay: `${i * 0.5}s`,
                      }}
                    >
                      <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
                    </div>
                  );
                })}
                {[...Array(5)].map((_, i) => {
                  const positions = [
                    { left: '10%', top: '35%' },
                    { left: '45%', top: '30%' },
                    { left: '70%', top: '38%' },
                    { left: '95%', top: '32%' },
                    { left: '30%', top: '65%' },
                  ];
                  return (
                    <div
                      key={`sparkles-journey-${i}`}
                      className="absolute opacity-12"
                      style={{
                        left: positions[i].left,
                        top: positions[i].top,
                        animation: `float-${i % 3} ${5 + (i % 3) * 2}s ease-in-out infinite`,
                        animationDelay: `${i * 0.35}s`,
                      }}
                    >
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary/50" />
                    </div>
                  );
                })}
                {[...Array(4)].map((_, i) => {
                  const positions = [
                    { left: '18%', top: '50%' },
                    { left: '52%', top: '45%' },
                    { left: '78%', top: '52%' },
                    { left: '40%', top: '68%' },
                  ];
                  return (
                    <div
                      key={`lightbulb-${i}`}
                      className="absolute opacity-12"
                      style={{
                        left: positions[i].left,
                        top: positions[i].top,
                        animation: `float-${i % 3} ${6 + (i % 2) * 2}s ease-in-out infinite`,
                        animationDelay: `${i * 0.45}s`,
                      }}
                    >
                      <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-300" />
                    </div>
                  );
                })}
              </div>
              
              <div className="relative z-10">
                <div className="text-center mb-12">
                  <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Our Journey</h3>
                  <p className="text-lg text-gray-600">From idea to impact</p>
                </div>

                {/* Horizontal Timeline */}
                <div className="relative">
                  {/* Progress Line Background - Hidden on mobile, visible on desktop */}
                  <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1.5 bg-gray-200 rounded-full transform -translate-y-1/2"></div>
                  
                  {/* Animated Progress Line - Hidden on mobile, visible on desktop */}
                  <div 
                    className="hidden md:block absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-primary via-indigo-600 to-emerald-600 rounded-full transform -translate-y-1/2 transition-all duration-1000 ease-out shadow-lg"
                    style={{ width: `${timelineProgress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-emerald-600 rounded-full border-4 border-white shadow-lg"></div>
                  </div>

                  {/* Timeline Items - Stack on mobile, horizontal on desktop */}
                  <div className="relative flex flex-col md:flex-row justify-between items-start pt-8 pb-8 gap-8 md:gap-0">
                    {/* 2023 - The Beginning */}
                    <div 
                      className="flex flex-col items-center w-full md:max-w-[30%]"
                      style={{
                        animation: timelineProgress >= 33 ? 'fadeInUp 0.6s ease-out both' : 'none',
                        opacity: timelineProgress >= 33 ? 1 : 0.3
                      }}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-all duration-500 ${
                        timelineProgress >= 33 
                          ? 'bg-gradient-to-br from-primary to-primary md:scale-110 scale-100' 
                          : 'bg-gray-300 scale-100'
                      }`}>
                        <Lightbulb className="w-8 h-8 text-white" />
                      </div>
                      <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-md hover:shadow-lg transition-all w-full">
                        <p className="font-bold text-slate-900 mb-2 text-lg">2023</p>
                        <p className="font-semibold text-primary mb-2">The Beginning</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Identified the gap in interview preparation and started building the platform
                        </p>
                      </div>
                    </div>

                    {/* 2024 - Launch & Growth */}
                    <div 
                      className="flex flex-col items-center w-full md:max-w-[30%]"
                      style={{
                        animation: timelineProgress >= 66 ? 'fadeInUp 0.6s ease-out both' : 'none',
                        opacity: timelineProgress >= 66 ? 1 : 0.3
                      }}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-all duration-500 ${
                        timelineProgress >= 66 
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 md:scale-110 scale-100' 
                          : 'bg-gray-300 scale-100'
                      }`}>
                        <Rocket className="w-8 h-8 text-white" />
                      </div>
                      <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-md hover:shadow-lg transition-all w-full">
                        <p className="font-bold text-slate-900 mb-2 text-lg">2024</p>
                        <p className="font-semibold text-indigo-600 mb-2">Launch & Growth</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Launched Interview Trix and reached our first 1,000 users
                        </p>
                      </div>
                    </div>

                    {/* 2025 - Today */}
                    <div 
                      className="flex flex-col items-center w-full md:max-w-[30%]"
                      style={{
                        animation: timelineProgress >= 100 ? 'fadeInUp 0.6s ease-out both' : 'none',
                        opacity: timelineProgress >= 100 ? 1 : 0.3
                      }}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-all duration-500 ${
                        timelineProgress >= 100 
                          ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 md:scale-110 scale-100' 
                          : 'bg-gray-300 scale-100'
                      }`}>
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-md hover:shadow-lg transition-all w-full">
                        <p className="font-bold text-slate-900 mb-2 text-lg">2025</p>
                        <p className="font-semibold text-emerald-600 mb-2">Today</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Helping thousands of candidates prepare for their dream jobs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Reviews Section - Reused from Homepage */}
      <ScrollSection
        id="reviews"
        className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-muted/30 relative overflow-hidden"
      >
        {/* Animated Background Icons */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute opacity-20"
              style={{
                left: `${(i * 7) % 100}%`,
                top: `${(i * 11) % 100}%`,
                animation: `float-${i % 3} ${5 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            >
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary/70" />
            </div>
          ))}
          {[...Array(10)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute opacity-15"
              style={{
                left: `${(i * 13) % 100}%`,
                top: `${(i * 17) % 100}%`,
                animation: `float-${i % 3} ${6 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            >
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-primary/50 fill-primary/50" />
            </div>
          ))}
        </div>
        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4">
              Transform careers—together
            </h2>
            <p className="text-lg sm:text-xl text-primary mb-4 sm:mb-6">
              Learners rely on Interview Trix as their end-to-end hiring partner—and share the wins publicly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-base sm:text-lg text-primary font-medium text-center sm:text-left">
                4.9/5 based on our user reviews
              </span>
            </div>
          </div>

          {/* Reviews Carousel */}
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{
                  transform: `translateX(-${currentReviewSlide * 100}%)`,
                }}
              >
                {/* Mobile: Individual slides (1 review per slide) */}
                {/* Desktop: Grouped slides (3 reviews per slide) */}
                
                {/* Slide 1: Review 1 */}
                <div className="min-w-full flex gap-4 sm:gap-6">
                  {/* Review 1 */}
                  <div className="min-w-full sm:min-w-[33.333%]">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          BB
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Blake Beus</p>
                          <p className="text-xs sm:text-sm text-primary">App Security at JPMorgan Chase</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        I can't believe that I used to prepare for interviews without Interview Trix. My interviewers are VERY impressed with my communication skills and confidence levels.
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Review 2 */}
                  <div className="hidden sm:block min-w-[33.333%]">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          PS
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Priya Sharma</p>
                          <p className="text-xs sm:text-sm text-primary">Online Business Manager</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        Interview Trix is one of those 'where have you been my whole life' tools. They combined everything I needed for interview preparation into one cohesive platform. Such a genius product!
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Review 3 */}
                  <div className="hidden sm:block min-w-[33.333%]">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          DB
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Dave Baxter</p>
                          <p className="text-xs sm:text-sm text-primary">Estate Agent at DBRealty</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        Interview Trix saves me a ton of time and allows me to practice on my schedule. The detailed feedback and performance insights help me improve continuously. You cannot afford to NOT use Interview Trix.
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 2: Review 2 (Mobile only) */}
                <div className="min-w-full flex gap-4 sm:gap-6 sm:hidden">
                  {/* Review 2 */}
                  <div className="min-w-full">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          PS
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Priya Sharma</p>
                          <p className="text-xs sm:text-sm text-primary">Online Business Manager</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        Interview Trix is one of those 'where have you been my whole life' tools. They combined everything I needed for interview preparation into one cohesive platform. Such a genius product!
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 3: Review 3 (Mobile only) */}
                <div className="min-w-full flex gap-4 sm:gap-6 sm:hidden">
                  {/* Review 3 */}
                  <div className="min-w-full">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          DB
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Dave Baxter</p>
                          <p className="text-xs sm:text-sm text-primary">Estate Agent at DBRealty</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        Interview Trix saves me a ton of time and allows me to practice on my schedule. The detailed feedback and performance insights help me improve continuously. You cannot afford to NOT use Interview Trix.
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 2 (Desktop) / Slide 4 (Mobile): Reviews 4-6 (Desktop) / Review 4 (Mobile) */}
                <div className="min-w-full flex gap-4 sm:gap-6">
                  {/* Review 4 */}
                  <div className="min-w-full sm:min-w-[33.333%]">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          RK
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Rajesh Kumar</p>
                          <p className="text-xs sm:text-sm text-primary">Software Engineer at TCS</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        Interview Trix is one of the first apps our team insisted on installing on our new laptops. We use it every day to prepare for interviews and improve our communication skills.
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Review 5 */}
                  <div className="hidden sm:block min-w-[33.333%]">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          AS
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Anjali Singh</p>
                          <p className="text-xs sm:text-sm text-primary">Product Manager at Infosys</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        AI Interview Practice feels incredibly realistic. I practiced for my Infosys interview and felt so much more confident. The behavioral analysis helped me identify areas I didn't even know needed improvement.
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Review 6 */}
                  <div className="hidden sm:block min-w-[33.333%]">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          VP
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Vikram Patel</p>
                          <p className="text-xs sm:text-sm text-primary">Data Scientist at Wipro</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        The company-specific question banks are a game-changer. I practiced with Wipro-specific questions and felt completely prepared. Got the offer! Highly recommend to anyone preparing for tech interviews.
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 5 (Mobile) / Slide 3 (Desktop): Review 5 (Mobile) / Reviews 7-9 (Desktop) */}
                <div className="min-w-full flex gap-4 sm:gap-6 sm:hidden">
                  {/* Review 5 (Mobile only) */}
                  <div className="min-w-full">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          AS
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Anjali Singh</p>
                          <p className="text-xs sm:text-sm text-primary">Product Manager at Infosys</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        AI Interview Practice feels incredibly realistic. I practiced for my Infosys interview and felt so much more confident. The behavioral analysis helped me identify areas I didn't even know needed improvement.
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 6 (Mobile) */}
                <div className="min-w-full flex gap-4 sm:gap-6 sm:hidden">
                  {/* Review 6 (Mobile only) */}
                  <div className="min-w-full">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          VP
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Vikram Patel</p>
                          <p className="text-xs sm:text-sm text-primary">Data Scientist at Wipro</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        The company-specific question banks are a game-changer. I practiced with Wipro-specific questions and felt completely prepared. Got the offer! Highly recommend to anyone preparing for tech interviews.
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 3 (Desktop) / Slide 7 (Mobile): Reviews 7-9 (Desktop) / Review 7 (Mobile) */}
                <div className="min-w-full flex gap-4 sm:gap-6">
                  {/* Review 7 */}
                  <div className="min-w-full sm:min-w-[33.333%]">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          SM
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Sneha Mehta</p>
                          <p className="text-xs sm:text-sm text-primary">Frontend Developer at Razorpay</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        The resume builder is fantastic! Created an ATS-optimized resume that got me multiple interview calls. The templates are professional and the AI feedback helped me highlight my strengths better.
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Review 8 (Desktop only) */}
                  <div className="hidden sm:block min-w-[33.333%]">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          AK
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Arjun Khanna</p>
                          <p className="text-xs sm:text-sm text-primary">Backend Engineer at Flipkart</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        The multi-language support is amazing! I practiced in Hindi and English, which helped me prepare for real interviews in India. The platform understands the Indian job market perfectly.
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Review 9 (Desktop only) */}
                  <div className="hidden sm:block min-w-[33.333%]">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          NS
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Neha Shah</p>
                          <p className="text-xs sm:text-sm text-primary">QA Engineer at Deloitte</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        The progress tracking feature is excellent. I can see my improvement over time with clear metrics. The detailed reports after each interview session are incredibly helpful for self-assessment.
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 8 (Mobile) */}
                <div className="min-w-full flex gap-4 sm:gap-6 sm:hidden">
                  {/* Review 8 (Mobile only) */}
                  <div className="min-w-full">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          AK
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Arjun Khanna</p>
                          <p className="text-xs sm:text-sm text-primary">Backend Engineer at Flipkart</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        The multi-language support is amazing! I practiced in Hindi and English, which helped me prepare for real interviews in India. The platform understands the Indian job market perfectly.
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 9 (Mobile) */}
                <div className="min-w-full flex gap-4 sm:gap-6 sm:hidden">
                  {/* Review 9 (Mobile only) */}
                  <div className="min-w-full">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all h-full">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          NS
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Neha Shah</p>
                          <p className="text-xs sm:text-sm text-primary">QA Engineer at Deloitte</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        The progress tracking feature is excellent. I can see my improvement over time with clear metrics. The detailed reports after each interview session are incredibly helpful for self-assessment.
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-8">
              {[...Array(isMobile ? 9 : 3)].map((_, index) => {
                const isActive = currentReviewSlide === index;
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentReviewSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? "w-8 bg-primary"
                        : "w-2 bg-gray-300"
                    }`}
                    aria-label={`Go to review slide ${index + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </ScrollSection>

      <MarketingFooter />
    </div>
  );
}

