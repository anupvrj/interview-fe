"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Sparkles,
  ArrowRight,
  Menu,
  User,
  CheckCircle,
  Zap,
  Target,
  Award,
  Brain,
  Clock,
  MessageSquare,
  TrendingUp,
  BarChart3,
  FileText,
  PlayCircle,
  Star,
  Bot,
  UserCircle,
} from "lucide-react";
import { NavigationMenu } from "@/components/NavigationMenu";
import { MarketingFooter } from "@/components/MarketingFooter";
import Image from "next/image";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";

export default function InterviewCoachPage() {
  // Animated Heading States
  const [headingText, setHeadingText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [headingComplete, setHeadingComplete] = useState(false);
  
  // How It Works Animation States
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  
  // Interview Animation States
  const [currentQuestion, setCurrentQuestion] = useState("Tell me about yourself");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const interviewRef = useRef<HTMLDivElement>(null);
  const animationContainerRef = useRef<HTMLDivElement>(null);

  // Animated Heading Effect
  useEffect(() => {
    const fullText = "AI powered interview coach";
    let currentIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setHeadingText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setHeadingComplete(true);
      }
    }, 100);

    // Cursor blinking animation - keep blinking even after animation completes
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => {
      clearInterval(typeInterval);
      // Don't clear cursor interval - keep it blinking
    };
  }, []);

  // How It Works Section Animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHowItWorksVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (howItWorksRef.current) {
      observer.observe(howItWorksRef.current);
    }

    return () => {
      if (howItWorksRef.current) {
        observer.unobserve(howItWorksRef.current);
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
    let timeouts: NodeJS.Timeout[] = [];

    const runStep = () => {
      const step = steps[stepIndex];
      
      // Show loading state before transition
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

      // After loading delay, show content
      const loadingTimeout = setTimeout(() => {
        if (step.type === "question") {
          setCurrentQuestion(questions[questionIndex]);
          setIsQuestionLoading(false);
          // Scroll to top for question
          setTimeout(() => {
            if (animationContainerRef.current) {
              animationContainerRef.current.scrollTo({
                top: 0,
                behavior: "smooth"
              });
            }
          }, 100);
        } else if (step.type === "recording") {
          setCurrentStep(1);
          setIsLoading(false);
          // Scroll to answer card position
          setTimeout(() => {
            if (animationContainerRef.current) {
              const isSmall = window.innerWidth >= 640;
              animationContainerRef.current.scrollTo({
                top: isSmall ? 75 : 70,
                behavior: "smooth"
              });
            }
          }, 100);
        } else if (step.type === "feedback") {
          setShowFeedback(true);
          setCurrentStep(2);
          setIsLoading(false);
          // Scroll to feedback card position
          setTimeout(() => {
            if (animationContainerRef.current) {
              const isSmall = window.innerWidth >= 640;
              animationContainerRef.current.scrollTo({
                top: isSmall ? 165 : 155,
                behavior: "smooth"
              });
            }
          }, 100);
        } else if (step.type === "score") {
          setShowScore(true);
          setCurrentStep(3);
          setIsLoading(false);
          // Scroll to score card position
          setTimeout(() => {
            if (animationContainerRef.current) {
              const isSmall = window.innerWidth >= 640;
              animationContainerRef.current.scrollTo({
                top: isSmall ? 240 : 225,
                behavior: "smooth"
              });
            }
          }, 100);
        }
      }, step.loadingDelay);

      timeouts.push(loadingTimeout);

      // Move to next step
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
      timeouts.forEach(timeout => clearTimeout(timeout));
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
                  className="flex items-center hover:opacity-80 transition-opacity mx-auto sm:mx-0"
                >
                  <InterviewTrixLogo
                    className="h-7 sm:h-8 lg:h-10 w-auto"
                    priority
                  />
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

      {/* Top Heading Section */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 relative overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%)'
          }}
        ></div>
        {/* Animated Background Icons */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {[...Array(8)].map((_, i) => {
            const positions = [
              { left: '5%', top: '10%' },
              { left: '25%', top: '5%' },
              { left: '45%', top: '15%' },
              { left: '65%', top: '8%' },
              { left: '85%', top: '12%' },
              { left: '15%', top: '25%' },
              { left: '55%', top: '30%' },
              { left: '75%', top: '22%' },
            ];
            return (
              <div
                key={`mic-${i}`}
                className="absolute opacity-20"
                style={{
                  left: positions[i].left,
                  top: positions[i].top,
                  animation: `float-${i % 3} ${5 + (i % 3) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              >
                <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            );
          })}
          {[...Array(8)].map((_, i) => {
            const positions = [
              { left: '10%', top: '50%' },
              { left: '30%', top: '45%' },
              { left: '50%', top: '55%' },
              { left: '70%', top: '48%' },
              { left: '90%', top: '52%' },
              { left: '20%', top: '65%' },
              { left: '60%', top: '70%' },
              { left: '80%', top: '62%' },
            ];
            return (
              <div
                key={`brain-${i}`}
                className="absolute opacity-20"
                style={{
                  left: positions[i].left,
                  top: positions[i].top,
                  animation: `float-${i % 3} ${6 + (i % 2) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                }}
              >
                <Brain className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
              </div>
            );
          })}
          {[...Array(6)].map((_, i) => {
            const positions = [
              { left: '8%', top: '35%' },
              { left: '35%', top: '28%' },
              { left: '62%', top: '38%' },
              { left: '88%', top: '32%' },
              { left: '18%', top: '80%' },
              { left: '72%', top: '85%' },
            ];
            return (
              <div
                key={`message-${i}`}
                className="absolute opacity-20"
                style={{
                  left: positions[i].left,
                  top: positions[i].top,
                  animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            );
          })}
        </div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium text-sm mb-6 border border-white/30">
              <Sparkles className="w-3 h-3" />
              <span>AI Interview Coach</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight">
              {(() => {
                const fullText = "AI powered interview coach";
                const coachStart = fullText.indexOf("coach");
                const coachEnd = coachStart + 5;
                const beforeCoach = headingText.substring(0, Math.min(coachStart, headingText.length));
                const coachPart = headingText.length > coachStart ? headingText.substring(coachStart) : '';
                
                return (
                  <>
                    <span className="block sm:inline">
                      {beforeCoach.split('').map((char, index) => (
                        <span key={index} className="text-white">
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      ))}
                    </span>
                    <span className="block sm:inline">
                      {coachPart.split('').map((char, index) => {
                        const isCoachChar = index < 5;
                        return (
                          <span
                            key={index}
                            className={isCoachChar ? 'text-white/95' : 'text-white'}
                          >
                            {char === ' ' ? '\u00A0' : char}
                          </span>
                        );
                      })}
                      {headingText.length >= fullText.length && (
                        <span 
                          className={`inline-block w-0.5 h-[1em] bg-white ml-1 align-middle ${
                            showCursor ? 'opacity-100' : 'opacity-0'
                          }`}
                          style={{
                            transition: 'opacity 0.1s ease-in-out',
                            animation: headingComplete ? 'blink-caret 1s infinite' : 'none'
                          }}
                        />
                      )}
                    </span>
                  </>
                );
              })()}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Practice real interviews with AI-powered mock interviews. Get instant feedback on your communication, confidence, and answers — before the real interview happens.
            </p>
          </div>
        </div>
      </section>

      {/* Interview Coach Hero Section */}
      <section className="pt-16 sm:pt-20 lg:pt-24 pb-16 sm:pb-20 md:pb-24 lg:pb-28 px-4 sm:px-6 overflow-hidden bg-blue-50 relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${(i * 15) % 100}%`,
                top: `${(i * 20) % 100}%`,
                opacity: 0.09,
                animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <Mic className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" />
            </div>
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`brain-${i}`}
              className="absolute"
              style={{
                left: `${(i * 12 + 5) % 100}%`,
                top: `${(i * 18 + 10) % 100}%`,
                opacity: 0.07,
                animation: `float-${(i + 1) % 3} ${7 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`,
              }}
            >
              <Brain className="w-10 h-10 sm:w-14 sm:h-14 text-blue-400" />
            </div>
          ))}
          {[...Array(6)].map((_, i) => (
            <div
              key={`message-${i}`}
              className="absolute"
              style={{
                left: `${(i * 16) % 100}%`,
                top: `${(i * 22) % 100}%`,
                opacity: 0.06,
                animation: `float-${i % 3} ${8 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.6}s`,
              }}
            >
              <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-300" />
            </div>
          ))}
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Section - Marketing Content */}
            <div className="text-center lg:text-left space-y-6 relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight mb-4 sm:mb-6">
                Master Your Interview Skills
              </h2>

              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
                Practice real interviews with AI-powered mock interviews. Get instant feedback on your communication, confidence, and answers — before the real interview happens.
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
                <Link href="/dashboard/interviews/new" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base px-5 sm:px-6 py-4 sm:py-5 h-auto shadow-lg hover:shadow-xl transition-all"
                  >
                    Start Free Interview
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

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="py-16 sm:py-20 md:py-24 lg:py-28 px-4 sm:px-6 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className={`text-center mb-12 sm:mb-16 transition-all duration-700 ${
            howItWorksVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Ace your interview in just 4 simple steps
            </p>
          </div>

          <div className="relative">
            {/* Connection Line - Desktop Only */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-2 bg-blue-200 transform -translate-y-1/2 overflow-hidden rounded-full" style={{ top: '50%' }}>
              <div 
                className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full absolute"
                style={{
                  animation: howItWorksVisible ? 'lineProgress 6s ease-in-out 0.5s infinite' : 'none',
                  boxShadow: howItWorksVisible ? '0 0 12px rgba(59, 130, 246, 0.6)' : 'none'
                }}
              ></div>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative z-10">
              {/* Step 1 */}
              <div className={`bg-white rounded-2xl p-4 sm:p-5 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300 ${
                howItWorksVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{
                transitionDelay: howItWorksVisible ? '0.1s' : '0s',
                transitionDuration: '0.6s',
                transitionTimingFunction: 'ease-out'
              }}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                    <PlayCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-3">
                    1
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    Start Interview
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Choose your role, company, and interview type
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`bg-white rounded-2xl p-4 sm:p-5 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300 ${
                howItWorksVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{
                transitionDelay: howItWorksVisible ? '0.2s' : '0s',
                transitionDuration: '0.6s',
                transitionTimingFunction: 'ease-out'
              }}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                    <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-3">
                    2
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    Answer Questions
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Respond to AI-generated questions naturally
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className={`bg-white rounded-2xl p-4 sm:p-5 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300 ${
                howItWorksVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{
                transitionDelay: howItWorksVisible ? '0.3s' : '0s',
                transitionDuration: '0.6s',
                transitionTimingFunction: 'ease-out'
              }}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                    <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-3">
                    3
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    Get Feedback
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Receive instant AI analysis and improvement tips
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className={`bg-white rounded-2xl p-4 sm:p-5 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300 ${
                howItWorksVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{
                transitionDelay: howItWorksVisible ? '0.4s' : '0s',
                transitionDuration: '0.6s',
                transitionTimingFunction: 'ease-out'
              }}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                    <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-3">
                    4
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    Track Progress
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Monitor improvement over time with detailed reports
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Interview Preview Section */}
      <section ref={interviewRef} className="py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 bg-blue-50/30 relative overflow-hidden">
        {/* Animated Background Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${(i * 15) % 100}%`,
                top: `${(i * 20) % 100}%`,
                opacity: 0.09,
                animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              {i % 3 === 0 ? (
                <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
              ) : i % 3 === 1 ? (
                <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
              ) : (
                <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
              )}
            </div>
          ))}
          {[...Array(4)].map((_, i) => (
            <div
              key={`secondary-${i}`}
              className="absolute"
              style={{
                left: `${(i * 18) % 100}%`,
                top: `${(i * 25) % 100}%`,
                opacity: 0.07,
                animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`,
              }}
            >
              {i % 2 === 0 ? (
                <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-blue-300" />
              ) : (
                <UserCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-300" />
              )}
            </div>
          ))}
        </div>
        <div className="container mx-auto max-w-7xl relative z-10">
          {/* Section Heading */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-2 sm:mb-3">
              See It In Action
            </h2>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Watch how our AI-powered interview coach guides you through real interview scenarios with instant feedback and detailed analysis.
            </p>
          </div>

          {/* Animation Card Container */}
          <div className="w-full">
            <div className="relative bg-white w-full shadow-2xl overflow-hidden border sm:border-2 md:border-4 border-blue-100 rounded-lg sm:rounded-xl">
              <div className="grid md:grid-cols-2">
                {/* Left Side - Image */}
                <div className="relative w-full bg-white flex items-center justify-center p-4 sm:p-5 md:p-6">
                  <div className="relative w-full flex items-center justify-center rounded-lg overflow-hidden">
                    <Image
                      src="/image-candidate-ai-interview.jpg"
                      alt="AI Interview in Progress"
                      width={700}
                      height={444}
                      className="object-contain rounded-lg w-full h-auto"
                      priority
                      unoptimized
                      style={{ objectPosition: "center" }}
                    />
                  </div>
                  {/* Overlay Badge */}
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1.5 text-xs sm:text-sm font-semibold z-10">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Live Interview
                  </div>
                </div>
                
                {/* Right Side - Animation */}
                <div className="p-3 sm:p-4 md:p-5 flex items-center bg-white">
                  <div 
                    ref={animationContainerRef}
                    className="relative w-full min-h-[350px] sm:min-h-[400px] md:min-h-[395px] overflow-y-auto scroll-smooth"
                    style={{ scrollBehavior: "smooth" }}
                  >
                    {/* Question Section - Always visible */}
                    <div className="absolute top-0 left-0 right-0 transition-all duration-500 ease-in-out">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-2 pt-3 border border-blue-200/50 shadow-lg shadow-blue-500/10 fade-in shimmer-effect backdrop-blur-sm">
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* AI Avatar */}
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
                            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">AI Interviewer</div>
                            {isQuestionLoading ? (
                              <div className="space-y-2">
                                <div className="skeleton skeleton-text skeleton-text-medium"></div>
                                <div className="skeleton skeleton-text skeleton-text-short"></div>
                              </div>
                            ) : (
                              <div className="text-xs sm:text-sm text-gray-800 font-medium leading-relaxed fade-in">
                                {currentQuestion || "Tell me about yourself"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Answer Section - Positioned below question */}
                    <div className={`absolute top-[70px] sm:top-[75px] left-0 right-0 transition-all duration-500 ease-in-out ${currentStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                      <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-2 pt-3 border border-slate-200/60 shadow-lg shadow-slate-500/10 fade-in shimmer-effect backdrop-blur-sm">
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Person Avatar */}
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-slate-500/30 ring-2 ring-slate-200/50">
                            <UserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs sm:text-sm font-bold text-slate-700 mb-1.5">You</div>
                            {isLoading && currentStep < 1 ? (
                              <div className="space-y-2">
                                <div className="skeleton skeleton-text skeleton-text-long"></div>
                                <div className="skeleton skeleton-text skeleton-text-medium"></div>
                              </div>
                            ) : currentStep === 1 ? (
                              <div className="text-xs sm:text-sm text-slate-600 italic font-medium fade-in flex items-center gap-2">
                                Speaking... <span className="inline-block w-2 h-4 bg-[rgb(37,99,235)] rounded-sm ml-1 animate-pulse"></span>
                              </div>
                            ) : currentStep >= 2 ? (
                              <div className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed fade-in">
                                I am a software engineer with 5+ years of experience in building scalable web applications...
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Feedback Section - Positioned below answer */}
                    <div className={`absolute top-[155px] sm:top-[165px] left-0 right-0 transition-all duration-500 ease-in-out ${showFeedback ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-xl p-2 pt-3 border border-emerald-200/50 shadow-lg shadow-emerald-500/10 fade-in shimmer-effect backdrop-blur-sm">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-200/50">
                            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs sm:text-sm font-bold text-emerald-700 mb-1.5">AI Feedback</div>
                            {isLoading && !showFeedback ? (
                              <div className="space-y-2">
                                <div className="skeleton skeleton-text skeleton-text-medium"></div>
                                <div className="skeleton skeleton-text skeleton-text-short"></div>
                              </div>
                            ) : (
                              <div className="text-xs sm:text-sm text-emerald-900 font-medium leading-relaxed fade-in">
                                Good structure. Consider adding specific examples of your achievements.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score Section - Positioned below feedback */}
                    <div className={`absolute top-[225px] sm:top-[240px] left-0 right-0 transition-all duration-500 ease-in-out ${showScore ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                      <div className="bg-gradient-to-br from-blue-50 to-[rgb(37,99,235)]/5 rounded-xl p-2 pt-3 border border-blue-200/50 shadow-lg shadow-blue-500/10 fade-in shimmer-effect backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">Overall Score</div>
                            {isLoading && !showScore ? (
                              <div className="space-y-2">
                                <div className="skeleton skeleton-text skeleton-text-short w-12"></div>
                              </div>
                            ) : (
                              <div className="text-2xl sm:text-3xl font-bold text-[rgb(37,99,235)] fade-in">85%</div>
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
                                <div className="text-xs sm:text-sm text-slate-600 font-medium fade-in">Confidence: 88%</div>
                                <div className="text-xs sm:text-sm text-slate-600 font-medium fade-in">Clarity: 82%</div>
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
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 px-4 sm:px-6 bg-blue-50 relative overflow-hidden">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Why Choose Our AI Interview Coach?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to ace your next interview
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Mic className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Realistic Interviews</h3>
              <p className="text-gray-600">
                Practice with AI-powered interviews that feel like real conversations with adaptive follow-ups
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Analysis</h3>
              <p className="text-gray-600">
                Get detailed feedback on confidence, clarity, filler words, and answer structure in real-time
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Company-Specific Prep</h3>
              <p className="text-gray-600">
                Practice with questions from TCS, Infosys, Wipro, Amazon, and 50+ top companies
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Progress Tracking</h3>
              <p className="text-gray-600">
                Monitor your improvement over time with visual dashboards and performance metrics
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Reports</h3>
              <p className="text-gray-600">
                Receive detailed interview reports with transcripts, scores, and action items within minutes
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Multi-Language Support</h3>
              <p className="text-gray-600">
                Practice in English, Hindi, or mixed language scenarios for real-world interviews
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 px-4 sm:px-6 bg-gray-50 relative overflow-hidden">
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Join thousands of professionals who have improved their interview skills with our AI-powered coach
          </p>
          <Link href="/dashboard/interviews/new">
            <Button
              size="lg"
              className="text-white font-medium shadow-sm transition-all h-12 px-8 hover:opacity-90 !bg-[rgb(37,99,235)] text-base sm:text-lg"
            >
              Start Your Free Interview
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <MarketingFooter />
      </div>
    </>
  );
}

