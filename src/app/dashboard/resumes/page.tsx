"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileEdit,
  Plus,
  Download,
  Loader2,
  TrendingUp,
  FileText,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Palette,
  FileCheck,
  Brain,
  GripVertical,
  Target,
  Percent,
  Award,
} from "lucide-react";
import Image from "next/image";
import { Resume, resumeApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { DashboardResumesList } from "@/components/dashboard/DashboardResumesList";
import { TrialUpsellDialog } from "@/components/upsell/TrialUpsellDialog";
import { useEntitlements } from "@/hooks/useEntitlements";

const RESUME_ITEMS_PER_PAGE = 10;

export default function ResumesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [resumePage, setResumePage] = useState(1);
  const [trialUpsellOpen, setTrialUpsellOpen] = useState(false);
  const { canUse, data: entitlements } = useEntitlements();

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

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadResumes();
    }
  }, [isLoaded, user]);

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

    const resumeContent =
      "Experienced software engineer with 5+ years developing scalable web applications. Proficient in React, Node.js, and cloud technologies. Led teams of 5+ developers and delivered projects worth $2M+ in revenue.";

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

  const loadResumes = async (opts?: { silent?: boolean }) => {
    if (!user) return;
    try {
      if (!opts?.silent) setLoading(true);
      const data = await resumeApi.list(user.id);
      setResumes(data);
    } catch (error) {
      console.error("Error loading resumes:", error);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  const handleCreateResumeClick = async () => {
    if (!user) return;
    try {
      setCheckingLimit(true);
      const limitCheck = await resumeApi.checkResumeLimit();
      if (!limitCheck.allowed) {
        setShowLimitModal(true);
        return;
      }
      router.push("/dashboard/resumes/new");
    } catch (error) {
      console.error("Error checking resume limit:", error);
      router.push("/dashboard/resumes/new");
    } finally {
      setCheckingLimit(false);
    }
  };

  const handleDeleteClick = (resumeId: string) => {
    setResumeToDelete(resumeId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!resumeToDelete) return;

    try {
      setDeletingId(resumeToDelete);
      await resumeApi.delete(resumeToDelete);
      await loadResumes();
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert("Failed to delete resume. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (resumeId: string) => {
    try {
      setDuplicatingId(resumeId);
      await resumeApi.duplicate(resumeId);
      await loadResumes({ silent: true });
    } catch (error) {
      console.error("Error duplicating resume:", error);
      alert("Failed to duplicate resume. Please try again.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDownload = async (resumeId: string) => {
    if (!canUse("resumeDownload")) {
      setTrialUpsellOpen(true);
      return;
    }
    try {
      setDownloadingId(resumeId);
      const pdfUrl = await resumeApi.downloadPDF(resumeId);
      window.open(pdfUrl, "_blank");
    } catch (error: any) {
      console.error("Error downloading PDF:", error);

      const gate = error.response?.data?.gate;
      if (error.response?.status === 403 && gate) {
        setTrialUpsellOpen(true);
        return;
      }

      // If PDF doesn't exist, redirect to editor to generate it
      if (
        error.message?.includes("PDF not found") ||
        error.response?.status === 404
      ) {
        if (
          confirm(
            "PDF not generated yet. Would you like to open the editor to download?",
          )
        ) {
          window.location.href = `/dashboard/resumes/${resumeId}/edit`;
        }
      } else {
        alert("Failed to download PDF. Please try again.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#7367F0]" />
          <p className="text-muted-foreground">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  const resumesWithAts = resumes.filter(
    (r) => typeof r.atsScore === "number" && Number.isFinite(r.atsScore),
  );
  const avgAts =
    resumesWithAts.length > 0
      ? Math.round(
          resumesWithAts.reduce((s, r) => s + (r.atsScore ?? 0), 0) /
            resumesWithAts.length,
        )
      : 0;
  const atsReadyCount = resumes.filter(
    (r) => typeof r.atsScore === "number" && r.atsScore >= 80,
  ).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Resume Builder Hero Section */}
      <section className="relative overflow-hidden rounded-xl bg-[#7367F0]/[0.04] px-4 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-6 md:pb-16">
        {/* Animated Background Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
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
              <FileText className="h-12 w-12 text-[#7367F0]/40 sm:h-16 sm:w-16" />
            </div>
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`palette-${i}`}
              className="absolute"
              style={{
                left: `${(i * 16) % 100}%`,
                top: `${(i * 22) % 100}%`,
                opacity: 0.07,
                animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <Palette className="h-10 w-10 text-[#7367F0]/30 sm:h-14 sm:w-14" />
            </div>
          ))}
          {[...Array(6)].map((_, i) => (
            <div
              key={`check-${i}`}
              className="absolute"
              style={{
                left: `${(i * 20) % 100}%`,
                top: `${(i * 15) % 100}%`,
                opacity: 0.06,
                animation: `float-${i % 3} ${8 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`,
              }}
            >
              <FileCheck className="h-8 w-8 text-violet-300/60 sm:h-12 sm:w-12" />
            </div>
          ))}
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center lg:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#7367F0]/10 px-3 py-1 text-sm font-medium text-[#7367F0]">
                <Sparkles className="h-3 w-3" />
                <span>ATS-optimized templates</span>
              </div>
              <h2 className="mb-4 text-2xl font-bold leading-[1.25] tracking-tight sm:mb-6 sm:text-3xl sm:leading-[1.15] md:text-4xl lg:text-[34px] lg:leading-[42px]">
                <span className="text-foreground">Pass the bots with a </span>
                <span className="text-[#7367F0]">stronger resume</span>
              </h2>
              <p className="mx-auto max-w-xl px-2 text-sm leading-relaxed text-muted-foreground sm:px-0 sm:text-base lg:mx-0">
                Fresher or pro—our model analyzes your resume in real time,
                suggests instant improvements, and surfaces a Smart ATS Score so
                you escape the ATS black hole.
              </p>

              {/* Features List */}
              <div className="space-y-3 pt-4 sm:pt-6 px-2 sm:px-0">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" />
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    ATS-optimized templates and parsing-friendly layouts
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" />
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    Real-time suggestions and Smart ATS Score
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7367F0]" />
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    Export when you&apos;re ready—PDF, Word, and more
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 px-2 sm:px-0">
                <Link href="/dashboard/ats-checker" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className={cn(
                      instituteSecondaryClass,
                      "h-auto w-full px-5 py-4 text-sm font-semibold shadow-lg transition-all hover:shadow-xl sm:w-auto sm:px-6 sm:py-5 sm:text-base",
                    )}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Check ATS Score
                  </Button>
                </Link>
                <Button
                  size="lg"
                  onClick={handleCreateResumeClick}
                  disabled={checkingLimit}
                  className={cn(
                    institutePrimaryClass,
                    "h-auto w-full px-5 py-4 text-sm font-semibold shadow-lg transition-all hover:shadow-xl sm:w-auto sm:px-6 sm:py-5 sm:text-base",
                  )}
                >
                  {checkingLimit && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create New Resume
                  {!checkingLimit && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Right Section - Animated Resume Builder Preview */}
            <div className="relative flex justify-center lg:justify-start">
              <div className="relative w-full max-w-[600px] overflow-hidden rounded-md border border-border bg-card shadow-lg sm:max-w-[700px]">
                {/* Resume Builder Header */}
                <div className="border-b border-border bg-gradient-to-br from-[#7367F0]/5 via-card to-muted/30 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      Resume Builder
                    </h3>
                    {showDownload && (
                      <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Ready
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 shadow-sm border border-border">
                    <FileText className="w-4 h-4 text-muted-foreground/80" />
                    <input
                      type="text"
                      value={resumeText ? "Professional Summary" : ""}
                      readOnly
                      placeholder="Building your resume..."
                      className="flex-1 outline-none text-xs sm:text-sm text-foreground bg-transparent"
                    />
                  </div>
                </div>

                {/* Resume Content Preview */}
                <div className="p-4 sm:p-6 bg-card max-h-[400px] overflow-y-auto relative">
                  <div className="space-y-4 h-[300px] relative flex items-center justify-center">
                    {/* Professional Summary - Step 1 */}
                    {currentStep === 1 && (
                      <div
                        className="animate-fadeInUp w-full"
                        style={{ animation: "fadeInUp 0.6s ease-out" }}
                      >
                        <h4 className="text-xs sm:text-sm font-bold text-foreground mb-2">
                          PROFESSIONAL SUMMARY
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Experienced software engineer with 5+ years developing
                          scalable web applications. Proficient in React,
                          Node.js, and cloud technologies. Led teams of 5+
                          developers and delivered projects worth $2M+ in
                          revenue.
                        </p>
                      </div>
                    )}

                    {/* AI Enhancing - Step 2 */}
                    {currentStep === 2 && (
                      <div
                        className="animate-fadeInUp w-full"
                        style={{ animation: "fadeInUp 0.6s ease-out" }}
                      >
                        <div className="flex items-center gap-3 rounded-lg border border-[#7367F0]/10 bg-[#7367F0]/5 p-4">
                          <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-[#7367F0]">
                            <Brain className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="mb-2 h-2 w-3/4 animate-pulse rounded-full bg-[#7367F0]/20"></div>
                            <div className="h-2 w-1/2 animate-pulse rounded-full bg-[#7367F0]/10"></div>
                          </div>
                          <span className="text-xs font-medium text-[#7367F0] sm:text-sm">
                            Enhancing...
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Skills Section - Step 3 */}
                    {currentStep === 3 && (
                      <div
                        className="animate-fadeInUp w-full"
                        style={{ animation: "fadeInUp 0.6s ease-out" }}
                      >
                        <h4 className="text-xs sm:text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                          <GripVertical className="h-3 w-3 text-[#7367F0]" />
                          SKILLS
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "React",
                            "Node.js",
                            "TypeScript",
                            "AWS",
                            "Docker",
                            "MongoDB",
                            "PostgreSQL",
                            "GraphQL",
                          ].map((skill, index) => (
                            <span
                              key={skill}
                              className="rounded bg-[#7367F0]/10 px-2 py-1 text-xs font-medium text-[#7367F0]"
                              style={{
                                animation: `fadeInUp 0.5s ease-out ${index * 0.08}s both`,
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects Section - Step 4 */}
                    {currentStep === 4 && (
                      <div
                        className="animate-fadeInUp w-full"
                        style={{ animation: "fadeInUp 0.6s ease-out" }}
                      >
                        <h4 className="text-xs sm:text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                          <GripVertical className="h-3 w-3 text-[#7367F0]" />
                          PROJECTS
                        </h4>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {[
                            {
                              title: "E-Commerce Platform",
                              desc: "Built scalable e-commerce solution with React and Node.js",
                            },
                            {
                              title: "Real-time Chat Application",
                              desc: "Developed WebSocket-based chat system with 10K+ concurrent users",
                            },
                            {
                              title: "Cloud Migration Project",
                              desc: "Migrated legacy systems to AWS, reducing costs by 40%",
                            },
                            {
                              title: "Mobile Payment Gateway",
                              desc: "Created secure payment processing API handling $5M+ monthly transactions",
                            },
                          ].map((project, index) => (
                            <div
                              key={index}
                              className="rounded border border-[#7367F0]/10 bg-[#7367F0]/5 p-2 transition-all duration-300 hover:shadow-md"
                              style={{
                                animation: `fadeInUp 0.6s ease-out ${index * 0.12}s both`,
                              }}
                            >
                              <p className="text-xs font-semibold text-foreground">
                                {project.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {project.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education Section - Step 5 */}
                    {currentStep === 5 && (
                      <div
                        className="animate-fadeInUp w-full"
                        style={{ animation: "fadeInUp 0.6s ease-out" }}
                      >
                        <h4 className="text-xs sm:text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                          <GripVertical className="h-3 w-3 text-[#7367F0]" />
                          EDUCATION
                        </h4>
                        <div className="space-y-2">
                          {[
                            {
                              degree: "B.Tech Computer Science",
                              details: "IIT Delhi • 2018-2022 • CGPA: 8.5/10",
                            },
                            {
                              degree: "AWS Certified Solutions Architect",
                              details: "Amazon Web Services • 2021",
                            },
                            {
                              degree: "Full Stack Web Development",
                              details:
                                "Udemy • 2019 • Certificate of Completion",
                            },
                          ].map((edu, index) => (
                            <div
                              key={index}
                              className="rounded border border-[#7367F0]/10 bg-[#7367F0]/5 p-2 transition-all duration-300 hover:shadow-md"
                              style={{
                                animation: `fadeInUp 0.6s ease-out ${index * 0.12}s both`,
                              }}
                            >
                              <p className="text-xs font-semibold text-foreground">
                                {edu.degree}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {edu.details}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ready Resume Image/Preview - Step 6 */}
                    {currentStep === 6 && (
                      <div
                        className="w-full h-full flex items-center justify-center animate-fadeInUp"
                        style={{ animation: "fadeInUp 0.6s ease-out" }}
                      >
                        <div className="w-full max-w-md rounded-lg border-2 border-[#7367F0]/20 bg-gradient-to-br from-[#7367F0]/5 to-violet-50/80 p-4">
                          <div className="flex items-center justify-center mb-3">
                            <div className="relative w-full max-w-[180px] aspect-[210/297] bg-card rounded shadow-lg overflow-hidden">
                              <Image
                                src="/resume-template-images/clean-slate-preview.webp"
                                alt="Resume Preview"
                                fill
                                className="object-contain"
                                priority
                              />
                            </div>
                          </div>
                          <div className="text-center">
                            <h4 className="text-sm font-bold text-foreground mb-1">
                              Resume Ready!
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Your professional resume is complete
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ATS Score Display - Step 7 */}
                    {currentStep === 7 && (
                      <div
                        className="w-full animate-fadeInUp"
                        style={{ animation: "fadeInUp 0.6s ease-out" }}
                      >
                        <div className="w-full max-w-md mx-auto p-6 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-green-600" />
                              <span className="text-sm sm:text-base font-semibold text-green-900">
                                ATS Score
                              </span>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-green-700">
                              {atsScore}%
                            </span>
                          </div>
                          <div className="w-full bg-green-200 rounded-full h-3 mb-3">
                            <div
                              className="bg-green-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${atsScore}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-green-700 text-center">
                            Excellent! Your resume is ATS-optimized.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Download Action - Step 8 */}
                    {currentStep === 8 && (
                      <div
                        className="w-full animate-fadeInUp"
                        style={{ animation: "fadeInUp 0.6s ease-out" }}
                      >
                        <div className="mx-auto w-full max-w-md rounded-lg border border-[#7367F0]/20 bg-[#7367F0]/5 p-6">
                          <div className="space-y-4 text-center">
                            <div>
                              <p className="mb-1 text-base font-semibold text-[#5E50EE] sm:text-lg">
                                Resume Ready!
                              </p>
                              <p className="text-sm text-[#7367F0]/80">
                                Download in PDF or Word format
                              </p>
                            </div>
                            <div className="flex justify-center">
                              <div className="flex animate-pulse cursor-default items-center gap-2 rounded-md bg-[#7367F0] px-6 py-3 text-white">
                                <Download className="h-5 w-5" />
                                <span className="text-sm font-medium">
                                  Download
                                </span>
                              </div>
                            </div>
                          </div>
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

      {/* Quick Stats */}
      {resumes.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <DashboardStatCard
            theme="emerald"
            label="Total resumes"
            value={resumes.length}
            icon={FileEdit}
            hint={
              <>
                <FileText className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>In builder</span>
              </>
            }
          />
          <DashboardStatCard
            theme="violet"
            label="Average ATS"
            value={resumesWithAts.length > 0 ? `${avgAts}/100` : "—"}
            icon={Target}
            progress={resumesWithAts.length > 0 ? avgAts : undefined}
            hint={
              <>
                <Percent className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>
                  {resumesWithAts.length > 0
                    ? `${resumesWithAts.length} scored`
                    : "No ATS run yet"}
                </span>
              </>
            }
          />
          <DashboardStatCard
            theme="amber"
            label="ATS ready (≥80)"
            value={atsReadyCount}
            icon={Award}
            hint={
              <>
                <CheckCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>Strong ATS scores</span>
              </>
            }
          />
        </div>
      )}

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Your resumes
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {resumes.length === 0
                  ? "Smart ATS Score + recruiter-ready phrasing begins with your first file."
                  : `Showing ${resumes.length} resume${
                      resumes.length === 1 ? "" : "s"
                    }—keep iterating until Smart ATS clears the bots.`}
              </CardDescription>
            </div>
            <Button
              onClick={handleCreateResumeClick}
              disabled={checkingLimit}
              className={institutePrimaryClass}
            >
              {checkingLimit ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              New resume
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DashboardResumesList
            resumes={resumes}
            currentPage={resumePage}
            itemsPerPage={RESUME_ITEMS_PER_PAGE}
            onPageChange={setResumePage}
            onDownload={handleDownload}
            downloadingResumeId={downloadingId}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteClick}
            duplicatingResumeId={duplicatingId}
            deletingResumeId={deletingId}
            onCreateClick={handleCreateResumeClick}
            createLoading={checkingLimit}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Resume"
        description="Are you sure you want to delete this resume? This action cannot be undone and all data will be permanently lost."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={deletingId !== null}
      />

      {/* Resume limit reached – upgrade plan modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="border border-[#7367F0]/20 bg-card shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Resume limit reached
            </DialogTitle>
            <DialogDescription className="text-left text-muted-foreground pt-1">
              You&apos;ve used all the resumes included in your current plan.
              Upgrade your plan to create more resumes and keep building.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowLimitModal(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowLimitModal(false);
                router.push("/dashboard/plan");
              }}
              className={institutePrimaryClass}
            >
              Upgrade plan
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <TrialUpsellDialog
        open={trialUpsellOpen}
        onOpenChange={setTrialUpsellOpen}
        variant="resume_download"
        hasPurchasedTrial={
          entitlements ? !entitlements.canPurchaseTrial : false
        }
      />
    </div>
  );
}
