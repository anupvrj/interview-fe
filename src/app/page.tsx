"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  Quote,
  Search,
  Briefcase,
  Code,
} from "lucide-react";
import Image from "next/image";
import { PlansSection } from "@/components/PlansSection";
import { ScrollSection } from "@/components/ScrollSection";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { AiJobSearchNotifyButton } from "@/components/AiJobSearchNotifyButton";
import { appMarketingSection, appMarketingSectionAlt, appMarketingSectionPurple, appMarketingSectionLight } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

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
  
  // Job Search Animation States
  const [jobSearchText, setJobSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showJobResults, setShowJobResults] = useState(false);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const jobResultsRef = useRef<HTMLDivElement>(null);
  
  // Animated counts
  const usersCount = useCountUp(50000, 2000, "+");
  const resumesCount = useCountUp(120000, 2000, "+");
  const interviewsCount = useCountUp(25000, 2000, "+");
  
  const resumeTemplates = [
    "/resume-template-images/atlantic-blue-template-design.webp",
    "/resume-template-images/Mercury-template-design.webp",
    "/resume-template-images/saffron-line-template-design.webp",
    "/resume-template-images/clean-slate-preview.webp",
  ];

  const firstLine = "Beat the ATS Black Hole";
  const secondLine = "With Your AI Career Ally";
  const fullText = firstLine + " " + secondLine;
  const highlightStart = 9; // "ATS" in first line (after "Beat the ")
  const highlightEnd = highlightStart + 3;
  // Highlight "Ally" at end of second line (local index 20 in secondLine)
  const allyLocalStart = 20;
  const happensStart = firstLine.length + 1 + allyLocalStart;
  const happensEnd = happensStart + 4;

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

  // Typewriter effect - runs once, then stops
  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 80); // Typing speed
      return () => clearTimeout(timer);
    }
    // Animation complete - don't reset, just keep the text displayed
  }, [currentIndex, fullText]);

  // Job Search Animation
  const jobRoles = ["Software Engineer", "Product Manager", "Data Scientist", "Full Stack Developer"];
  
  // Job results mapped to each role
  const jobResultsByRole: Record<string, Array<{ company: string; role: string; score: number; location: string; salary: string }>> = {
    "Software Engineer": [
      { company: "Amazon", role: "Software Engineer", score: 98, location: "Bangalore", salary: "₹25-35L" },
      { company: "TCS", role: "Software Engineer", score: 95, location: "Mumbai", salary: "₹12-18L" },
      { company: "Infosys", role: "Software Engineer", score: 92, location: "Hyderabad", salary: "₹10-16L" },
      { company: "Flipkart", role: "Software Engineer", score: 90, location: "Bangalore", salary: "₹20-30L" },
    ],
    "Product Manager": [
      { company: "Amazon", role: "Product Manager", score: 97, location: "Bangalore", salary: "₹30-40L" },
      { company: "Flipkart", role: "Product Manager", score: 94, location: "Bangalore", salary: "₹25-35L" },
      { company: "Razorpay", role: "Product Manager", score: 91, location: "Bangalore", salary: "₹22-32L" },
      { company: "Deloitte", role: "Product Manager", score: 89, location: "Mumbai", salary: "₹20-30L" },
    ],
    "Data Scientist": [
      { company: "Amazon", role: "Data Scientist", score: 96, location: "Bangalore", salary: "₹28-38L" },
      { company: "TCS", role: "Data Scientist", score: 93, location: "Hyderabad", salary: "₹15-22L" },
      { company: "Infosys", role: "Data Scientist", score: 90, location: "Bangalore", salary: "₹18-25L" },
      { company: "Flipkart", role: "Data Scientist", score: 88, location: "Bangalore", salary: "₹25-35L" },
    ],
    "Full Stack Developer": [
      { company: "Amazon", role: "Full Stack Developer", score: 95, location: "Bangalore", salary: "₹24-34L" },
      { company: "Razorpay", role: "Full Stack Developer", score: 92, location: "Bangalore", salary: "₹20-30L" },
      { company: "TCS", role: "Full Stack Developer", score: 89, location: "Mumbai", salary: "₹12-18L" },
      { company: "Infosys", role: "Full Stack Developer", score: 87, location: "Hyderabad", salary: "₹10-16L" },
    ],
  };
  
  // Get current job results based on the role being searched
  const currentJobResults = jobResultsByRole[jobRoles[currentJobIndex % jobRoles.length]] || jobResultsByRole["Software Engineer"];

  useEffect(() => {
    let timeout1: NodeJS.Timeout;
    let timeout2: NodeJS.Timeout;
    let timeout3: NodeJS.Timeout;
    let typeInterval: NodeJS.Timeout;
    let scrollInterval: NodeJS.Timeout;

    // Reset
    setJobSearchText("");
    setIsSearching(false);
    setShowJobResults(false);
    setScrollPosition(0);

    // Start typing after 1 second
    timeout1 = setTimeout(() => {
      const currentRole = jobRoles[currentJobIndex % jobRoles.length];
      const currentResults = jobResultsByRole[currentRole] || jobResultsByRole["Software Engineer"];
      let typingIndex = 0;
      
      typeInterval = setInterval(() => {
        if (typingIndex < currentRole.length) {
          setJobSearchText(currentRole.slice(0, typingIndex + 1));
          typingIndex++;
        } else {
          clearInterval(typeInterval);
          // Show searching state
          setIsSearching(true);
          
          // Show results after 2 seconds
          timeout2 = setTimeout(() => {
            setIsSearching(false);
            setShowJobResults(true);
            setScrollPosition(0); // Reset scroll position
            
            // Auto-scroll through results
            let scrollIndex = 0;
            scrollInterval = setInterval(() => {
              if (scrollIndex < currentResults.length - 1) {
                scrollIndex++;
                setScrollPosition(scrollIndex * 140); // Approximate height per card with spacing (140px)
              } else {
                clearInterval(scrollInterval);
              }
            }, 1000); // Scroll to next item every 1 second
            
            // Reset after showing results for 5 seconds (enough time to scroll through all)
            timeout3 = setTimeout(() => {
              setShowJobResults(false);
              setJobSearchText("");
              setScrollPosition(0);
              if (scrollInterval) clearInterval(scrollInterval);
              setCurrentJobIndex((prev) => (prev + 1) % jobRoles.length);
            }, 5000);
          }, 2000);
        }
      }, 100);
    }, 1000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearInterval(typeInterval);
      clearInterval(scrollInterval);
    };
  }, [currentJobIndex]);

  return (
    <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
      <SiteHeader />

      {/* Hero Section */}
      <section
        className={cn(
          appMarketingSection,
          "overflow-hidden px-4 pb-8 pt-20 sm:px-6 sm:pb-12 sm:pt-24 md:pt-28 lg:pb-16 lg:pt-32",
        )}
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-2xl leading-snug sm:text-3xl sm:leading-[1.15] lg:text-[2.5rem] lg:leading-[1.2] xl:text-[2.75rem] xl:leading-[1.18] font-bold tracking-tight text-slate-900 min-h-[4.5em] sm:min-h-[2.4em] mb-4 sm:mb-6">
                {/* First Line */}
                <div className="block">
                  {displayedText.length > 0 && displayedText.length <= firstLine.length ? (
                    <>
                      {displayedText.split("").map((char, index) => {
                        const isHighlight = index >= highlightStart && index < highlightEnd;
                        return (
                          <span
                            key={index}
                            className={`inline-block ${
                              isHighlight 
                                ? 'text-primary' 
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
                      {displayedText.length <= firstLine.length && (
                        <span 
                          className={`inline-block w-0.5 h-[1em] bg-primary ml-1 align-middle ${
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
                      {firstLine.split("").map((char, index) => {
                        const isHighlight = index >= highlightStart && index < highlightEnd;
                        return (
                          <span
                            key={index}
                            className={`inline-block ${
                              isHighlight 
                                ? 'text-primary' 
                                : 'text-slate-900'
                            }`}
                          >
                            {char === " " ? "\u00A0" : char}
                          </span>
                        );
                      })}
                    </>
                  ) : null}
                </div>
                
                {/* Second Line - Always rendered to prevent height jump */}
                <div className="block" style={{ minHeight: '1.3em' }}>
                  {displayedText.length > firstLine.length + 1 ? (
                    <>
                      {(() => {
                        const secondLineText = displayedText.slice(firstLine.length + 1);
                        const beforeHappens = secondLineText.slice(0, happensStart - firstLine.length - 1);
                        const happensText = secondLineText.slice(happensStart - firstLine.length - 1, happensEnd - firstLine.length - 1);
                        const afterHappens = secondLineText.slice(happensEnd - firstLine.length - 1);
                        
                        return (
                          <>
                            {beforeHappens.split("").map((char, index) => {
                              const actualIndex = firstLine.length + 1 + index;
                              return (
                                <span
                                  key={actualIndex}
                                  className="inline-block text-slate-900"
                                  style={{
                                    animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                                  }}
                                >
                                  {char === " " ? "\u00A0" : char}
                                </span>
                              );
                            })}
                            {happensText && (
                              <span
                                className="inline-block text-primary whitespace-nowrap"
                                style={{
                                  animation: `fadeInUp 0.4s ease-out ${beforeHappens.length * 0.05}s both`
                                }}
                              >
                                {happensText}
                              </span>
                            )}
                            {afterHappens.split("").map((char, index) => {
                              const actualIndex = happensEnd + index;
                              return (
                                <span
                                  key={actualIndex}
                                  className="inline-block text-slate-900"
                                  style={{
                                    animation: `fadeInUp 0.4s ease-out ${(beforeHappens.length + happensText.length + index) * 0.05}s both`
                                  }}
                                >
                                  {char === " " ? "\u00A0" : char}
                                </span>
                              );
                            })}
                          </>
                        );
                      })()}
                      {displayedText.length === fullText.length && (
                        <span 
                          className={`inline-block w-0.5 h-[1em] bg-primary ml-1 align-middle ${
                            showCursor ? 'opacity-100' : 'opacity-0'
                          }`}
                          style={{
                            transition: 'opacity 0.1s ease-in-out',
                            animation: 'fadeInUp 0.3s ease-out'
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <span className="invisible">{secondLine}</span>
                  )}
                </div>
              </h1>
              <p className="text-sm sm:text-base lg:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
                AI filters your resume before a human ever sees it. Interview Trix is your end-to-end career partner—ATS-ready resumes, AI Interview Practice and coding practice, peer sessions, and smart job matching—so you work smarter and get noticed.
              </p>
              
              {/* Company Logos */}
              <div className="pt-4 sm:pt-6 px-2 sm:px-0">
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 text-center lg:text-left">Trusted by candidates at top companies</p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 opacity-60">
                  <div className="text-lg sm:text-xl font-bold text-gray-700">Amazon</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-700">Deloitte</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-700">Flipkart</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-700">TCS</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-700">Infosys</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-700">Razorpay</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 px-2 sm:px-0">
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-slate-900 text-white font-semibold text-sm sm:text-base px-5 sm:px-6 py-4 sm:py-5 h-auto shadow-lg hover:shadow-xl transition-all"
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
              <div className="relative rounded-lg sm:rounded-xl shadow-2xl overflow-hidden bg-white w-full max-w-[600px] sm:max-w-[700px] border-2 sm:border-4 border-border">
                <Image
                  src="/mock-interview-previewiew.png"
                  alt="AI Interview Practice interface"
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
                <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-primary text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-lg text-[9px] sm:text-[10px] font-semibold animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                  <span className="hidden sm:inline">Real-time Feedback</span>
                  <span className="sm:hidden">Feedback</span>
                </div>
                <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-slate-900 text-white shadow-lg h-6 sm:h-7 px-1.5 sm:px-2 text-[9px] sm:text-[10px] animate-bounce" 
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
        className={cn(
          appMarketingSectionPurple,
          "scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16 lg:py-20",
        )}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div
              key={`why-float-a-${i}`}
              className="absolute"
              style={{
                left: `${(i * 11) % 92}%`,
                top: `${(i * 17) % 88}%`,
                opacity: 0.14,
                animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.45}s`,
              }}
            >
              {i % 4 === 0 ? (
                <FileText className="h-10 w-10 text-white sm:h-14 sm:w-14" />
              ) : i % 4 === 1 ? (
                <Mic className="h-10 w-10 text-white sm:h-14 sm:w-14" />
              ) : i % 4 === 2 ? (
                <Code className="h-10 w-10 text-white sm:h-14 sm:w-14" />
              ) : (
                <Video className="h-10 w-10 text-white sm:h-14 sm:w-14" />
              )}
            </div>
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`why-float-b-${i}`}
              className="absolute"
              style={{
                left: `${(i * 14 + 6) % 90}%`,
                top: `${(i * 19 + 8) % 85}%`,
                opacity: 0.11,
                animation: `float-${(i + 1) % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.6}s`,
              }}
            >
              {i % 3 === 0 ? (
                <Search className="h-8 w-8 text-white sm:h-11 sm:w-11" />
              ) : i % 3 === 1 ? (
                <Award className="h-8 w-8 text-white sm:h-11 sm:w-11" />
              ) : (
                <MessageSquare className="h-8 w-8 text-white sm:h-11 sm:w-11" />
              )}
            </div>
          ))}
          {[...Array(6)].map((_, i) => (
            <div
              key={`why-float-c-${i}`}
              className="absolute"
              style={{
                left: `${(i * 18 + 3) % 88}%`,
                top: `${(i * 23 + 5) % 90}%`,
                opacity: 0.09,
                animation: `float-${i % 3} ${8 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.75}s`,
              }}
            >
              {i % 2 === 0 ? (
                <Sparkles className="h-7 w-7 text-white sm:h-10 sm:w-10" />
              ) : (
                <Brain className="h-7 w-7 text-white sm:h-10 sm:w-10" />
              )}
            </div>
          ))}
        </div>
        <div className="relative z-10 container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-sm font-medium text-white/95">
              <Sparkles className="h-3 w-3" />
              <span>Why Interview Trix</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white/95 sm:text-4xl lg:text-5xl">
              Don&apos;t just apply.{" "}
              <span className="text-white/95">Win.</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/75">
              From an ATS-ready resume to AI Interview Practice, peer interviews, and the perfect job match—one platform built for how hiring works today.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group bg-card shadow-card hover:shadow-header relative rounded-2xl border border-border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40">
              <div className="absolute inset-0 bg-card/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  AI Resume Builder
                </h3>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Pass the bots. Reach the desk.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Real-time analysis, instant improvements, Smart ATS Score, and ATS-optimized templates—whether you&apos;re a fresher or a seasoned pro.
                </p>
              </div>
            </div>

            <div className="group bg-card shadow-card hover:shadow-header relative rounded-2xl border border-border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40">
              <div className="absolute inset-0 bg-card/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Mic className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  AI Interview Practice
                </h3>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Company-specific. Multilingual.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Tell us your dream company—we simulate their style. Practice in multiple languages with adaptive follow-ups that feel like the real thing.
                </p>
              </div>
            </div>

            <div className="group bg-card shadow-card hover:shadow-header relative rounded-2xl border border-border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40">
              <div className="absolute inset-0 bg-card/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Code className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Practice Coding Round
                </h3>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Solve. Defend. Get scored.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Work through problems, then discuss your solution with AI—full report and discussion score so you&apos;re never caught off guard.
                </p>
              </div>
            </div>

            <Link
              href="/sign-up"
              className="group bg-card hover:shadow-header relative block rounded-2xl border border-border p-6 text-left shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-card/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Video className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Peer Interviews
                </h3>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Beat the fear. Real engineers.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Schedule with engineers from top companies—real-time feedback and an overall performance score from people who&apos;ve been there.
                </p>
                <p className="text-sm font-medium text-primary mt-3 flex items-center gap-1">
                  Sign up to book
                  <ArrowRight className="w-4 h-4" />
                </p>
              </div>
            </Link>

            <div className="group bg-card shadow-card hover:shadow-header relative rounded-2xl border border-border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40">
              <div className="absolute inset-0 bg-card/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Company-Specific Prep
                </h3>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Target your next employer.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Role- and round-aware practice so you walk in aligned with how that team actually interviews.
                </p>
              </div>
            </div>

            <Link
              href="/ai-job-search"
              className="group bg-card hover:shadow-header relative block rounded-2xl border border-border p-6 text-left shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-card/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Search className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Smart Job Search
                </h3>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Match · Refine · Apply
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Surface strong fits, see your odds of getting hired, then refine your resume for that exact job description before you apply.
                </p>
                <p className="text-sm font-medium text-primary mt-3 flex items-center gap-1">
                  Learn more
                  <ArrowRight className="w-4 h-4" />
                </p>
              </div>
            </Link>
          </div>
        </div>
      </ScrollSection>

      {/* Resume Builder Section */}
      <ScrollSection
        id="build-resume"
        className={cn(
          appMarketingSection,
          "scroll-mt-20 border-t border-border px-4 py-12 sm:px-6 sm:py-16",
        )}
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Section - Marketing Content */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-primary font-medium text-sm">
                <span>ATS-Optimized Templates · Real-Time Suggestions</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 leading-tight">
                Start With a Resume That <span className="text-primary">Passes the Bots</span>
              </h2>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Our model analyzes your resume in real time—instant improvements and a Smart ATS Score—so you land on the recruiter&apos;s desk, not in the black hole.
              </p>

              {/* AI-Powered Features */}
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    ATS-Optimized Templates
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    Smart ATS Scoring
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    Real-Time Improvements
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    Instant Suggestions
                  </h3>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-4">
                <Link href="/dashboard/resumes/new" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-white font-medium shadow-sm transition-all h-12 px-6 hover:opacity-90 !bg-primary"
                  >
                    Try Builder Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/ai-resume-builder" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-gray-200 text-gray-700 font-medium h-12 px-6 hover:!bg-slate-900 hover:!text-white transition-all"
                  >
                    Browse Templates
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Section - Resume Preview */}
            <div className="relative flex justify-center min-w-0 w-full">
              <div className="relative isolate rounded-lg shadow-2xl overflow-hidden bg-white w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[400px]">
                {/* Layered carousel avoids iOS Safari flex+transform sizing glitches */}
                <div className="relative w-full min-w-0 overflow-hidden aspect-[210/297]">
                  {resumeTemplates.map((template, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                        currentSlide === index
                          ? "opacity-100 pointer-events-auto"
                          : "opacity-0 pointer-events-none"
                      }`}
                      aria-hidden={currentSlide !== index}
                    >
                      <Image
                        src={template}
                        alt={`Resume Template ${index + 1}`}
                        width={400}
                        height={500}
                        className="h-full w-full max-h-full object-contain object-center"
                        priority={index === 0}
                      />
                    </div>
                  ))}
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
                <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-primary text-primary-foreground px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-lg text-[8px] sm:text-[9px] lg:text-[10px] font-semibold animate-pulse z-10" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                  <span className="hidden sm:inline">Templates Available</span>
                  <span className="sm:hidden">ATS-Optimized Templates</span>
                </div>
                {/* AI-Powered Button */}
                <div className="absolute bottom-8 right-1 sm:bottom-10 sm:right-2 animate-bounce z-10" style={{ animationDuration: '2.2s', animationDelay: '1s' }}>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-slate-900 text-white shadow-lg h-6 px-1.5 sm:h-7 sm:px-2 text-[8px] sm:text-[9px] lg:text-[10px] hover:scale-105 transition-transform"
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

      {/* AI Interview Practice hero */}
      <ScrollSection
        id="start-interview"
        className={cn(
          appMarketingSectionAlt,
          "scroll-mt-20 border-t border-border px-4 py-12 sm:px-6 sm:py-16",
        )}
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Section - Marketing Content */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-primary font-medium text-sm">
                <span>AI Interview Practice · Company-Specific Prep</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 leading-tight">
                Shortlisted? <span className="text-primary">Perform</span> Under Pressure
              </h2>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                AI Interview Practice in multiple languages, tailored to your dream company&apos;s style—plus coding rounds where you defend your solution and receive a full report and discussion score.
              </p>

              {/* AI-Powered Features */}
              <div className="space-y-6 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      AI Interview Practice
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Tell us the company—we simulate their interview style with realistic, adaptive spoken sessions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Multilingual Support
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Practice across the languages you need so you&apos;re fluent when it counts.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Code className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Practice Coding + AI Discussion
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Solve challenging problems, then discuss your approach—questions targeted to your actual code and solution.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Reports &amp; Scores
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Full feedback and discussion scores so you know exactly what to improve before the real round.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-4">
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-slate-900 text-white font-medium shadow-sm transition-all h-12 px-6"
                  >
                    Start Free Interview
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/ai-interview-coach" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-gray-200 text-gray-700 font-medium h-12 px-6 hover:!bg-slate-900 hover:!text-white transition-all"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>5,000+ students trained</span>
                </div>
              </div>
            </div>

            {/* Right Side - Product UI Demo */}
            <div className="relative lg:pl-8 shake-vertical">
              <div className="relative">
                {/* Background Shape */}
                <div className="absolute inset-0 bg-primary rounded-3xl transform rotate-3 opacity-10"></div>
                
                {/* Floating UI Card */}
                <div className="relative bg-card rounded-2xl shadow-2xl border-2 border-border overflow-hidden">
                  {/* Animated Background Icons */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute opacity-10"
                        style={{
                          left: `${(i * 18) % 100}%`,
                          top: `${(i * 20) % 100}%`,
                          animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                          animationDelay: `${i * 0.5}s`,
                        }}
                      >
                        {i % 3 === 0 ? (
                          <Mic className="w-8 h-8 text-primary/70" />
                        ) : i % 3 === 1 ? (
                          <Brain className="w-8 h-8 text-primary/70" />
                        ) : (
                          <MessageSquare className="w-8 h-8 text-primary/70" />
                        )}
                      </div>
                    ))}
                  </div>
                  {/* AI Interview Practice interface */}
                  <div className="p-6 relative z-10">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mic-animated shadow-lg">
                          <Mic className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900">AI Interview Session</div>
                          <div className="text-xs text-primary">Live • Technical Round</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-primary font-medium">Recording</span>
                      </div>
                    </div>

                    {/* Question Section */}
                    <div className="mb-6">
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-4 border border-border">
                        <p className="text-sm text-primary font-medium mb-2">Question 3 of 10</p>
                        <p className="text-base text-slate-900">
                          "Explain the difference between REST and GraphQL APIs. When would you choose one over the other?"
                        </p>
                      </div>
                      
                      {/* Answer Section */}
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                          <span className="text-xs text-primary font-medium">Your Response</span>
                        </div>
                        <p className="text-sm text-slate-700 italic">
                          "REST is a stateless architectural style that uses standard HTTP methods..."
                        </p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">8.5</div>
                        <div className="text-xs text-primary">Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">92%</div>
                        <div className="text-xs text-primary">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">2:34</div>
                        <div className="text-xs text-primary">Time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* AI Job Search Hero Section */}
      <section
        className={cn(
          appMarketingSectionLight,
          "px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28",
        )}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={`job-float-${i}`}
              className="absolute"
              style={{
                left: `${(i * 20 + 5) % 85}%`,
                top: `${(i * 22 + 10) % 80}%`,
                opacity: 0.16,
                animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              {i % 3 === 0 ? (
                <Search className="h-10 w-10 text-[#7367F0] sm:h-12 sm:w-12" />
              ) : i % 3 === 1 ? (
                <Briefcase className="h-10 w-10 text-[#7367F0] sm:h-12 sm:w-12" />
              ) : (
                <TrendingUp className="h-10 w-10 text-[#7367F0] sm:h-12 sm:w-12" />
              )}
            </div>
          ))}
          {[
            { left: "72%", top: "6%", icon: Search },
            { left: "84%", top: "14%", icon: Briefcase },
            { left: "78%", top: "22%", icon: TrendingUp },
            { left: "90%", top: "8%", icon: FileText },
            { left: "68%", top: "16%", icon: Sparkles },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={`job-float-tr-${i}`}
                className="absolute"
                style={{
                  left: item.left,
                  top: item.top,
                  opacity: 0.14,
                  animation: `float-${(i + 1) % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.65}s`,
                }}
              >
                <Icon className="h-8 w-8 text-[#7367F0] sm:h-10 sm:w-10" />
              </div>
            );
          })}
        </div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#7367F0]/15 bg-[#7367F0]/10 px-3 py-1 text-sm font-medium text-[#7367F0] mb-4">
                <Sparkles className="w-3 h-3" />
                <span>Coming Soon</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[43px] font-bold tracking-tight text-slate-900 leading-[1.2] sm:leading-[1.1] lg:leading-[52px] mb-4 sm:mb-6">
                Smart Job Search:
                <span className="block text-primary">Match · Refine · Apply</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
                The finish line: find roles that fit, see your hiring odds, then refine your resume for that exact job description—right before you apply.
              </p>
              
              {/* Features List */}
              <div className="space-y-3 pt-4 sm:pt-6 px-2 sm:px-0">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">Surface strong matches across the wider job landscape—not just one job board.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">Highlights where you&apos;re competitive so you prioritize the right opportunities.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">Tailor your resume to a specific JD, then apply with confidence.</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 px-2 sm:px-0">
                <AiJobSearchNotifyButton className="w-full sm:w-auto" />
                <Link href="/ai-job-search" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-gray-200 text-gray-700 font-medium h-12 px-6 hover:!bg-slate-900 hover:!text-white transition-all"
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Section - Animated Job Search Preview */}
            <div className="relative flex justify-center lg:justify-start order-1 lg:order-2">
              <div className="relative rounded-lg sm:rounded-xl shadow-2xl overflow-hidden bg-white w-full max-w-[600px] sm:max-w-[700px] border-2 sm:border-4 border-border">
                {/* Search Box */}
                <div className="p-4 sm:p-6 bg-muted/40 border-b border-gray-200">
                  <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={jobSearchText}
                      readOnly
                      placeholder="Search for jobs..."
                      className="flex-1 outline-none text-sm sm:text-base text-gray-700 bg-transparent"
                    />
                    {jobSearchText && (
                      <span className="text-primary text-xs sm:text-sm font-medium">
                        {jobSearchText.length}/{jobRoles[currentJobIndex % jobRoles.length].length}
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Matching Indicator */}
                {isSearching && (
                  <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 bg-muted rounded-full w-3/4 mb-2"></div>
                        <div className="h-2 bg-muted rounded-full w-1/2"></div>
                      </div>
                      <span className="text-xs sm:text-sm text-primary font-medium">Matching...</span>
                    </div>
                  </div>
                )}

                {/* Job Results */}
                {showJobResults && (
                  <div className="p-4 sm:p-6 bg-white max-h-[400px] overflow-hidden relative">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">Best Matches</h3>
                      <span className="text-xs sm:text-sm text-primary font-medium">{currentJobResults.length} results</span>
                    </div>
                    <div 
                      ref={jobResultsRef}
                      className="space-y-3 transition-transform duration-700 ease-in-out"
                      style={{
                        transform: `translateY(-${scrollPosition}px)`
                      }}
                    >
                      {currentJobResults.map((job, index) => (
                        <div
                          key={index}
                          className="bg-muted/40 rounded-lg p-4 border border-border hover:border-border transition-all"
                          style={{
                            animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Briefcase className="w-4 h-4 text-primary" />
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base">{job.role}</h4>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600">{job.company}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-gray-500">{job.location}</span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">{job.salary}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3 text-green-600" />
                                <span className="text-xs font-bold text-green-700">{job.score}%</span>
                              </div>
                              <span className="text-xs text-gray-500">Match</span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                            <div className="flex-1 min-w-[100px]">
                              <div className="w-full text-xs h-8 border border-border text-primary bg-white rounded-md flex items-center justify-center cursor-default">
                                <FileText className="w-3 h-3 mr-1" />
                                Update Resume
                              </div>
                            </div>
                            <div className="flex-1 min-w-[100px]">
                              <div className="w-full text-xs h-8 border border-border text-primary bg-white rounded-md flex items-center justify-center cursor-default">
                                <Mic className="w-3 h-3 mr-1" />
                                Practice Interview
                              </div>
                            </div>
                            <div className="flex-1 min-w-[80px]">
                              <div className="w-full text-xs h-8 bg-primary text-primary-foreground rounded-md flex items-center justify-center cursor-default">
                                Apply Now
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!isSearching && !showJobResults && jobSearchText === "" && (
                  <div className="p-8 sm:p-12 text-center">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Start typing to search for jobs...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        id="stats-section"
        className={cn(
          appMarketingSectionAlt,
          "px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:py-20",
        )}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Card 1: Users */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8 flex items-center gap-4 sm:gap-6 hover:shadow-lg transition-all">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-primary rounded-lg flex items-center justify-center">
                  <Users className="w-7 h-7 sm:w-8 sm:w-9 lg:w-10 lg:h-10 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-1 text-2xl font-bold text-primary sm:text-3xl lg:text-4xl">
                  {usersCount}
                </div>
                <div className="text-sm sm:text-base text-primary">
                  Users Trust Interview Trix
                </div>
              </div>
            </div>

            {/* Card 2: Resumes */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8 flex items-center gap-4 sm:gap-6 hover:shadow-lg transition-all">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-primary rounded-lg flex items-center justify-center">
                  <FileText className="w-7 h-7 sm:w-8 sm:w-9 lg:w-10 lg:h-10 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-1 text-2xl font-bold text-primary sm:text-3xl lg:text-4xl">
                  {resumesCount}
                </div>
                <div className="text-sm sm:text-base text-primary">
                  Resume Created
                </div>
              </div>
            </div>

            {/* Card 3: Interviews */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8 flex items-center gap-4 sm:gap-6 hover:shadow-lg transition-all">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-primary rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 sm:w-8 sm:w-9 lg:w-10 lg:h-10 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-1 text-2xl font-bold text-primary sm:text-3xl lg:text-4xl">
                  {interviewsCount}
                </div>
                <div className="text-sm sm:text-base text-primary">
                  Interview Practiced
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <PlansSection />

      {/* Reviews/Testimonials Section */}
      <section
        className={cn(
          appMarketingSectionAlt,
          "relative overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:py-20",
        )}
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
              Transform your career—together
            </h2>
            <p className="text-lg sm:text-xl text-primary mb-4 sm:mb-6">
              Job seekers and teams use Interview Trix as an end-to-end career partner. Here&apos;s what they say.
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-base sm:text-lg text-primary font-medium">
                4.9/5 based on our user reviews
              </span>
            </div>
          </div>

          {/* Featured Testimonial */}
          <div className="mb-8 sm:mb-12">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 shadow-xl border border-gray-100 relative overflow-hidden">
              {/* Gradient Background Element */}
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 blur-3xl"></div>
              
              <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-center relative z-10">
                {/* Left Side - Quote and Text */}
                <div>
                  <Quote className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400 mb-4 sm:mb-6" />
                  <p className="text-base sm:text-lg lg:text-xl text-slate-900 leading-relaxed mb-6 sm:mb-8">
                    Interview Trix is one of the first apps our team insisted on installing on our new laptops. We use it every day to prepare for interviews and improve our communication skills.
                  </p>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-slate-900">Rajesh Kumar</p>
                    <p className="text-base sm:text-lg text-primary">Software Engineer at TCS</p>
                  </div>
                </div>
                
                {/* Right Side - Profile Picture */}
                <div className="flex justify-center lg:justify-end">
                  <div className="relative">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full bg-gradient-to-br from-primary/80 to-primary p-1">
                      <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
                        RK
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three Smaller Testimonials */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
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

            {/* Testimonial 2 */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                  QL
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

            {/* Testimonial 3 */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all sm:col-span-2 lg:col-span-1">
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
      </section>

      {/* New CTA Card Section */}
      <section
        className={cn(appMarketingSectionAlt, "px-4 py-12 sm:px-6 sm:py-16 lg:py-20")}
      >
        <div className="container mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-primary p-8 shadow-header sm:p-12 lg:p-16 text-primary-foreground">
            {/* Limited Time Offer Badge */}
            <div className="mb-4 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-foreground/90" />
              <span className="text-sm text-primary-foreground/90">Start today</span>
            </div>

            {/* Main Heading */}
            <h2 className="mb-4 text-center text-3xl font-bold text-primary-foreground sm:mb-6 sm:text-4xl lg:text-5xl">
              Transform your career now
            </h2>

            {/* Subtitle */}
            <p className="mx-auto mb-8 max-w-2xl text-center text-base leading-relaxed text-primary-foreground/90 sm:mb-10 sm:text-lg lg:text-xl">
              Don&apos;t just apply. Win. Interview Trix goes from ATS-ready resume to final interview and job match—your AI ally all the way.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 sm:mb-10">
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="h-12 w-full bg-primary-foreground px-6 text-base font-medium text-primary shadow-lg transition-all hover:bg-primary-foreground/90 hover:shadow-xl sm:h-14 sm:w-auto sm:px-8 sm:text-lg"
                >
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 w-full px-6 text-base font-medium shadow-lg transition-all hover:shadow-xl sm:h-14 sm:w-auto sm:px-8 sm:text-lg"
                >
                  Schedule a Demo
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/15"
                  ></div>
                ))}
              </div>
              <span className="text-center text-sm text-primary-foreground/90 sm:text-base">
                500+ candidates started this month
              </span>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
