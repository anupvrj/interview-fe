"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Search,
  Sparkles,
  ArrowRight,
  Menu,
  User,
  Zap,
  Target,
  Rocket,
  Briefcase,
  Brain,
  CheckCircle,
  TrendingUp,
  FileText,
  Mic,
  Settings,
  Trophy,
} from "lucide-react";
import { NavigationMenu } from "@/components/NavigationMenu";
import { AiJobSearchNotifyButton } from "@/components/AiJobSearchNotifyButton";

export default function JobSearchComingSoonPage() {
  // Animated Heading States
  const [headingText, setHeadingText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [headingComplete, setHeadingComplete] = useState(false);
  
  // Job Search Animation States
  const [jobSearchText, setJobSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showJobResults, setShowJobResults] = useState(false);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const jobResultsRef = useRef<HTMLDivElement>(null);
  
  // How It Works Animation States
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  
  // Job Search Animation
  const jobRoles = ["Software Engineer", "Product Manager", "Data Scientist", "Full Stack Developer"];
  
  // Job results mapped to each role
  const jobResultsByRole: Record<string, Array<{ company: string; role: string; score: number; location: string; salary: string }>> = {
    "Software Engineer": [
      { company: "Amazon", role: "Software Engineer", score: 98, location: "Bangalore", salary: "₹25-35L" },
      { company: "TCS", role: "Software Engineer", score: 95, location: "Mumbai", salary: "₹12-18L" },
      { company: "Infosys", role: "Software Engineer", score: 92, location: "Hyderabad", salary: "₹10-16L" },
      { company: "Flipkart", role: "Software Engineer", score: 90, location: "Bangalore", salary: "₹20-30L" },
      { company: "Razorpay", role: "Software Engineer", score: 88, location: "Bangalore", salary: "₹18-28L" },
      { company: "Deloitte", role: "Software Engineer", score: 85, location: "Mumbai", salary: "₹15-22L" },
    ],
    "Product Manager": [
      { company: "Amazon", role: "Product Manager", score: 96, location: "Bangalore", salary: "₹30-45L" },
      { company: "Flipkart", role: "Product Manager", score: 94, location: "Bangalore", salary: "₹28-40L" },
      { company: "Razorpay", role: "Product Manager", score: 92, location: "Bangalore", salary: "₹25-35L" },
      { company: "Deloitte", role: "Product Manager", score: 89, location: "Mumbai", salary: "₹22-32L" },
      { company: "TCS", role: "Product Manager", score: 87, location: "Hyderabad", salary: "₹18-28L" },
    ],
    "Data Scientist": [
      { company: "Amazon", role: "Data Scientist", score: 97, location: "Bangalore", salary: "₹28-42L" },
      { company: "Flipkart", role: "Data Scientist", score: 95, location: "Bangalore", salary: "₹25-38L" },
      { company: "TCS", role: "Data Scientist", score: 93, location: "Mumbai", salary: "₹20-30L" },
      { company: "Infosys", role: "Data Scientist", score: 91, location: "Hyderabad", salary: "₹18-28L" },
      { company: "Deloitte", role: "Data Scientist", score: 88, location: "Mumbai", salary: "₹22-35L" },
    ],
    "Full Stack Developer": [
      { company: "Razorpay", role: "Full Stack Developer", score: 96, location: "Bangalore", salary: "₹22-35L" },
      { company: "Flipkart", role: "Full Stack Developer", score: 94, location: "Bangalore", salary: "₹20-32L" },
      { company: "Amazon", role: "Full Stack Developer", score: 92, location: "Bangalore", salary: "₹24-38L" },
      { company: "TCS", role: "Full Stack Developer", score: 90, location: "Mumbai", salary: "₹15-25L" },
      { company: "Infosys", role: "Full Stack Developer", score: 88, location: "Hyderabad", salary: "₹14-24L" },
    ],
  };
  
  // Get current job results based on the role being searched
  const currentJobResults = jobResultsByRole[jobRoles[currentJobIndex % jobRoles.length]] || jobResultsByRole["Software Engineer"];

  // Animated Heading Effect
  useEffect(() => {
    const fullText = "AI powered job search";
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

    // Cursor blinking animation
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  useEffect(() => {
    let timeout1: NodeJS.Timeout;
    let timeout2: NodeJS.Timeout;
    let timeout3: NodeJS.Timeout;
    let typeInterval: NodeJS.Timeout;
    let scrollInterval: NodeJS.Timeout;

    // Start typing after 1 second
    timeout1 = setTimeout(() => {
      const currentRole = jobRoles[currentJobIndex % jobRoles.length];
      const currentResults = jobResultsByRole[currentRole] || jobResultsByRole["Software Engineer"];
      let typingIndex = 0;
      
      typeInterval = setInterval(() => {
        if (typingIndex < currentRole.length) {
          setJobSearchText(currentRole.substring(0, typingIndex + 1));
          typingIndex++;
        } else {
          clearInterval(typeInterval);
          // Show searching indicator
          setIsSearching(true);
          setShowJobResults(false);
          
          timeout2 = setTimeout(() => {
            setIsSearching(false);
            setShowJobResults(true);
            setScrollPosition(0);
            
            // Auto-scroll through results
            let scrollIndex = 0;
            scrollInterval = setInterval(() => {
              if (jobResultsRef.current && scrollIndex < currentResults.length - 1) {
                const cardHeight = 180; // Approximate height of each job card
                scrollIndex++;
                setScrollPosition(scrollIndex * cardHeight);
              } else {
                clearInterval(scrollInterval);
              }
            }, 2000);
            
            // Reset after showing all results
            timeout3 = setTimeout(() => {
              setJobSearchText("");
              setShowJobResults(false);
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

      {/* AI Job Search Hero Section */}
      <section className="pt-32 sm:pt-40 lg:pt-48 pb-16 sm:pb-20 md:pb-24 lg:pb-28 px-4 sm:px-6 overflow-hidden bg-blue-50 relative">
        {/* Animated Heading */}
        <div className="container mx-auto max-w-7xl relative z-10 mb-12 sm:mb-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6">
              {(() => {
                const fullText = "AI powered job search";
                const searchStart = fullText.indexOf("search");
                const searchEnd = searchStart + "search".length;
                
                return headingText.split('').map((char, index) => {
                  const isSearchChar = index >= searchStart && index < searchEnd;
                  return (
                    <span
                      key={index}
                      className={isSearchChar ? 'text-blue-600' : 'text-slate-900'}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  );
                });
              })()}
              <span 
                className={`inline-block w-0.5 h-[1em] bg-blue-600 ml-1 align-middle ${
                  showCursor ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  transition: 'opacity 0.1s ease-in-out',
                  animation: headingComplete ? 'blink-caret 1s infinite' : 'none'
                }}
              />
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Find your perfect job match with intelligent AI-powered recommendations tailored to your skills and career goals.
            </p>
          </div>
        </div>
        
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
              <Search className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" />
            </div>
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`briefcase-${i}`}
              className="absolute"
              style={{
                left: `${(i * 16) % 100}%`,
                top: `${(i * 22) % 100}%`,
                opacity: 0.07,
                animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <Briefcase className="w-10 h-10 sm:w-14 sm:h-14 text-blue-300" />
            </div>
          ))}
          {[...Array(6)].map((_, i) => (
            <div
              key={`trending-${i}`}
              className="absolute"
              style={{
                left: `${(i * 20) % 100}%`,
                top: `${(i * 15) % 100}%`,
                opacity: 0.06,
                animation: `float-${i % 3} ${8 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`,
              }}
            >
              <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-300" />
            </div>
          ))}
        </div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-700 font-medium text-sm mb-4">
                <Sparkles className="w-3 h-3" />
                <span>Coming Soon</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[43px] font-bold tracking-tight text-slate-900 leading-[1.2] sm:leading-[1.1] lg:leading-[52px] mb-4 sm:mb-6">
                Find Your Dream Job with
                <span className="block text-blue-600">AI-Powered Matching</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
                Get personalized job recommendations based on your skills, experience, and career goals. Our AI matches you with the best opportunities from top companies.
              </p>
              
              {/* Features List */}
              <div className="space-y-3 pt-4 sm:pt-6 px-2 sm:px-0">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">AI-powered job matching with 95%+ accuracy</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">Real-time job alerts from top companies</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">Smart filters by role, location, and salary</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 px-2 sm:px-0">
                <AiJobSearchNotifyButton className="w-full sm:w-auto" />
              </div>
            </div>

            {/* Right Section - Animated Job Search Preview */}
            <div className="relative flex justify-center lg:justify-start order-1 lg:order-2">
              <div className="relative rounded-lg sm:rounded-xl shadow-2xl overflow-hidden bg-white w-full max-w-[600px] sm:max-w-[700px] border-2 sm:border-4 border-blue-100">
                {/* Search Box */}
                <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
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
                      <span className="text-blue-600 text-xs sm:text-sm font-medium">
                        {jobSearchText.length}/{jobRoles[currentJobIndex % jobRoles.length].length}
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Matching Indicator */}
                {isSearching && (
                  <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 bg-blue-200 rounded-full w-3/4 mb-2"></div>
                        <div className="h-2 bg-blue-100 rounded-full w-1/2"></div>
                      </div>
                      <span className="text-xs sm:text-sm text-blue-600 font-medium">Matching...</span>
                    </div>
                  </div>
                )}

                {/* Job Results */}
                {showJobResults && (
                  <div className="p-4 sm:p-6 bg-white max-h-[400px] overflow-hidden relative">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">Best Matches</h3>
                      <span className="text-xs sm:text-sm text-blue-600 font-medium">{currentJobResults.length} results</span>
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
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 hover:border-blue-300 transition-all"
                          style={{
                            animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Briefcase className="w-4 h-4 text-blue-600" />
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
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-blue-200">
                            <div className="flex-1 min-w-[100px]">
                              <div className="w-full text-xs h-8 border border-blue-300 text-blue-600 bg-white rounded-md flex items-center justify-center cursor-default">
                                <FileText className="w-3 h-3 mr-1" />
                                Update Resume
                              </div>
                            </div>
                            <div className="flex-1 min-w-[100px]">
                              <div className="w-full text-xs h-8 border border-blue-300 text-blue-600 bg-white rounded-md flex items-center justify-center cursor-default">
                                <Mic className="w-3 h-3 mr-1" />
                                Practice Interview
                              </div>
                            </div>
                            <div className="flex-1 min-w-[80px]">
                              <div className="w-full text-xs h-8 bg-blue-600 text-white rounded-md flex items-center justify-center cursor-default">
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
              Get matched with your dream job in just 4 simple steps
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
              {/* Step 1 & 2 Combined */}
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
                    <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-3">
                    1
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    Update Resume
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Create resume and set preferences
                  </p>
                </div>
              </div>

              {/* Step 2 (formerly Step 3) */}
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
                    <Search className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-3">
                    2
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    Find Matching Jobs
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    AI matches you with jobs that fit your profile and preferences
                  </p>
                </div>
              </div>

              {/* Step 3 (formerly Step 4) */}
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
                    <Target className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-3">
                    3
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    Practice and Apply
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Practice interviews and apply directly to your best matches
                  </p>
                </div>
              </div>

              {/* Step 4 (formerly Step 5) */}
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
                    <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-3">
                    4
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    Ohoo... Get Hired
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Land your dream job and start your new career journey
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 px-4 sm:px-6 bg-blue-50 relative overflow-hidden">
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
            Find your dream job now
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Join thousands of candidates who are already using AI-powered job matching to land their dream roles
          </p>
          <Link href="/pricing">
            <Button
              size="lg"
              className="text-white font-medium shadow-sm transition-all h-12 px-8 hover:opacity-90 !bg-[rgb(37,99,235)] text-base sm:text-lg"
            >
              Signup Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

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

