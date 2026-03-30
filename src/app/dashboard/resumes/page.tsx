"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Edit,
  Trash2,
  Copy,
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
} from "lucide-react";
import Image from "next/image";
import { Resume, resumeApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

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
    try {
      setDownloadingId(resumeId);
      const pdfUrl = await resumeApi.downloadPDF(resumeId);
      window.open(pdfUrl, "_blank");
    } catch (error: any) {
      console.error("Error downloading PDF:", error);

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[rgb(37,99,235)] mx-auto mb-4" />
          <p className="text-gray-600">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  const averageATSScore =
    resumes.length > 0
      ? resumes
          .filter((r) => r.atsScore)
          .reduce((sum, r) => sum + (r.atsScore || 0), 0) /
        resumes.filter((r) => r.atsScore).length
      : 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Resume Builder Hero Section */}
      <section className="pt-4 sm:pt-6 pb-8 sm:pb-12 md:pb-16 px-4 sm:px-6 overflow-hidden bg-blue-50 relative rounded-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
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
              <Palette className="w-10 h-10 sm:w-14 sm:h-14 text-blue-300" />
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
              <FileCheck className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-300" />
            </div>
          ))}
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-700 font-medium text-sm mb-4">
                <Sparkles className="w-3 h-3" />
                <span>Professional Templates</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[43px] font-bold tracking-tight text-slate-900 leading-[1.2] sm:leading-[1.1] lg:leading-[52px] mb-4 sm:mb-6">
                Create Professional Resumes in Minutes
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
                Build ATS-friendly resumes that get you noticed. Choose from
                professional templates, get AI-powered suggestions, and export
                in multiple formats.
              </p>

              {/* Features List */}
              <div className="space-y-3 pt-4 sm:pt-6 px-2 sm:px-0">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[rgb(37,99,235)] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">
                    ATS-optimized templates for better visibility
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[rgb(37,99,235)] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">
                    AI-powered content suggestions and improvements
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[rgb(37,99,235)] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm sm:text-base">
                    Export to PDF, Word, and more formats
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 px-2 sm:px-0">
                <Link href="/ats-checker" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-2 border-[rgb(37,99,235)] text-[rgb(37,99,235)] hover:!bg-[rgb(37,99,235)] hover:!text-white font-semibold text-sm sm:text-base px-5 sm:px-6 py-4 sm:py-5 h-auto shadow-lg hover:shadow-xl transition-all"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Check ATS Score
                  </Button>
                </Link>
                <Button
                  size="lg"
                  onClick={handleCreateResumeClick}
                  disabled={checkingLimit}
                  className="w-full sm:w-auto !bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white font-semibold text-sm sm:text-base px-5 sm:px-6 py-4 sm:py-5 h-auto shadow-lg hover:shadow-xl transition-all"
                >
                  {checkingLimit && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  )}
                  Create New Resume
                  {!checkingLimit && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>

            {/* Right Section - Animated Resume Builder Preview */}
            <div className="relative flex justify-center lg:justify-start">
              <div className="relative rounded-lg sm:rounded-xl shadow-2xl overflow-hidden bg-white w-full max-w-[600px] sm:max-w-[700px] border-2 sm:border-4 border-blue-100">
                {/* Resume Builder Header */}
                <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Resume Builder
                    </h3>
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
                    {/* Professional Summary - Step 1 */}
                    {currentStep === 1 && (
                      <div
                        className="animate-fadeInUp w-full"
                        style={{ animation: "fadeInUp 0.6s ease-out" }}
                      >
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-2">
                          PROFESSIONAL SUMMARY
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
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
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="h-2 bg-blue-200 rounded-full w-3/4 mb-2 animate-pulse"></div>
                            <div className="h-2 bg-blue-100 rounded-full w-1/2 animate-pulse"></div>
                          </div>
                          <span className="text-xs sm:text-sm text-blue-600 font-medium">
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
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <GripVertical className="w-3 h-3 text-[rgb(37,99,235)]" />
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
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
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
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <GripVertical className="w-3 h-3 text-[rgb(37,99,235)]" />
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
                              className="bg-blue-50 rounded p-2 border border-blue-100 transition-all duration-300 hover:shadow-md"
                              style={{
                                animation: `fadeInUp 0.6s ease-out ${index * 0.12}s both`,
                              }}
                            >
                              <p className="text-xs font-semibold text-slate-900">
                                {project.title}
                              </p>
                              <p className="text-xs text-gray-600">
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
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <GripVertical className="w-3 h-3 text-[rgb(37,99,235)]" />
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
                              className="bg-blue-50 rounded p-2 border border-blue-100 transition-all duration-300 hover:shadow-md"
                              style={{
                                animation: `fadeInUp 0.6s ease-out ${index * 0.12}s both`,
                              }}
                            >
                              <p className="text-xs font-semibold text-slate-900">
                                {edu.degree}
                              </p>
                              <p className="text-xs text-gray-600">
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
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200 w-full max-w-md">
                          <div className="flex items-center justify-center mb-3">
                            <div className="relative w-full max-w-[180px] aspect-[210/297] bg-white rounded shadow-lg overflow-hidden">
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
                            <h4 className="text-sm font-bold text-slate-900 mb-1">
                              Resume Ready!
                            </h4>
                            <p className="text-xs text-gray-600">
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
                        <div className="w-full max-w-md mx-auto p-6 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-center space-y-4">
                            <div>
                              <p className="text-base sm:text-lg font-semibold text-blue-900 mb-1">
                                Resume Ready!
                              </p>
                              <p className="text-sm text-blue-700">
                                Download in PDF or Word format
                              </p>
                            </div>
                            <div className="flex justify-center">
                              <div className="px-6 py-3 bg-[rgb(37,99,235)] text-white rounded-md flex items-center gap-2 cursor-default animate-pulse">
                                <Download className="w-5 h-5" />
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Resumes */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mb-2">
              <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">
                Total Resumes
              </p>
              <h3 className="text-3xl lg:text-4xl font-bold text-slate-900">
                {resumes.length}
              </h3>
            </div>
          </div>

          {/* Average ATS Score */}
          {averageATSScore > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mb-2">
                <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">
                  Avg ATS Score
                </p>
                <h3
                  className={`text-3xl lg:text-4xl font-bold ${
                    averageATSScore >= 80
                      ? "text-green-600"
                      : averageATSScore >= 70
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {Math.round(averageATSScore)}%
                </h3>
              </div>
            </div>
          )}

          {/* ATS Ready */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-2 ring-blue-200/50">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mb-2">
              <p className="text-xs sm:text-sm font-bold text-[rgb(37,99,235)] mb-1.5">
                ATS Ready
              </p>
              <h3 className="text-3xl lg:text-4xl font-bold text-slate-900">
                {resumes.filter((r) => r.atsScore && r.atsScore >= 80).length}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Action Header */}
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
          Your Resumes
        </h2>
        <p className="text-gray-600 mt-1">
          {resumes.length === 0
            ? "Create your first resume to get started"
            : `Showing ${resumes.length} resume${
                resumes.length === 1 ? "" : "s"
              }`}
        </p>
      </div>

      {/* Resumes List */}
      {resumes.length === 0 ? (
        <Card className="border-2 border-blue-200/50 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-16 pb-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FileEdit className="w-12 h-12 text-[rgb(37,99,235)]" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              No resumes yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              Create your first ATS-friendly resume with our professional
              templates
            </p>
            <Button
              size="lg"
              onClick={handleCreateResumeClick}
              disabled={checkingLimit}
              className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-lg hover:shadow-xl transition-all"
            >
              {checkingLimit ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Plus className="w-5 h-5 mr-2" />
              )}
              Create Your First Resume
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resumes.map((resume) => (
            <div
              key={resume._id}
              className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm group"
            >
              {/* Resume Thumbnail - Clickable */}
              <Link href={`/dashboard/resumes/${resume.resumeId}/edit`}>
                {resume.thumbnailS3Key ? (
                  <div className="mb-3 relative aspect-[210/297] bg-gray-100 rounded-lg overflow-hidden border-2 border-blue-200/50 cursor-pointer hover:border-[rgb(37,99,235)] hover:shadow-lg transition-all group">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}/resumes/${resume.resumeId}/thumbnail-url`}
                      alt={resume.title}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      onLoad={() => {
                        console.log(
                          "Thumbnail loaded successfully for:",
                          resume.title,
                        );
                      }}
                      onError={(e) => {
                        console.error(
                          "Thumbnail failed to load for:",
                          resume.title,
                        );
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) {
                          (fallback as HTMLElement).style.display = "flex";
                        }
                      }}
                    />
                    <div className="hidden w-full h-full absolute inset-0 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                      <FileText className="w-8 h-8 text-blue-300" />
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 aspect-[210/297] bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border-2 border-blue-200/50 cursor-pointer hover:border-[rgb(37,99,235)] hover:shadow-lg transition-all">
                    <div className="text-center px-2">
                      <FileText className="w-8 h-8 text-[rgb(37,99,235)]/50 mx-auto mb-1" />
                      <p className="text-[10px] text-gray-500 leading-tight">
                        No preview
                      </p>
                      <p className="text-[9px] text-gray-400 leading-tight">
                        Download PDF
                      </p>
                    </div>
                  </div>
                )}
              </Link>

              {/* Resume Info */}
              <div className="mb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 mb-1 truncate">
                      {resume.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-1.5">
                      {formatDate(resume.updatedAt)}
                    </p>
                    {resume.atsScore !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-500">ATS:</span>
                        <span
                          className={`text-xs font-bold ${
                            resume.atsScore >= 80
                              ? "text-green-600"
                              : resume.atsScore >= 70
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {resume.atsScore}%
                        </span>
                      </div>
                    )}
                  </div>
                  {resume.isDefault && (
                    <span className="px-2 py-0.5 text-[9px] font-semibold bg-blue-100 text-[rgb(37,99,235)] rounded-full flex-shrink-0">
                      Default
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <Link
                  href={`/dashboard/resumes/${resume.resumeId}/edit`}
                  className="flex-1 min-w-0"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 px-2 border-blue-300 text-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:border-[rgb(17,24,39)] text-[11px] transition-all"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(resume.resumeId)}
                  disabled={downloadingId === resume.resumeId}
                  className="flex-1 h-8 px-2 border-blue-300 text-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:border-[rgb(17,24,39)] text-[11px] transition-all disabled:opacity-50"
                >
                  {downloadingId === resume.resumeId ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3 mr-1" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(resume.resumeId)}
                  disabled={duplicatingId === resume.resumeId}
                  className="h-8 px-2 border-blue-300 text-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] hover:!text-white hover:border-[rgb(17,24,39)] transition-all disabled:opacity-50"
                  title="Duplicate"
                >
                  {duplicatingId === resume.resumeId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(resume.resumeId)}
                  disabled={deletingId === resume.resumeId}
                  className="h-8 px-2 border-red-300 text-red-700 hover:bg-red-50 transition-all disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === resume.resumeId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

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
        <DialogContent className="sm:max-w-md border-2 border-blue-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Resume limit reached
            </DialogTitle>
            <DialogDescription className="text-left text-gray-600 pt-1">
              You&apos;ve used all the resumes included in your current plan.
              Upgrade your plan to create more resumes and keep building.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowLimitModal(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowLimitModal(false);
                router.push("/dashboard/plan");
              }}
              className="!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white"
            >
              Upgrade plan
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
