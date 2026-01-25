"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mic,
  TrendingUp,
  Award,
  Brain,
  Clock,
  Globe,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Star,
  Users,
  Zap,
  FileText,
  Video,
  MessageSquare,
  Check,
  Trophy,
  Menu,
  User,
} from "lucide-react";
import Image from "next/image";
import { PlansSection } from "@/components/PlansSection";
import { ScrollSection } from "@/components/ScrollSection";
import { NavigationMenu } from "@/components/NavigationMenu";

// Custom hook for counting animation
function useCountUp(end: number, duration: number = 2000, suffix: string = "", prefix: string = "") {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
            const startTime = Date.now();
            const startValue = 0;

            const animate = () => {
              const now = Date.now();
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              // Easing function for smooth animation
              const easeOutQuart = 1 - Math.pow(1 - progress, 4);
              const currentValue = Math.floor(startValue + (end - startValue) * easeOutQuart);
              
              setCount(currentValue);

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                setCount(end);
              }
            };

            requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.3 }
    );

    // Use setTimeout to ensure DOM is ready
    const timer = setTimeout(() => {
      const element = document.getElementById("stats-section");
      if (element) {
        observer.observe(element);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      const element = document.getElementById("stats-section");
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [end, duration, hasStarted]);

  const formattedCount = count.toLocaleString("en-IN");
  return prefix + formattedCount + suffix;
}

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  
  // Animated counts
  const studentsCount = useCountUp(5000, 2000, "+");
  const questionsCount = useCountUp(1000, 2000, "+");
  const successCount = useCountUp(85, 2000, "%");
  const priceCount = useCountUp(299, 2000, "", "₹");
  
  const resumeTemplates = [
    "/resume-template-images/atlantic-blue-template-design.webp",
    "/resume-template-images/Mercury-template-design.webp",
    "/resume-template-images/saffron-line-template-design.webp",
    "/resume-template-images/clean-slate-preview.webp",
  ];

  const firstLine = "Ace Your Next";
  const secondLine = "Interview with AI";
  const fullText = firstLine + " " + secondLine;
  const highlightStart = firstLine.length + 1; // "Interview" starts after first line
  const highlightEnd = highlightStart + 9; // "Interview" is 9 characters

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % resumeTemplates.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Cursor blink animation
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 80); // Typing speed
      return () => clearTimeout(timer);
    } else {
      // Reset after a delay to create continuous loop
      const resetTimer = setTimeout(() => {
        setDisplayedText("");
        setCurrentIndex(0);
      }, 2500);
      return () => clearTimeout(resetTimer);
    }
  }, [currentIndex]);

  return (
    <div className="min-h-screen bg-white scroll-smooth selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50">
        {/* Top Border - Mobile Only */}
        <div className="sm:hidden h-1" style={{ backgroundColor: 'rgb(37 99 235 / var(--tw-bg-opacity, 1))' }}></div>
        
        {/* Main Header */}
        <div className="bg-white/95 backdrop-blur-xl border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
              {/* Mobile Layout */}
              <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start sm:gap-4">
                {/* Hamburger Menu - Mobile Only */}
                <div className="sm:hidden">
                  <NavigationMenu />
                </div>

                {/* Logo - Centered on Mobile, Left on Desktop */}
                <Link
                  href="/"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity mx-auto sm:mx-0"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-xs sm:text-sm">i<span className="text-sm sm:text-base">X</span></span>
                    </div>
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                      Interview <span className="text-blue-600">Tri<span className="text-xl sm:text-2xl lg:text-3xl">X</span></span>
                    </span>
                  </div>
                </Link>

                {/* Right Side Icons - Mobile */}
                <div className="flex items-center gap-3 sm:hidden">
                  <SignedOut>
                    <Link href="/sign-in" className="p-1">
                      <User className="w-5 h-5 text-slate-900" />
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "w-6 h-6",
                        },
                      }}
                    />
                  </SignedIn>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:flex items-center gap-4 sm:gap-6">
                {/* Navigation Menu */}
                <NavigationMenu />
                <SignedOut>
                  <Link href="/sign-in">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm px-2 sm:px-4"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all text-xs sm:text-sm px-4 py-2"
                    >
                      Get Started
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard" className="hidden md:block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm px-2 sm:px-4"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10",
                      },
                    }}
                  />
                </SignedIn>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-8 sm:pb-12 md:pb-16 px-4 sm:px-6 overflow-hidden bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] min-h-[2.2em] sm:min-h-[2.4em]">
                {/* First Line */}
                <div className="block">
                  {displayedText.length > 0 && displayedText.length <= firstLine.length ? (
                    <>
                      {displayedText.split("").map((char, index) => (
                        <span
                          key={index}
                          className="inline-block text-slate-900"
                          style={{
                            animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                          }}
                        >
                          {char === " " ? "\u00A0" : char}
                        </span>
                      ))}
                      {displayedText.length <= firstLine.length && (
                        <span 
                          className={`inline-block w-0.5 h-[1em] bg-blue-600 ml-1 align-middle ${
                            showCursor ? 'opacity-100' : 'opacity-0'
                          }`}
                          style={{
                            transition: 'opacity 0.1s ease-in-out',
                            animation: 'fadeInUp 0.3s ease-out'
                          }}
                        />
                      )}
                    </>
                  ) : displayedText.length > firstLine.length ? (
                    <>
                      {firstLine.split("").map((char, index) => (
                        <span
                          key={index}
                          className="inline-block text-slate-900"
                        >
                          {char === " " ? "\u00A0" : char}
                        </span>
                      ))}
                    </>
                  ) : null}
                </div>
                
                {/* Second Line */}
                <div className="block">
                  {displayedText.length > firstLine.length + 1 && (
                    <>
                      {displayedText.slice(firstLine.length + 1).split("").map((char, index) => {
                        const actualIndex = firstLine.length + 1 + index;
                        const isHighlight = actualIndex >= highlightStart && actualIndex < highlightEnd;
                        
                        return (
                          <span
                            key={actualIndex}
                            className={`inline-block ${
                              isHighlight 
                                ? 'text-[rgb(37,99,235)]' 
                                : 'text-slate-900'
                            }`}
                            style={{
                              animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                            }}
                          >
                            {char === " " ? "\u00A0" : char}
                          </span>
                        );
                      })}
                      {displayedText.length === fullText.length && (
                        <span 
                          className={`inline-block w-0.5 h-[1em] bg-blue-600 ml-1 align-middle ${
                            showCursor ? 'opacity-100' : 'opacity-0'
                          }`}
                          style={{
                            transition: 'opacity 0.1s ease-in-out',
                            animation: 'fadeInUp 0.3s ease-out'
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
                Master technical and behavioral interviews with AI-powered mock interviews. 
                Get real-time feedback and practice with company-specific questions from TCS, Infosys, Wipro, Amazon, and 50+ top employers.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 px-2 sm:px-0">
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base px-5 sm:px-6 py-4 sm:py-5 h-auto shadow-lg hover:shadow-xl transition-all"
                  >
                    Get Started for Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600">4.9/5</span>
                </div>
              </div>
            </div>

            {/* Right Section - Interview Preview */}
            <div className="relative flex justify-center lg:justify-start order-1 lg:order-2">
              <div className="relative rounded-lg sm:rounded-xl shadow-2xl overflow-hidden bg-white w-full max-w-[600px] sm:max-w-[700px] border-2 sm:border-4 border-blue-100">
                <Image
                  src="/mock-interview-previewiew.png"
                  alt="Mock Interview Interface - AI-Powered Interview Platform"
                  width={700}
                  height={560}
                  className="w-full h-auto object-contain"
                  priority
                />
                {/* Overlay Badges */}
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-green-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-lg flex items-center gap-1 sm:gap-1.5 animate-bounce" style={{ animationDuration: '2s' }}>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white text-green-600 rounded-full flex items-center justify-center font-bold text-[9px] sm:text-[10px] animate-pulse">
                    AI
                  </div>
                  <div className="text-[9px] sm:text-[10px] leading-tight hidden xs:block">
                    <div className="font-semibold">Live</div>
                    <div className="text-green-100 text-[8px] sm:text-[9px]">Interview</div>
                  </div>
                </div>
                <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-blue-700 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-lg text-[9px] sm:text-[10px] font-semibold animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                  <span className="hidden sm:inline">Real-time Feedback</span>
                  <span className="sm:hidden">Feedback</span>
                </div>
                <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2">
                  <Button
                    size="sm"
                    className="bg-blue-700 hover:bg-blue-800 text-white shadow-lg h-6 sm:h-7 px-1.5 sm:px-2 text-[9px] sm:text-[10px] animate-bounce" 
                    style={{ animationDuration: '2.2s', animationDelay: '1s' }}
                  >
                    <Mic className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Start Answer</span>
                    <span className="sm:hidden">Start</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <ScrollSection
        id="why-us"
        className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50 scroll-mt-20"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-700 font-medium text-sm mb-4">
              <span>Why Choose Us</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Everything you need to{" "}
              <span className="text-blue-600">ace your interview</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Comprehensive interview preparation platform designed for Indian job market
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Mic className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Voice Mock Interviews
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Full-length AI interviews with contextual follow-ups and structured feedback
                </p>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Behavioral Analysis
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Advanced speech analysis measuring confidence, filler words, and response structure
                </p>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Progress Tracking
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Visual dashboards showing performance trends and score improvements over time
                </p>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Company-Specific Prep
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Curated question banks from actual interviews at TCS, Infosys, Wipro, and 50+ companies
                </p>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Multi-Language Support
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Practice in English, Hindi, or mixed language scenarios for real-world interviews
                </p>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Instant Feedback
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Detailed reports within 2-3 minutes with full transcripts, scores, and action items
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Resume Builder Section */}
      <ScrollSection
        id="build-resume"
        className="py-12 sm:py-16 px-4 sm:px-6 bg-white scroll-mt-20 border-t border-gray-100"
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Section - Marketing Content */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-700 font-medium text-sm">
                <span>ATS-Optimized Resume Builder</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 leading-tight">
                Create <span className="text-blue-600">Professional</span> Resumes in Minutes
              </h2>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Build ATS-optimized resumes that pass applicant tracking systems. 
                Our AI analyzes your resume in real-time, suggests improvements, and 
                helps you create professional resumes that get noticed by recruiters 
                at top companies.
              </p>

              {/* AI-Powered Features */}
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    25+ ATS-Optimized Templates
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    Smart ATS Scoring
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    Ready in 2 Minutes
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    AI Content Suggestions
                  </h3>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-4">
                <Link href="/dashboard/resumes/new" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-white font-medium shadow-sm transition-all h-12 px-6 hover:opacity-90 !bg-[rgb(37,99,235)]"
                  >
                    Try Builder Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/dashboard/resumes" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-gray-200 text-gray-700 font-medium h-12 px-6 hover:!bg-[rgb(17,24,39)] hover:!text-white transition-all"
                  >
                    Browse Templates
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Section - Resume Preview */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative rounded-lg shadow-2xl overflow-hidden bg-white w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[400px]">
                {/* Carousel Container */}
                <div className="relative w-full overflow-hidden aspect-[210/297]">
                  <div
                    className="flex h-full transition-transform duration-700 ease-in-out"
                    style={{
                      transform: `translateX(-${currentSlide * 100}%)`,
                    }}
                  >
                    {resumeTemplates.map((template, index) => (
                      <div
                        key={index}
                        className="min-w-full flex-shrink-0 h-full"
                      >
                        <Image
                          src={template}
                          alt={`Resume Template ${index + 1}`}
                          width={400}
                          height={500}
                          className="w-full h-full object-contain"
                          priority={index === 0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Slide Indicators */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                  {resumeTemplates.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        currentSlide === index
                          ? "w-6 bg-white"
                          : "w-1.5 bg-white/50"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* ATS Score Badge Overlay */}
                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-green-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-lg flex items-center gap-1 animate-bounce z-10" style={{ animationDuration: '2s', animationDelay: '0s' }}>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-white text-green-600 rounded-full flex items-center justify-center font-bold text-[8px] sm:text-[9px] lg:text-[10px] animate-pulse">
                    98
                  </div>
                  <div className="text-[8px] sm:text-[9px] lg:text-[10px] leading-tight hidden sm:block">
                    <div className="font-semibold">ATS Score</div>
                    <div className="text-green-100 text-[7px] sm:text-[8px] lg:text-[9px]">Excellent</div>
                  </div>
                </div>
                {/* Templates Badge */}
                <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-blue-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-lg text-[8px] sm:text-[9px] lg:text-[10px] font-semibold animate-pulse z-10" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                  <span className="hidden sm:inline">25+ Templates Available</span>
                  <span className="sm:hidden">25+ Templates</span>
                </div>
                {/* AI-Powered Button */}
                <div className="absolute bottom-8 right-1 sm:bottom-10 sm:right-2 animate-bounce z-10" style={{ animationDuration: '2.2s', animationDelay: '1s' }}>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-6 px-1.5 sm:h-7 sm:px-2 text-[8px] sm:text-[9px] lg:text-[10px] hover:scale-105 transition-transform"
                  >
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 animate-spin" style={{ animationDuration: '3s' }} />
                    <span className="hidden sm:inline">AI-Powered</span>
                    <span className="sm:hidden">AI</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Mock Interview Hero Section */}
      <ScrollSection
        id="start-interview"
        className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50 scroll-mt-20 border-t border-slate-100"
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Section - Marketing Content */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-700 font-medium text-sm">
                <span>AI-Powered Interview Practice</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 leading-tight">
                Ace Your Next <span className="text-blue-600">Interview</span> with AI Coach
              </h2>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Practice with AI interviewers that adapt to your skill level. Get instant 
                feedback on communication, confidence, and technical accuracy.
              </p>

              {/* AI-Powered Features */}
              <div className="space-y-6 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      AI-Powered Interviews
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Realistic conversations with adaptive difficulty that adjust based on your responses
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Instant Analysis
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Speech patterns, confidence metrics, and improvement areas identified in real-time
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      English + Hindi Support
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Practice in English, Hindi, or code-switch naturally in your preferred language
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-4">
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all h-12 px-6"
                  >
                    Start Free Interview
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-gray-200 text-gray-700 font-medium h-12 px-6 hover:!bg-[rgb(17,24,39)] hover:!text-white transition-all"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>5,000+ students trained</span>
                </div>
              </div>
            </div>

            {/* Right Side - Product UI Demo */}
            <div className="relative lg:pl-8 shake-vertical">
              <div className="relative">
                {/* Background Shape */}
                <div className="absolute inset-0 bg-blue-600 rounded-3xl transform rotate-3 opacity-10"></div>
                
                {/* Floating UI Card */}
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  {/* Mock Interview Interface */}
                  <div className="p-6">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center mic-animated">
                          <Mic className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-gray-900">AI Interview Session</div>
                          <div className="text-xs text-gray-500">Live • Technical Round</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-gray-600">Recording</span>
                      </div>
                    </div>

                    {/* Question Section */}
                    <div className="mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-700 font-medium mb-2">Question 3 of 10</p>
                        <p className="text-base text-gray-900">
                          "Explain the difference between REST and GraphQL APIs. When would you choose one over the other?"
                        </p>
                      </div>
                      
                      {/* Answer Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                          <span className="text-xs text-gray-600 font-medium">Your Response</span>
                        </div>
                        <p className="text-sm text-gray-700 italic">
                          "REST is a stateless architectural style that uses standard HTTP methods..."
                        </p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">8.5</div>
                        <div className="text-xs text-gray-500">Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">92%</div>
                        <div className="text-xs text-gray-500">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700">2:34</div>
                        <div className="text-xs text-gray-500">Time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Stats Section */}
      <section id="stats-section" className="py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 border-y border-slate-100">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            <div className="group relative p-3 sm:p-4 md:p-6 lg:p-8 bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:border-blue-300 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-xl sm:rounded-2xl lg:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 min-h-[2rem] sm:min-h-[2.5rem] md:min-h-[3rem] flex items-center justify-center" style={{ color: 'rgb(37 99 235 / var(--tw-text-opacity, 1))' }}>
                  {studentsCount}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide text-center">
                  Students Trained
                </div>
              </div>
            </div>
            <div className="group relative p-3 sm:p-4 md:p-6 lg:p-8 bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-xl sm:rounded-2xl lg:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent mb-1 sm:mb-2 min-h-[2rem] sm:min-h-[2.5rem] md:min-h-[3rem] flex items-center justify-center">
                  {questionsCount}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide text-center">
                  Interview Questions
                </div>
              </div>
            </div>
            <div className="group relative p-3 sm:p-4 md:p-6 lg:p-8 bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-xl sm:rounded-2xl lg:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent mb-1 sm:mb-2 min-h-[2rem] sm:min-h-[2.5rem] md:min-h-[3rem] flex items-center justify-center">
                  {successCount}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide text-center">
                  Success Rate
                </div>
              </div>
            </div>
            <div className="group relative p-3 sm:p-4 md:p-6 lg:p-8 bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:border-amber-300 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent rounded-xl sm:rounded-2xl lg:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent mb-1 sm:mb-2 min-h-[2rem] sm:min-h-[2.5rem] md:min-h-[3rem] flex items-center justify-center">
                  {priceCount}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide text-center">
                  Starting Price
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <PlansSection />

      {/* CTA Section with Footer */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-900">
        <div className="container mx-auto max-w-4xl">
          {/* CTA Content */}
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/10">
              <Sparkles className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Ready to Ace Your Interview?
            </h2>
            <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students from IITs, NITs, and tier-2/3 colleges 
              who have secured placements at top companies.
            </p>
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg hover:shadow-blue-500/25 transition-all h-14 px-8 text-base"
              >
                Start Your Free Interview
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Footer Content */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">i<span className="text-sm">X</span></span>
              </div>
              <span className="text-xl font-bold text-white">
                Interview <span className="text-blue-400">Tri<span className="text-2xl">X</span></span>
              </span>
            </div>
            <p className="text-sm text-gray-400">
              © 2026 Interview Trix. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
