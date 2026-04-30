"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  Award,
  Settings,
  Download,
  Eye,
  Palette,
  FileCheck,
  Brain,
  GripVertical,
  TrendingUp,
  Save,
  Search,
  RotateCcw,
  Star,
  Upload as UploadIcon,
  FileUp,
  AlertCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import Image from "next/image";
import { TEMPLATES_CATALOG } from "@/configs/resume-templates/templates-catalog";

export default function ResumeBuilderPage() {
  // Animated Heading States
  const [headingText, setHeadingText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [headingComplete, setHeadingComplete] = useState(false);
  
  // How It Works Animation States
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  
  // Template Carousel States
  const [currentTemplateSlide, setCurrentTemplateSlide] = useState(0);
  const templateCarouselViewportRef = useRef<HTMLDivElement>(null);
  const [templateCarouselWidth, setTemplateCarouselWidth] = useState(0);
  
  // Resume Builder Animation States
  const [resumeText, setResumeText] = useState("");
  const [isAIEnhancing, setIsAIEnhancing] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [showReadyResume, setShowReadyResume] = useState(false);
  const [atsScore, setAtsScore] = useState(0);
  const [showDownload, setShowDownload] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const resumeBuilderRef = useRef<HTMLDivElement>(null);
  const [isBelowSm, setIsBelowSm] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsBelowSm(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const el = templateCarouselViewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setTemplateCarouselWidth(el.getBoundingClientRect().width);
    });
    ro.observe(el);
    setTemplateCarouselWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const step = isBelowSm ? 3 : 5;
    setCurrentTemplateSlide((s) => {
      const n = Math.floor(s / step) * step;
      return n >= TEMPLATES_CATALOG.length ? 0 : n;
    });
  }, [isBelowSm]);

  // Animated Heading Effect
  useEffect(() => {
    const fullText = "Smart ATS resume builder";
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

  // Resume Builder Animation
  useEffect(() => {
    let timeout1: NodeJS.Timeout;
    let timeout2: NodeJS.Timeout;
    let timeout3: NodeJS.Timeout;
    let timeout4: NodeJS.Timeout;
    let timeout5: NodeJS.Timeout;
    let timeout6: NodeJS.Timeout;
    let timeout7: NodeJS.Timeout;
    let timeout8: NodeJS.Timeout;
    let scoreInterval: NodeJS.Timeout;

    const resumeContent = "Experienced software engineer with 5+ years developing scalable web applications. Proficient in React, Node.js, and cloud technologies. Led teams of 5+ developers and delivered projects worth $2M+ in revenue.";

    const runAnimation = () => {
      // Reset
      setResumeText("");
      setIsAIEnhancing(false);
      setShowSkills(false);
      setShowProjects(false);
      setShowEducation(false);
      setShowReadyResume(false);
      setAtsScore(0);
      setShowDownload(false);
      setCurrentStep(0);

      // Step 1: Show professional summary instantly (no typing)
      timeout1 = setTimeout(() => {
        setCurrentStep(1);
        setResumeText(resumeContent);
        // Step 2: AI Enhancing
        timeout2 = setTimeout(() => {
          setCurrentStep(2);
          setResumeText("");
          setIsAIEnhancing(true);
          // Step 3: Skills editing
          timeout3 = setTimeout(() => {
            setCurrentStep(3);
            setIsAIEnhancing(false);
            setShowSkills(true);
            // Step 4: Add Projects
            timeout4 = setTimeout(() => {
              setCurrentStep(4);
              setShowSkills(false);
              setShowProjects(true);
              // Step 5: Education section
              timeout5 = setTimeout(() => {
                setCurrentStep(5);
                setShowProjects(false);
                setShowEducation(true);
                // Step 6: Show ready resume image
                timeout6 = setTimeout(() => {
                  setCurrentStep(6);
                  setShowEducation(false);
                  setShowReadyResume(true);
                  // Step 7: ATS Score animation (quickly)
                  timeout7 = setTimeout(() => {
                    setCurrentStep(7);
                    setShowReadyResume(false);
                    let score = 0;
                    scoreInterval = setInterval(() => {
                      if (score < 85) {
                        score += 4;
                        setAtsScore(score);
                      } else {
                        clearInterval(scoreInterval);
                        setAtsScore(85);
                        // Step 8: Download animation
                        timeout8 = setTimeout(() => {
                          setCurrentStep(8);
                          setAtsScore(0);
                          setShowDownload(true);
                          // Reset and restart after download
                          setTimeout(() => {
                            runAnimation();
                          }, 2500);
                        }, 1500);
                      }
                    }, 30);
                  }, 1000);
                }, 3000);
              }, 3000);
            }, 2500);
          }, 2000);
        }, 1000);
      }, 1000);
    };

    runAnimation();

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
      clearTimeout(timeout5);
      clearTimeout(timeout6);
      clearTimeout(timeout7);
      clearTimeout(timeout8);
      clearInterval(scoreInterval);
    };
  }, []);

  // Template Carousel Auto-Slide — 3 per view on mobile, 5 on sm+
  useEffect(() => {
    const totalTemplates = TEMPLATES_CATALOG.length;
    const step = isBelowSm ? 3 : 5;
    const interval = setInterval(() => {
      setCurrentTemplateSlide((prev) => {
        const nextSlide = prev + step;
        if (nextSlide >= totalTemplates) {
          return 0;
        }
        return nextSlide;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isBelowSm]);

  const templateCarouselTemplatesPerPage = isBelowSm ? 3 : 5;
  const templateCarouselSlideOffsetPx =
    templateCarouselWidth > 0
      ? (currentTemplateSlide / templateCarouselTemplatesPerPage) * templateCarouselWidth
      : 0;

  return (
    <div className="min-h-screen bg-white scroll-smooth selection:bg-blue-100">
      <SiteHeader />

      {/* Resume Builder Hero Section - Top */}
      <section className="pt-32 sm:pt-40 lg:pt-48 pb-12 sm:pb-16 px-4 sm:px-6 overflow-hidden relative">
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
                key={`filetext-${i}`}
                className="absolute opacity-20"
                style={{
                  left: positions[i].left,
                  top: positions[i].top,
                  animation: `float-${i % 3} ${5 + (i % 3) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              >
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
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
                key={`palette-${i}`}
                className="absolute opacity-20"
                style={{
                  left: positions[i].left,
                  top: positions[i].top,
                  animation: `float-${i % 3} ${6 + (i % 2) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                }}
              >
                <Palette className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
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
                key={`filecheck-${i}`}
                className="absolute opacity-20"
                style={{
                  left: positions[i].left,
                  top: positions[i].top,
                  animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                <FileCheck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            );
          })}
        </div>

        {/* Animated Heading */}
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium text-sm mb-6 border border-white/30">
              <Sparkles className="w-3 h-3" />
              <span>AI Resume Builder</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6 max-sm:break-words max-sm:min-h-[5.1rem]">
              {(() => {
                const fullText = "Smart ATS resume builder";
                const builderStart = fullText.indexOf("builder");
                const builderEnd = builderStart + "builder".length;
                const spaceChar = isBelowSm ? " " : "\u00A0";

                return headingText.split("").map((char, index) => {
                  const isBuilderChar =
                    index >= builderStart && index < builderEnd;
                  return (
                    <span
                      key={index}
                      className={isBuilderChar ? "text-white/95" : "text-white"}
                    >
                      {char === " " ? spaceChar : char}
                    </span>
                  );
                });
              })()}
              <span 
                className={`inline-block w-0.5 h-[1em] bg-white ml-1 align-middle ${
                  showCursor ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  transition: 'opacity 0.1s ease-in-out',
                  animation: headingComplete ? 'blink-caret 1s infinite' : 'none'
                }}
              />
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Real-time resume analysis, instant improvements, and a Smart ATS Score—ATS-optimized templates so you pass the bots and reach recruiters.
            </p>
          </div>
        </div>
      </section>

      {/* Two Column Section */}
      <section className="py-16 sm:py-20 md:pb-24 lg:pb-28 px-4 sm:px-6 overflow-hidden bg-blue-50 relative">
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
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" />
            </div>
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`palette-bg-${i}`}
              className="absolute"
              style={{
                left: `${(i * 16) % 100}%`,
                top: `${(i * 22) % 100}%`,
                opacity: 0.07,
                animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <Palette className="w-10 h-10 sm:w-14 sm:h-14 text-blue-300" />
            </div>
          ))}
          {[...Array(6)].map((_, i) => (
            <div
              key={`check-bg-${i}`}
              className="absolute"
              style={{
                left: `${(i * 20) % 100}%`,
                top: `${(i * 15) % 100}%`,
                opacity: 0.06,
                animation: `float-${i % 3} ${8 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`,
              }}
            >
              <FileCheck className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-300" />
            </div>
          ))}
        </div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-700 font-medium text-sm mb-4">
                <Sparkles className="w-3 h-3" />
                <span>ATS-Optimized Templates</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[43px] font-bold tracking-tight text-slate-900 leading-[1.2] sm:leading-[1.1] lg:leading-[52px] mb-4 sm:mb-6">
                Pass the Bots With a Stronger Resume
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
                Fresher or pro—our model analyzes your resume in real time, suggests instant improvements, and shows your Smart ATS Score so you escape the ATS black hole.
              </p>
              
              {/* Features List */}
              <div className="space-y-3 pt-4 sm:pt-6 px-2 sm:px-0">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">ATS-optimized templates and parsing-friendly layouts</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">Real-time suggestions and Smart ATS Score</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">Export when you&apos;re ready—PDF, Word, and more</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 px-2 sm:px-0">
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

            {/* Right Section - Resume Builder Widget */}
            <div className="relative flex justify-center lg:justify-start order-1 lg:order-2">
              <div className="relative rounded-lg sm:rounded-xl shadow-2xl overflow-hidden bg-white w-full max-w-[600px] sm:max-w-[700px] border-2 sm:border-4 border-blue-100">
                {/* Resume Builder Header */}
                <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Resume Builder</h3>
                    {showDownload && (
                      <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Ready
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={resumeText ? "Professional Summary" : ""}
                      readOnly
                      placeholder="Building your resume..."
                      className="flex-1 outline-none text-xs sm:text-sm text-gray-700 bg-transparent"
                    />
                  </div>
                </div>

                {/* Resume Content Preview */}
                <div className="p-4 sm:p-6 bg-white max-h-[400px] overflow-y-auto relative">
                  <div className="space-y-4 h-[300px] relative flex items-center justify-center">
                    {/* ATS Score Display - Step 7 */}
                    {currentStep === 7 && (
                      <div className="w-full animate-fadeInUp" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
                        <div className="w-full max-w-md mx-auto p-6 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-green-600" />
                              <span className="text-sm sm:text-base font-semibold text-green-900">ATS Score</span>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-green-700">{atsScore}%</span>
                          </div>
                          <div className="w-full bg-green-200 rounded-full h-3 mb-3">
                            <div 
                              className="bg-green-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${atsScore}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-green-700 text-center">Excellent! Your resume is ATS-optimized.</p>
                        </div>
                      </div>
                    )}

                    {/* Empty State - Show ATS Score by default */}
                    {currentStep !== 7 && (
                      <div className="w-full animate-fadeInUp">
                        <div className="w-full max-w-md mx-auto p-6 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-green-600" />
                              <span className="text-sm sm:text-base font-semibold text-green-900">ATS Score</span>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-green-700">85%</span>
                          </div>
                          <div className="w-full bg-green-200 rounded-full h-3 mb-3">
                            <div 
                              className="bg-green-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: '85%' }}
                            ></div>
                          </div>
                          <p className="text-sm text-green-700 text-center">Excellent! Your resume is ATS-optimized.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Templates Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 px-4 sm:px-6 bg-gray-50 relative overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              ATS-ready templates.<br />
              Build and improve in real time.
            </h2>
          </div>

          {/* Template Carousel - Multiple Templates Visible */}
          <div className="relative">
            <div ref={templateCarouselViewportRef} className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-in-out gap-2 sm:gap-3"
                style={{
                  transform: `translateX(-${templateCarouselSlideOffsetPx}px)`,
                }}
              >
                {/* Duplicate templates for seamless infinite loop */}
                {[...TEMPLATES_CATALOG, ...TEMPLATES_CATALOG].map((template, index) => (
                  <div
                    key={`${template.id}-${index}`}
                    className="flex-shrink-0 max-sm:min-w-0 max-sm:flex-[0_0_calc((100%-1rem)/3)] sm:min-w-[calc(20%-0.8rem)]"
                  >
                    <div className="relative group">
                      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300">
                        {/* Template Preview Image */}
                        <div className="relative aspect-[210/297] bg-white overflow-hidden">
                          <Image
                            src={template.thumbnail}
                            alt={template.name}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform duration-300"
                            style={{ padding: 0 }}
                            preload={index < 5}
                          />
                          {/* Hover Overlay with Button */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Link href={`/dashboard/resumes/new?template=${template.id}&skipTemplate=true`}>
                              <Button className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white font-medium shadow-lg">
                                Use This Template
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                        
                        {/* Template Name Overlay or Badge */}
                        <div className="p-1.5 bg-white border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[10px] sm:text-xs font-semibold text-slate-900 truncate">
                              {template.name}
                            </h3>
                            {template.popular && (
                              <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium flex-shrink-0 ml-1">
                                Popular
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({
                length: Math.ceil(TEMPLATES_CATALOG.length / templateCarouselTemplatesPerPage),
              }).map((_, index) => {
                const currentPage = Math.floor(
                  (currentTemplateSlide % TEMPLATES_CATALOG.length) / templateCarouselTemplatesPerPage
                );
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentTemplateSlide(index * templateCarouselTemplatesPerPage)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentPage === index
                        ? "w-8 bg-blue-600"
                        : "w-2 bg-gray-300"
                    }`}
                    aria-label={`Go to page ${index + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ATS Score Checker Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 px-4 sm:px-6 bg-blue-50/30 relative overflow-hidden">
        {/* Animated Background Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${(i * 20) % 100}%`,
                top: `${(i * 25) % 100}%`,
                opacity: 0.09,
                animation: `float-${i % 3} ${6 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <FileCheck className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
            </div>
          ))}
        </div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left Side - Text and Upload */}
            <div className="space-y-6 sm:space-y-8">
              {/* Headline */}
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight">
                  Smart ATS check:{" "}
                  <span className="text-[rgb(37,99,235)]">see how bots read you</span>
                </h2>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  AI filters resumes before humans see them. Upload for an ATS-style score and clear feedback—then iterate in our builder until you&apos;re recruiter-ready.
                </p>
              </div>

              {/* Upload Box */}
              <Link href="/ats-checker">
                <div className="border-2 border-[rgb(37,99,235)] rounded-lg p-6 sm:p-8 bg-white hover:bg-blue-50/30 transition-colors cursor-pointer">
                  <div className="text-center mb-4">
                    <p className="text-base sm:text-lg font-medium text-slate-900 mb-2">
                      Drop your resume here or choose a file.
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      We read: DOC, DOCX, PDF, HTML, RTF, TXT
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">PDF</div>
                    <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">DOC</div>
                    <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">JPG</div>
                    <UploadIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <Button
                    size="lg"
                    className="w-full text-white font-medium shadow-lg transition-all h-12 !bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-base sm:text-lg"
                  >
                    Check My Resume Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </Link>
            </div>

            {/* Right Side - Visual Preview */}
            <div className="relative">
              {/* Resume Preview Card */}
              <div className="relative bg-white rounded-lg shadow-2xl p-6 sm:p-8 transform rotate-[-2deg] border-2 border-gray-200 animate-card-float">
                {/* Suggested Improvements Banner */}
                <div className="absolute -top-4 left-4 right-4 bg-red-500 text-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg z-10 animate-fade-in">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold text-sm sm:text-base">3 suggested improvements</span>
                </div>
                
                {/* Resume Content Preview */}
                <div className="mt-8 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">ROCHELLE BLAIR</h3>
                    <p className="text-sm text-gray-600">Software Engineer</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Skills</h4>
                    <p className="text-sm text-gray-600">React, Node.js, TypeScript, AWS...</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Work History</h4>
                    <p className="text-sm text-gray-600">Senior Developer at Tech Corp (2020-Present)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Education</h4>
                    <p className="text-sm text-gray-600">BS Computer Science, University Name</p>
                  </div>
                </div>

                {/* Animated Improvement Lines */}
                <div className="absolute top-12 left-8 w-0.5 h-0 bg-red-500 animate-line-draw-1"></div>
                <div className="absolute top-20 left-16 w-0.5 h-0 bg-red-500 animate-line-draw-2"></div>
                <div className="absolute top-32 left-24 w-0.5 h-0 bg-red-500 animate-line-draw-3"></div>
              </div>

              {/* Circular Score Gauge */}
              <div className="absolute -bottom-8 -right-8 bg-white rounded-full shadow-2xl p-4 sm:p-6 border-4 border-[rgb(37,99,235)] animate-scale-in">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                  {/* Circular Progress */}
                  <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgb(37,99,235)"
                      strokeWidth="8"
                      strokeDasharray="282.74"
                      strokeDashoffset="282.74"
                      strokeLinecap="round"
                      className="animate-circle-progress"
                    />
                  </svg>
                  {/* Score Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
                    <span className="text-4xl sm:text-5xl font-bold text-slate-900 animate-count-up leading-none">95</span>
                    <span className="text-[8px] sm:text-[9px] font-semibold text-[rgb(37,99,235)] mt-0.5 text-center leading-tight max-w-[90%]">
                      RESUME STRENGTH
                    </span>
                  </div>
                </div>
              </div>

              {/* Background Decorative Element */}
              <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl animate-pulse-slow"></div>
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
              Choose a template, add your story, tune with AI, and verify your Smart ATS Score
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
                    <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-3">
                    1
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    Choose Template
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Select from professional ATS-optimized templates
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
                    <Settings className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-3">
                    2
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    Fill Your Details
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Add your experience, skills, and achievements
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
                    <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-3">
                    3
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    Real-Time AI Polish
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Instant improvements and wording tuned for clarity and ATS parsing
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
                    <Download className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-3">
                    4
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    Smart ATS Score & Export
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Review your score, export PDF or Word—then tailor per job when you use Job Search
                  </p>
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
              Built for the ATS-first hiring funnel
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Don&apos;t just apply harder—optimize for how recruiters and systems actually evaluate you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <FileCheck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ATS-Optimized</h3>
              <p className="text-gray-600">
                Templates designed to pass Applicant Tracking Systems and get your resume noticed
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Palette className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Professional Templates</h3>
              <p className="text-gray-600">
                Choose from multiple modern, professional templates that suit your industry
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Smart ATS Score</h3>
              <p className="text-gray-600">
                See how robot readers likely score your resume—and what to fix before a human clicks
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Live Preview</h3>
              <p className="text-gray-600">
                See your resume in real-time as you edit, with instant visual feedback
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Download className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Multiple Formats</h3>
              <p className="text-gray-600">
                Export your resume in PDF, Word, or other formats for easy sharing
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:border-blue-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Award className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Industry-Specific</h3>
              <p className="text-gray-600">
                Templates and suggestions tailored to your specific industry and role
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 px-4 sm:px-6 bg-gray-50 relative overflow-hidden">
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
            Transform your resume—don&apos;t just apply
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Start with ATS-optimized templates, real-time AI improvements, and a Smart ATS Score that helps you reach the recruiter&apos;s desk.
          </p>
          <Link href="/dashboard/resumes/new">
            <Button
              size="lg"
              className="text-white font-medium shadow-sm transition-all h-12 px-8 hover:opacity-90 !bg-[rgb(37,99,235)] text-base sm:text-lg"
            >
              Start Building Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

