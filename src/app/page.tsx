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
  Camera,
  Target,
  BarChart3,
  Network,
} from "lucide-react";
import Image from "next/image";
import { PlansSection } from "@/components/PlansSection";
import { ScrollSection } from "@/components/ScrollSection";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { WhyFeatureCardsMarquee } from "@/components/marketing/WhyFeatureCardsMarquee";
import { SeoVideoSection } from "@/components/seo/SeoVideoSection";
import { aiInterviewDemoVideo } from "@/lib/seo/marketing-video-content";
import {
  StackedFeatureScroll,
} from "@/components/marketing/StackedFeatureScroll";
import { CodingRoundHeroPreview } from "@/components/coding-interviews/CodingRoundHeroPreview";
import { InterviewPracticeHeroPreview } from "@/components/marketing/InterviewPracticeHeroPreview";
import { SystemDesignHeroPreview } from "@/components/system-design/SystemDesignHeroPreview";
import { AiJobSearchNotifyButton } from "@/components/AiJobSearchNotifyButton";
import { appMarketingSection, appMarketingSectionAlt, appMarketingSectionPurple, appMarketingSectionLight } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

const stackedFeatureCtaRowClass =
  "flex flex-row items-stretch gap-2 pt-4 sm:items-start sm:gap-4";
const stackedFeatureCtaLinkClass = "min-w-0 flex-1 sm:flex-initial sm:w-auto";
const stackedFeatureCtaButtonClass =
  "w-full whitespace-nowrap px-2.5 text-xs h-11 sm:h-12 sm:px-6 sm:text-base";
const stackedFeatureSectionTitleClass =
  "text-center lg:text-left text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 leading-tight";
const stackedFeatureBadgeWrapClass = "flex justify-center lg:justify-start";
const stackedFeatureBadgeClass =
  "inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-primary font-medium text-sm";

// Count-up when stats section scrolls into view
function useCountUp(
  end: number,
  duration: number = 2000,
  suffix: string = "",
  prefix: string = "",
  delay: number = 0,
) {
  const [count, setCount] = useState(0);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const element = document.getElementById("stats-section");
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || hasStartedRef.current) return;
        hasStartedRef.current = true;

        const run = () => {
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(end * easeOutQuart));
            if (progress < 1) requestAnimationFrame(animate);
            else setCount(end);
          };
          requestAnimationFrame(animate);
        };

        if (delay > 0) {
          window.setTimeout(run, delay);
        } else {
          run();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [end, duration, delay]);

  return prefix + count.toLocaleString("en-IN") + suffix;
}

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

