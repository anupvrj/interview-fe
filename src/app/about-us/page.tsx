"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Mic,
  TrendingUp,
  Award,
  Brain,
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
  Menu,
  User,
  Target,
  Rocket,
  CheckCircle,
  Lightbulb,
  Search,
} from "lucide-react";
import { NavigationMenu } from "@/components/NavigationMenu";
import { ScrollSection } from "@/components/ScrollSection";

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

      {/* About Us Hero Section */}
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
          {[...Array(6)].map((_, i) => {
            const positions = [
              { left: '15%', top: '20%' },
              { left: '40%', top: '12%' },
              { left: '68%', top: '18%' },
              { left: '92%', top: '25%' },
              { left: '12%', top: '75%' },
              { left: '58%', top: '78%' },
            ];
            return (
              <div
                key={`sparkles-${i}`}
                className="absolute opacity-15"
                style={{
                  left: positions[i].left,
                  top: positions[i].top,
                  animation: `float-${i % 3} ${5 + (i % 3) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.35}s`,
                }}
              >
                <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
            );
          })}
        </div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium text-sm mb-6 border border-white/30">
              <Sparkles className="w-3 h-3" />
              <span>About Us</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Empowering Careers Through
              <span className="block text-white/95">AI-Powered Interview Prep</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              We're on a mission to help millions of job seekers in India ace their interviews and land their dream jobs. Our AI-powered platform combines cutting-edge technology with personalized feedback to transform interview preparation.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <ScrollSection
        id="what-we-do"
        className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50 scroll-mt-20"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              What We Do
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              We provide comprehensive interview preparation tools to help you succeed
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Mic className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                AI Mock Interviews
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Practice with AI-powered interviews that adapt to your responses, providing realistic interview scenarios and personalized feedback.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Resume Builder
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Create ATS-optimized resumes with professional templates designed to pass applicant tracking systems and impress recruiters.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Performance Analytics
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Track your progress with detailed analytics, identify weak areas, and measure improvement over time with actionable insights.
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 font-medium text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Our Products</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              Three Powerful Tools.
              <span className="block text-blue-600">One Complete Platform.</span>
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need to land your dream job, all in one place
            </p>
          </div>

          {/* Product Cards */}
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {/* Mock Interview Product */}
            <div 
              className="group relative bg-white rounded-3xl p-8 sm:p-10 border-2 border-gray-200 hover:border-blue-300 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              style={{
                animation: 'fadeInUp 0.6s ease-out 0.1s both'
              }}
            >
              {/* Decorative Background Gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-50 blur-3xl -z-0 group-hover:opacity-70 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                  <Mic className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                  Mock Interview
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6 text-base">
                  Practice with AI-powered interviews that adapt to your responses. Get real-time feedback on your communication skills, confidence levels, and technical answers.
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Real-time AI feedback</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Company-specific questions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Multi-language support</span>
                  </li>
                </ul>

                {/* CTA Button */}
                <Link href="/dashboard/interviews/new">
                  <Button
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all h-12"
                  >
                    Try Mock Interview
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
                  Create ATS-optimized resumes with professional templates. Designed to pass applicant tracking systems and impress recruiters at top companies.
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">ATS-optimized templates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Multiple design options</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Real-time preview</span>
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
                  Find the perfect job matches using AI-powered search. Get personalized job recommendations based on your skills, experience, and career goals.
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">AI-powered matching</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Personalized recommendations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Real-time job alerts</span>
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
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 bg-white scroll-mt-20"
      >
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 font-medium text-sm mb-6">
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
              className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{
                animation: 'fadeInUp 0.6s ease-out 0.1s both',
                background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%)'
              }}
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-white/30">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">The Problem</h3>
              <p className="text-white/90 leading-relaxed">
                After witnessing countless talented candidates struggle in interviews, we realized that the gap wasn't in their skills or knowledge—it was in their preparation. Traditional interview prep methods were expensive, time-consuming, and often didn't reflect real interview scenarios.
              </p>
            </div>

            <div 
              className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{
                animation: 'fadeInUp 0.6s ease-out 0.2s both',
                background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%)'
              }}
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-white/30">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Our Solution</h3>
              <p className="text-white/90 leading-relaxed">
                We set out to build an AI-powered platform that would democratize interview preparation. By combining advanced AI technology with insights from real interviews at top companies, we created a solution that's accessible, affordable, and effective for everyone.
              </p>
            </div>

            <div 
              className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{
                animation: 'fadeInUp 0.6s ease-out 0.3s both',
                background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%)'
              }}
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-white/30">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
              <p className="text-white/90 leading-relaxed">
                Today, Interview Trix has helped thousands of candidates prepare for their dream jobs. We're committed to making interview preparation accessible to everyone, regardless of their background or financial situation.
              </p>
            </div>
          </div>

          {/* Horizontal Timeline - Enhanced with Animation */}
          <div ref={timelineRef} className="relative">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-3xl p-8 sm:p-12 lg:p-16 border border-blue-100 relative overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full opacity-10 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200 rounded-full opacity-10 blur-3xl"></div>
              
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
                      <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
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
                      <Award className="w-5 h-5 sm:w-7 sm:h-7 text-blue-400" />
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
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-300" />
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
                    className="hidden md:block absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 rounded-full transform -translate-y-1/2 transition-all duration-1000 ease-out shadow-lg"
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
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 md:scale-110 scale-100' 
                          : 'bg-gray-300 scale-100'
                      }`}>
                        <Lightbulb className="w-8 h-8 text-white" />
                      </div>
                      <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-md hover:shadow-lg transition-all w-full">
                        <p className="font-bold text-slate-900 mb-2 text-lg">2023</p>
                        <p className="font-semibold text-blue-600 mb-2">The Beginning</p>
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
        className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-blue-50/30 relative overflow-hidden"
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
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
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
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-blue-300 fill-blue-300" />
            </div>
          ))}
        </div>
        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4">
              Trusted by over a thousand users
            </h2>
            <p className="text-lg sm:text-xl text-blue-600 mb-4 sm:mb-6">
              Our users love us and so will you. Here's what they are saying.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-base sm:text-lg text-blue-600 font-medium text-center sm:text-left">
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
                          <p className="text-xs sm:text-sm text-blue-600">App Security at JPMorgan Chase</p>
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
                          <p className="text-xs sm:text-sm text-blue-600">Online Business Manager</p>
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
                          <p className="text-xs sm:text-sm text-blue-600">Estate Agent at DBRealty</p>
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
                          <p className="text-xs sm:text-sm text-blue-600">Online Business Manager</p>
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
                          <p className="text-xs sm:text-sm text-blue-600">Estate Agent at DBRealty</p>
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
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          RK
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">Rajesh Kumar</p>
                          <p className="text-xs sm:text-sm text-blue-600">Software Engineer at TCS</p>
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
                          <p className="text-xs sm:text-sm text-blue-600">Product Manager at Infosys</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        The AI mock interviews are incredibly realistic. I practiced for my Infosys interview and felt so much more confident. The behavioral analysis helped me identify areas I didn't even know needed improvement.
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
                          <p className="text-xs sm:text-sm text-blue-600">Data Scientist at Wipro</p>
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
                          <p className="text-xs sm:text-sm text-blue-600">Product Manager at Infosys</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                        The AI mock interviews are incredibly realistic. I practiced for my Infosys interview and felt so much more confident. The behavioral analysis helped me identify areas I didn't even know needed improvement.
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
                          <p className="text-xs sm:text-sm text-blue-600">Data Scientist at Wipro</p>
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
                          <p className="text-xs sm:text-sm text-blue-600">Frontend Developer at Razorpay</p>
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
                          <p className="text-xs sm:text-sm text-blue-600">Backend Engineer at Flipkart</p>
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
                          <p className="text-xs sm:text-sm text-blue-600">QA Engineer at Deloitte</p>
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
                          <p className="text-xs sm:text-sm text-blue-600">Backend Engineer at Flipkart</p>
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
                          <p className="text-xs sm:text-sm text-blue-600">QA Engineer at Deloitte</p>
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
                        ? "w-8 bg-blue-600"
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

      {/* Footer Section */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 bg-slate-900">
        <div className="container mx-auto max-w-6xl">
          {/* Footer Content */}
          <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">i<span className="text-sm">X</span></span>
              </div>
              <span className="text-xl font-bold text-white">
                Interview <span className="text-blue-400">Tri<span className="text-2xl">X</span></span>
              </span>
            </div>
            <nav className="flex flex-wrap items-center justify-center md:justify-end gap-4 sm:gap-6">
              <Link href="/about-us" className="text-sm text-gray-300 hover:text-white transition-colors">
                About us
              </Link>
              <Link href="/terms" className="text-sm text-gray-300 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/refund" className="text-sm text-gray-300 hover:text-white transition-colors">
                Refund policy
              </Link>
              <Link href="/contact" className="text-sm text-gray-300 hover:text-white transition-colors">
                Contact us
              </Link>
            </nav>
          </div>
          {/* Copyright */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 text-center">
              © 2026 Interview Trix. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