function renderHighlightedText(
  text: string,
  highlightStart: number,
  highlightEnd: number,
  highlightClass = "text-primary",
) {
  if (!text) return null;

  const safeStart = Math.min(highlightStart, text.length);
  const safeEnd = Math.min(highlightEnd, text.length);

  if (safeStart >= safeEnd) {
    return <>{text}</>;
  }

  return (
    <>
      {text.slice(0, safeStart)}
      <span className={highlightClass}>{text.slice(safeStart, safeEnd)}</span>
      {text.slice(safeEnd)}
    </>
  );
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
  
  // Animated counts (scroll into view → count up over ~2s, staggered)
  const usersCount = useCountUp(3000, 2000, "+", "", 0);
  const resumesCount = useCountUp(3000, 2000, "+", "", 200);
  const interviewsCount = useCountUp(5000, 2200, "+", "", 400);

  const resumeTemplates = [
    "/resume-template-images/atlantic-blue-template-design.webp",
    "/resume-template-images/Mercury-template-design.webp",
    "/resume-template-images/saffron-line-template-design.webp",
    "/resume-template-images/clean-slate-preview.webp",
  ];

  const firstLine = "Master Your Interview with AI";
  const secondLine = "Before Real one happens";
  const fullText = firstLine + " " + secondLine;
  const highlightStart = 12; // "Interview" in first line
  const highlightEnd = highlightStart + 9;
  // Highlight "Real one" in second line (local index 7 in secondLine)
  const allyLocalStart = 7;
  const happensStart = firstLine.length + 1 + allyLocalStart;
  const happensEnd = happensStart + 8;

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
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start lg:items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center lg:text-left order-2 lg:order-1">
              <h1 className="relative mb-4 sm:mb-6 text-[1.22rem] leading-tight sm:text-[1.46rem] md:text-[1.625rem] lg:text-[2.15rem] xl:text-[2.28rem] font-bold tracking-tight text-slate-900">
                {/* Invisible sizer locks hero headline to exactly two lines */}
                <span
                  className="invisible block select-none pointer-events-none"
                  aria-hidden="true"
                >
                  <span className="block whitespace-nowrap">{firstLine}</span>
                  <span className="block whitespace-nowrap">{secondLine}</span>
                </span>

                <span className="absolute inset-0">
                  <span className="block whitespace-nowrap">
                    {displayedText.length > 0 &&
                      renderHighlightedText(
                        displayedText.length <= firstLine.length
                          ? displayedText
                          : firstLine,
                        highlightStart,
                        highlightEnd,
                      )}
                    {displayedText.length > 0 &&
                      displayedText.length <= firstLine.length && (
                        <span
                          className={`inline-block w-0.5 h-[1em] bg-primary ml-0.5 align-middle ${
                            showCursor ? "opacity-100" : "opacity-0"
                          }`}
                          style={{ transition: "opacity 0.1s ease-in-out" }}
                        />
                      )}
                  </span>
                  <span className="block whitespace-nowrap">
                    {displayedText.length > firstLine.length + 1 &&
                      renderHighlightedText(
                        displayedText.slice(firstLine.length + 1),
                        happensStart - firstLine.length - 1,
                        happensEnd - firstLine.length - 1,
                      )}
                    {displayedText.length > firstLine.length + 1 &&
                      displayedText.length < fullText.length && (
                        <span
                          className={`inline-block w-0.5 h-[1em] bg-primary ml-0.5 align-middle ${
                            showCursor ? "opacity-100" : "opacity-0"
                          }`}
                          style={{ transition: "opacity 0.1s ease-in-out" }}
                        />
                      )}
                    {displayedText.length === fullText.length && (
                      <span
                        className={`inline-block w-0.5 h-[1em] bg-primary ml-0.5 align-middle ${
                          showCursor ? "opacity-100" : "opacity-0"
                        }`}
                        style={{ transition: "opacity 0.1s ease-in-out" }}
                      />
                    )}
                  </span>
                </span>
              </h1>
              <p className="text-sm sm:text-base lg:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
                Practice AI voice interviews with company-specific questions and instant feedback—plus ATS resumes and hire scores. One platform to get you offer-ready before the real interview.
              </p>
              
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

              {/* Quick Stats */}
              <div className="flex flex-nowrap items-center justify-center lg:justify-start gap-3 sm:gap-6 pt-2 text-xs sm:text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                  <span className="whitespace-nowrap">No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                  <span className="whitespace-nowrap">5,000+ students trained</span>
                </div>
              </div>
            </div>

            {/* Right Section - Interview Preview */}
            <div className="relative flex justify-center lg:justify-start order-1 lg:order-2">
              <div className="relative rounded-lg sm:rounded-xl shadow-2xl overflow-hidden bg-white w-full max-w-[600px] sm:max-w-[700px] border-2 sm:border-4 border-border">
                <SeoVideoSection
                  content={aiInterviewDemoVideo}
                  variant="hero"
                  playerClassName="w-full"
                  autoPlay
                  loop
                  muted
                >
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
                </SeoVideoSection>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Companies */}
      <section className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-white to-slate-50/80 px-4 py-14 sm:px-6 sm:py-20">
        <div className="container relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-primary font-medium text-sm">
              <span>Trusted Worldwide</span>
            </div>
            <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
              Our candidates work at the{" "}
              <span className="text-primary">world&apos;s best companies</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
              From global tech giants to fast-growing innovators — thousands have
              landed roles at the companies they aimed for.
            </p>
          </div>

          {/* Desktop / tablet grid */}
          <div className="mt-14 hidden grid-cols-2 gap-4 sm:grid sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {trustedCompanies.map((company) => (
              <div
                key={company.file}
                className="group flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white px-4 py-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md sm:px-6 sm:py-8"
              >
                <Image
                  src={`/company-logos/${company.file}`}
                  alt={`${company.name} logo`}
                  width={180}
                  height={56}
                  className="h-8 w-auto max-w-[140px] object-contain transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:max-w-[160px]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile carousel — auto-scrolling, two logos in view */}
        <div
          className="-mx-4 mt-10 overflow-hidden sm:hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <div className="flex w-max animate-trusted-logos-marquee">
            {[...trustedCompanies, ...trustedCompanies].map((company, index) => (
              <div
                key={`${company.file}-${index}`}
                className="flex w-[50vw] shrink-0 items-center justify-center px-3"
              >
                <div className="flex h-20 w-full items-center justify-center rounded-2xl border border-slate-200/70 bg-white px-4 shadow-sm">
                  <Image
                    src={`/company-logos/${company.file}`}
                    alt={`${company.name} logo`}
                    width={180}
                    height={56}
                    className="h-8 w-auto max-w-[34vw] object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <ScrollSection
        id="why-us"
        className={cn(
          "relative overflow-hidden border-y border-[#7367F0]/20 bg-gradient-to-br from-[#7367F0]/[0.16] via-[#7367F0]/[0.06] to-[#7367F0]/[0.22]",
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
                <FileText className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
              ) : i % 4 === 1 ? (
                <Mic className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
              ) : i % 4 === 2 ? (
                <Code className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
              ) : (
                <Video className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
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
                <Search className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
              ) : i % 3 === 1 ? (
                <Award className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
              ) : (
                <MessageSquare className="h-8 w-8 text-primary sm:h-11 sm:w-11" />
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
                <Sparkles className="h-7 w-7 text-primary sm:h-10 sm:w-10" />
              ) : (
                <Brain className="h-7 w-7 text-primary sm:h-10 sm:w-10" />
              )}
            </div>
          ))}
        </div>
        <div className="relative z-10 container mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-primary font-medium text-sm">
              <span>Why Interview Trix</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Don&apos;t just apply.{" "}
              <span className="text-primary">Win.</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
              From an ATS-ready resume to AI Interview Practice, peer interviews, and the perfect job match—one platform built for how hiring works today.
            </p>
          </div>
        </div>
        <div className="relative z-10 container mx-auto max-w-7xl">
          <WhyFeatureCardsMarquee />
        </div>
      </ScrollSection>

      {/* Stacked feature scroll — resume, interview, coding, system design */}
      <StackedFeatureScroll heading="Get Hired In a Week with">
      <StackedFeatureScroll.Step
        id="build-resume"
        stepTitle="Build an ATS-Proof Resume using AI"
        className={appMarketingSection}
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Section - Marketing Content */}
            <div className="space-y-6 lg:order-1">
              {/* Badge */}
              <div className={stackedFeatureBadgeWrapClass}>
                <div className={stackedFeatureBadgeClass}>
                  <span>AI-Powered Writing • Live ATS Analysis</span>
                </div>
              </div>

              {/* Headline */}
              <h2 id="build-resume-heading" className={stackedFeatureSectionTitleClass}>
                Build an <span className="text-primary">ATS-Proof Resume</span> using AI
              </h2>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Import your CV, patch ATS keywords, and AI-quantify your impact—build
                the resume that clears screening and wins interviews.
              </p>

              {/* AI-Powered Features */}
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-6 pt-4">
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      50+ ATS-Safe Templates
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Guaranteed parsing without hidden formatting errors.
                    </p>
                  </div>
                </div>
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      Live ATS Scoring
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      See your match rate update live as you edit your profile.
                    </p>
                  </div>
                </div>
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      One-Click AI Rewrites
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Highlight weak bullets and let AI rewrite them with strong metrics.
                    </p>
                  </div>
                </div>
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      Frictionless Import
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Skip the blank page—import from LinkedIn or an old PDF.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className={stackedFeatureCtaRowClass}>
                <Link href="/dashboard/resumes/new" className={stackedFeatureCtaLinkClass}>
                  <Button
                    size="lg"
                    className={cn(
                      stackedFeatureCtaButtonClass,
                      "text-white font-medium shadow-sm transition-all hover:opacity-90 !bg-primary",
                    )}
                  >
                    Build Free Resume
                    <ArrowRight className="w-3.5 h-3.5 ml-1 sm:w-4 sm:h-4 sm:ml-2" />
                  </Button>
                </Link>
                <Link href="/ai-resume-builder" className={stackedFeatureCtaLinkClass}>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      stackedFeatureCtaButtonClass,
                      "border-gray-200 text-gray-700 font-medium hover:!bg-slate-900 hover:!text-white transition-all",
                    )}
                  >
                    Browse 50+ Templates
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Section - Resume Preview */}
            <div className="relative flex justify-center min-w-0 w-full lg:order-2">
              <div className="relative isolate rounded-lg shadow-2xl overflow-hidden bg-white w-full max-w-[220px] sm:max-w-[260px] lg:max-w-[300px]">
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
                        width={300}
                        height={424}
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
      </StackedFeatureScroll.Step>

      <StackedFeatureScroll.Step
        id="start-interview"
        stepTitle="Master AI Interview Practice"
        className={appMarketingSectionAlt}
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Section - Marketing Content */}
            <div className="space-y-6 lg:order-1">
              {/* Badge */}
              <div className={stackedFeatureBadgeWrapClass}>
                <div className={stackedFeatureBadgeClass}>
                  <span>Live AI Mock Interviews • Advanced Proctoring</span>
                </div>
              </div>

              {/* Headline */}
              <h2 id="start-interview-heading" className={stackedFeatureSectionTitleClass}>
                Master <span className="text-primary">AI Interview Practice</span>
              </h2>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Company-tailored voice mocks, adaptive difficulty, and instant delivery
                feedback—rehearse the interview that wins offers.
              </p>

              {/* AI-Powered Features */}
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-6 pt-4">
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      Conversational Voice AI
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Fluid, hyper-realistic voice chats that feel like a real recruiter.
                    </p>
                  </div>
                </div>
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      Company-Specific Scenarios
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Targeted questions tailored to your exact job title and company.
                    </p>
                  </div>
                </div>
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      Adaptive Difficulty Scaling
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Difficulty ramps up instantly based on your real-time performance.
                    </p>
                  </div>
                </div>
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      Instant Voice Analytics
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Instant breakdown of your tone, filler words, pacing, and accuracy.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className={stackedFeatureCtaRowClass}>
                <Link href="/ai-interview-coach" className={stackedFeatureCtaLinkClass}>
                  <Button
                    size="lg"
                    className={cn(
                      stackedFeatureCtaButtonClass,
                      "bg-primary hover:bg-slate-900 text-white font-medium shadow-sm transition-all",
                    )}
                  >
                    Start Mock Interview
                    <ArrowRight className="w-3.5 h-3.5 ml-1 sm:w-4 sm:h-4 sm:ml-2" />
                  </Button>
                </Link>
                <Link href="/ai-interview-coach" className={stackedFeatureCtaLinkClass}>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      stackedFeatureCtaButtonClass,
                      "border-gray-200 text-gray-700 font-medium hover:!bg-slate-900 hover:!text-white transition-all",
                    )}
                  >
                    Know more
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Product UI Demo */}
            <div
              id="sample-analytics-preview"
              className="relative w-full min-w-0 scroll-mt-24 lg:order-2 lg:pl-8"
            >
              <InterviewPracticeHeroPreview />
            </div>
          </div>
        </div>
      </StackedFeatureScroll.Step>

      <StackedFeatureScroll.Step
        id="practice-coding"
        stepTitle="Practice the Coding Round"
        className={appMarketingSection}
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Animated Preview */}
            <div className="order-2 w-full min-w-0 lg:order-1 lg:w-auto shake-vertical">
              <CodingRoundHeroPreview className="max-w-none sm:max-w-none lg:max-w-[600px] xl:max-w-[700px]" />
            </div>

            {/* Right Side - Marketing Content */}
            <div className="order-1 space-y-6 lg:order-2">
              <div className={stackedFeatureBadgeWrapClass}>
                <div className={stackedFeatureBadgeClass}>
                  <span>Live IDE • Public + Hidden Tests</span>
                </div>
              </div>

              <h2 id="practice-coding-heading" className={stackedFeatureSectionTitleClass}>
                Practice the <span className="text-primary">Coding Round</span>
              </h2>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Live IDE, hidden test cases, and AI cross-examination on your logic
                and complexity—rehearse the coding round that wins offers.
              </p>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-6 pt-4">
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Code className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      Real-Time Code Execution
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Write and run code instantly against public and hidden tests.
                    </p>
                  </div>
                </div>
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      AI Logic Cross-Examination
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Explain your approach and defend complexity, just like a real round.
                    </p>
                  </div>
                </div>
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      Hidden Test Coverage
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Catch edge cases before the real interview does.
                    </p>
                  </div>
                </div>
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      Instant Performance Report
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Get scored on correctness, efficiency, and communication.
                    </p>
                  </div>
                </div>
              </div>

              <div className={stackedFeatureCtaRowClass}>
                <Link
                  href="/dashboard/coding-interviews/new"
                  className={stackedFeatureCtaLinkClass}
                >
                  <Button
                    size="lg"
                    className={cn(
                      stackedFeatureCtaButtonClass,
                      "bg-primary hover:bg-slate-900 text-white font-medium shadow-sm transition-all",
                    )}
                  >
                    Start Coding Round
                    <ArrowRight className="w-3.5 h-3.5 ml-1 sm:w-4 sm:h-4 sm:ml-2" />
                  </Button>
                </Link>
                <Link href="/ai-coding-practice" className={stackedFeatureCtaLinkClass}>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      stackedFeatureCtaButtonClass,
                      "border-gray-200 text-gray-700 font-medium hover:!bg-slate-900 hover:!text-white transition-all",
                    )}
                  >
                    Know more
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </StackedFeatureScroll.Step>

      <StackedFeatureScroll.Step
        id="practice-system-design"
        stepTitle="Practice Live System Design"
        className={appMarketingSectionAlt}
      >
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-6 lg:order-1">
              <div className={stackedFeatureBadgeWrapClass}>
                <div className={stackedFeatureBadgeClass}>
                  <span>Live Whiteboard • Voice-Driven</span>
                </div>
              </div>

              <h2 id="practice-system-design-heading" className={stackedFeatureSectionTitleClass}>
                Practice Live <span className="text-primary">System Design</span>
              </h2>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Live canvas, voice-driven trade-offs, and senior-level probing—rehearse
                the system design round that wins offers.
              </p>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-6 pt-4">
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Network className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      Interactive Architecture Canvas
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Drag, connect, and design real distributed systems live.
                    </p>
                  </div>
                </div>
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      Voice-Driven Discussion
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Talk through your design as the AI probes your decisions.
                    </p>
                  </div>
                </div>
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      Scalability Trade-offs
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Defend caching, sharding, and consistency choices in depth.
                    </p>
                  </div>
                </div>
                <div className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      Senior-Level Feedback
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-snug text-gray-500">
                      Calibrated to the bar set by top-tier engineering interviews.
                    </p>
                  </div>
                </div>
              </div>

              <div className={stackedFeatureCtaRowClass}>
                <Link href="/ai-system-design" className={stackedFeatureCtaLinkClass}>
                  <Button
                    size="lg"
                    className={cn(
                      stackedFeatureCtaButtonClass,
                      "bg-primary hover:bg-slate-900 text-white font-medium shadow-sm transition-all",
                    )}
                  >
                    Start System Design
                    <ArrowRight className="w-3.5 h-3.5 ml-1 sm:w-4 sm:h-4 sm:ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Animated Preview */}
            <div className="relative flex justify-center shake-vertical lg:order-2 lg:justify-end">
              <SystemDesignHeroPreview />
            </div>
          </div>
        </div>
      </StackedFeatureScroll.Step>
      </StackedFeatureScroll>

      {/* AI Job Search Hero Section */}
      {false && (
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
      )}

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
                <div className="mb-1 text-2xl font-bold tabular-nums text-primary sm:text-3xl lg:text-4xl">
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
                <div className="mb-1 text-2xl font-bold tabular-nums text-primary sm:text-3xl lg:text-4xl">
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
                <div className="mb-1 text-2xl font-bold tabular-nums text-primary sm:text-3xl lg:text-4xl">
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

      {/* Plans Section — hidden on mobile */}
      <div className="hidden sm:block">
        <PlansSection />
      </div>

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
            <div className="mb-4 flex items-center justify-center">
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
            <div className="mb-8 flex flex-row items-stretch justify-center gap-2 sm:mb-10 sm:gap-4">
              <Link href="/sign-up" className="min-w-0 flex-1 sm:flex-initial sm:w-auto">
                <Button
                  size="lg"
                  className="h-11 w-full whitespace-nowrap px-2.5 text-xs font-medium bg-primary-foreground text-primary shadow-lg transition-all hover:bg-primary-foreground/90 hover:shadow-xl sm:h-14 sm:w-auto sm:px-8 sm:text-lg"
                >
                  Start Your Free Trial
                  <ArrowRight className="w-3.5 h-3.5 ml-1 sm:w-5 sm:h-5 sm:ml-2" />
                </Button>
              </Link>
              <Link href="/contact" className="min-w-0 flex-1 sm:flex-initial sm:w-auto">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-11 w-full whitespace-nowrap px-2.5 text-xs font-medium shadow-lg transition-all hover:shadow-xl sm:h-14 sm:w-auto sm:px-8 sm:text-lg"
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
