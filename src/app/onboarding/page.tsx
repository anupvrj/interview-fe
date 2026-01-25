"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  FileText,
  CheckCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Rocket,
  TrendingUp,
  Upload,
  X,
  Eye,
} from "lucide-react";
import { userApi } from "@/lib/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const INDUSTRIES = [
  "IT/Software",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail",
  "Consulting",
  "E-commerce",
  "Telecommunications",
  "Automotive",
  "Real Estate",
  "Media & Entertainment",
  "Other",
];

interface ExtractedData {
  name?: string;
  email?: string;
  phone?: string;
  experience?: number;
  skills?: string[];
  education?: string[];
  currentJob?: {
    company?: string;
    role?: string;
    industry?: string;
  };
  previousJobs?: Array<{
    company?: string;
    role?: string;
    duration?: string;
  }>;
  summary?: string;
}

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string>("");

  // Form data
  const [userType, setUserType] = useState<
    "student" | "fresher" | "experienced" | ""
  >("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );
  const [reviewData, setReviewData] = useState({
    overallExperience: 0, // Overall experience in years (for all user types)
    experience: 0, // Work experience (for experienced users)
    currentJob: {
      company: "",
      role: "",
      industry: "",
    },
    industries: [] as string[],
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    onDrop: (acceptedFiles, rejectedFiles) => {
      setError("");
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        if (error.code === "file-too-large") {
          setError("File size must be less than 5 MB");
        } else {
          setError("Only PDF files are allowed");
        }
        return;
      }
      if (acceptedFiles.length > 0) {
        setResumeFile(acceptedFiles[0]);
      }
    },
  });

  const [checkingStatus, setCheckingStatus] = useState(true);

  const checkOnboardingStatus = async () => {
    if (!user) {
      setCheckingStatus(false);
      return;
    }
    try {
      console.log("🔍 Checking onboarding status for user:", user.id);
      localStorage.setItem("clerk-user-id", user.id);
      const createdUser = await userApi.createOrGetUser(
        user.id,
        user.primaryEmailAddress?.emailAddress || "",
        user.fullName || user.firstName || "User"
      );

      console.log("📋 Onboarding status:", createdUser.onboardingCompleted);

      // If onboarding is already completed, check for return URL or pending plan
      if (createdUser.onboardingCompleted) {
        console.log("✅ Onboarding completed");
        
        // Check if there's a return URL from resume builder
        const returnUrl = localStorage.getItem("resumeBuilderReturnUrl");
        if (returnUrl) {
          console.log("🔄 Redirecting to resume builder return URL");
          localStorage.removeItem("resumeBuilderReturnUrl");
          router.replace(returnUrl);
          return;
        }
        
        const pendingPlan = localStorage.getItem("pendingPlan");
        if (pendingPlan && ["starter", "pro", "exam_pack"].includes(pendingPlan)) {
          console.log("📦 Pending plan found, redirecting to checkout");
          localStorage.removeItem("pendingPlan");
          router.replace(`/checkout?plan=${pendingPlan}`);
        } else {
          console.log("🏠 Redirecting to dashboard");
          router.replace("/dashboard");
        }
        return;
      } else {
        console.log("📝 Onboarding not completed, showing form");
      }
    } catch (error) {
      console.error("❌ Error checking onboarding status:", error);
      // Continue with onboarding if check fails
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      checkOnboardingStatus();
    } else if (isLoaded && !user) {
      setCheckingStatus(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  const initializeUser = async () => {
    if (!user) return;
    try {
      await userApi.createOrGetUser(
        user.id,
        user.primaryEmailAddress?.emailAddress || "",
        user.fullName || user.firstName || "User"
      );
    } catch (error) {
      console.error("Error initializing user:", error);
    }
  };

  const handleStep1Next = async () => {
    if (!userType) {
      setError("Please select your user type");
      return;
    }
    // Resume is now optional - user can skip
    if (!resumeFile) {
      // If no resume, go directly to step 2 with empty extracted data
      setExtractedData({
        skills: [],
      });
      setReviewData({
        overallExperience: 0,
        experience: 0,
        currentJob: {
          company: "",
          role: "",
          industry: "",
        },
        industries: [],
      });
      setCurrentStep(2);
      return;
    }

    try {
      setExtracting(true);
      setError("");

      // Extract data from resume
      const result = await userApi.extractResumeData(resumeFile);
      setExtractedData(result.extracted);

      // Pre-fill review data with extracted data
      setReviewData({
        overallExperience: result.extracted.experience || 0,
        experience: result.extracted.experience || 0,
        currentJob: {
          company: result.extracted.currentJob?.company || "",
          role: result.extracted.currentJob?.role || "",
          industry: result.extracted.currentJob?.industry || "",
        },
        industries: result.extracted.skills?.slice(0, 5) || [],
      });

      setCurrentStep(2);
    } catch (error: any) {
      console.error("Error extracting resume data:", error);
      setError(
        error.response?.data?.message ||
          "Failed to extract data from resume. Please try again."
      );
    } finally {
      setExtracting(false);
    }
  };

  const toggleIndustry = (industry: string) => {
    setReviewData((prev) => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter((i) => i !== industry)
        : [...prev.industries, industry],
    }));
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError("");

      if (!user) {
        setError("User not found. Please sign in again.");
        return;
      }

      // Complete onboarding
      await userApi.completeOnboarding({
        userType: userType as "student" | "fresher" | "experienced",
        experience:
          reviewData.overallExperience > 0
            ? reviewData.overallExperience
            : userType === "experienced"
            ? reviewData.experience
            : undefined,
        currentJob:
          userType === "experienced" && reviewData.currentJob.company
            ? reviewData.currentJob
            : undefined,
        industries:
          reviewData.industries.length > 0 ? reviewData.industries : undefined,
      });

      // Check if there's a return URL from resume builder
      const returnUrl = localStorage.getItem("resumeBuilderReturnUrl");
      if (returnUrl) {
        localStorage.removeItem("resumeBuilderReturnUrl");
        router.push(returnUrl);
        return;
      }

      // Check if there's a pending plan from homepage
      const pendingPlan = localStorage.getItem("pendingPlan");
      if (pendingPlan && ["starter", "pro", "exam_pack"].includes(pendingPlan)) {
        localStorage.removeItem("pendingPlan");
        // Redirect to checkout with the plan
        router.push(`/checkout?plan=${pendingPlan}`);
      } else {
        // Redirect to dashboard
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      setError(
        error.response?.data?.message ||
          "Failed to complete onboarding. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-landing-blue-50 via-landing-blue-100 to-landing-blue-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-landing-blue-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Get Started", icon: User },
    { number: 2, title: "Review & Confirm", icon: Eye },
    { number: 3, title: "Complete", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-landing-blue-50 via-landing-blue-100 to-landing-blue-200 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'rgb(37 99 235 / var(--tw-text-opacity, 1))' }}>
              Welcome to Interview Trix!
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Let's set up your profile to personalize your interview experience
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 border-purple-600 text-white shadow-lg scale-110"
                          : isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                      ) : (
                        <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </div>
                    <p
                      className={`text-xs sm:text-sm font-medium mt-2 ${
                        isActive ? "text-landing-blue-700" : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 sm:mx-4 rounded ${
                        isCompleted
                          ? "bg-green-500"
                          : currentStep > step.number
                          ? "bg-purple-300"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-2 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8 lg:p-10">
            {/* Step 1: User Type + CV Upload */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    Tell us about yourself
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    Select your profile type and upload your resume
                  </p>
                </div>

                {/* User Type Selection */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                    I am a...
                  </Label>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setUserType("student")}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        userType === "student"
                          ? "border-purple-500 bg-landing-blue-50 shadow-md scale-105"
                          : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-3">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        Student
                      </h3>
                      <p className="text-sm text-gray-600">
                        Currently studying or in college
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserType("fresher")}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        userType === "fresher"
                          ? "border-purple-500 bg-landing-blue-50 shadow-md scale-105"
                          : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-3">
                        <Rocket className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        Fresher
                      </h3>
                      <p className="text-sm text-gray-600">
                        Just graduated, looking for first job
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserType("experienced")}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        userType === "experienced"
                          ? "border-purple-500 bg-landing-blue-50 shadow-md scale-105"
                          : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-3">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        Experienced
                      </h3>
                      <p className="text-sm text-gray-600">
                        Have work experience, looking to switch
                      </p>
                    </button>
                  </div>
                </div>

                {/* Resume Upload */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                    Upload Your Resume/CV{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </Label>
                  {!resumeFile ? (
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                        isDragActive
                          ? "border-purple-500 bg-landing-blue-50 scale-105"
                          : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-landing-blue-50/50"
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Upload className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-base font-semibold text-gray-700 mb-2">
                        {isDragActive
                          ? "Drop your resume here"
                          : "Drag & drop your resume here"}
                      </p>
                      <p className="text-sm text-gray-500 mb-3">
                        or click to browse
                      </p>
                      <p className="text-xs text-gray-400 bg-white/60 px-3 py-1.5 rounded-full inline-block">
                        PDF only • Max 5 MB
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 shadow-lg">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            <FileText className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-gray-900 truncate">
                              {resumeFile.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setResumeFile(null)}
                          className="h-10 w-10 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Review Extracted Data */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    {extractedData && extractedData.name
                      ? "Review Extracted Information"
                      : "Complete Your Profile"}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    {extractedData && extractedData.name
                      ? "We've extracted information from your resume. Please review and confirm."
                      : "Please provide your professional details to personalize your experience."}
                  </p>
                </div>

                {/* Extracted Data Display */}
                <div className="space-y-4">
                  {extractedData?.name && (
                    <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                      <Label className="text-xs text-gray-600 mb-1 block">
                        Name
                      </Label>
                      <p className="font-semibold text-gray-900">
                        {extractedData.name}
                      </p>
                    </div>
                  )}

                  {/* Overall Experience (for all user types) */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Overall Experience (Years)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={reviewData.overallExperience || ""}
                      onChange={(e) =>
                        setReviewData((prev) => ({
                          ...prev,
                          overallExperience:
                            Number.parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      placeholder="Enter your overall experience in years"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Total years of experience (including internships,
                      projects, etc.)
                    </p>
                  </div>

                  {/* Work Experience (only for experienced users) */}
                  {userType === "experienced" && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Professional Work Experience (Years)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={reviewData.experience || ""}
                        onChange={(e) =>
                          setReviewData((prev) => ({
                            ...prev,
                            experience:
                              Number.parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        placeholder="Enter professional work experience"
                        className="w-full"
                      />
                    </div>
                  )}

                  {userType === "experienced" && (
                    <div className="space-y-3 p-4 bg-landing-blue-50 rounded-xl border-2 border-landing-blue-300">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Current Job Details
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">
                            Company
                          </Label>
                          <Input
                            value={reviewData.currentJob.company}
                            onChange={(e) =>
                              setReviewData((prev) => ({
                                ...prev,
                                currentJob: {
                                  ...prev.currentJob,
                                  company: e.target.value,
                                },
                              }))
                            }
                            placeholder="Enter company name"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">
                            Role
                          </Label>
                          <Input
                            value={reviewData.currentJob.role}
                            onChange={(e) =>
                              setReviewData((prev) => ({
                                ...prev,
                                currentJob: {
                                  ...prev.currentJob,
                                  role: e.target.value,
                                },
                              }))
                            }
                            placeholder="Enter your role"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">
                            Industry
                          </Label>
                          <Select
                            value={reviewData.currentJob.industry}
                            onValueChange={(value) =>
                              setReviewData((prev) => ({
                                ...prev,
                                currentJob: {
                                  ...prev.currentJob,
                                  industry: value,
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRIES.map((industry) => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills/Industries */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Industries of Interest (Optional)
                    </Label>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {INDUSTRIES.map((industry) => (
                        <button
                          key={industry}
                          type="button"
                          onClick={() => toggleIndustry(industry)}
                          className={`p-3 rounded-lg border-2 transition-all text-left text-sm ${
                            reviewData.industries.includes(industry)
                              ? "border-purple-500 bg-landing-blue-50"
                              : "border-gray-200 bg-white hover:border-purple-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {industry}
                            </span>
                            {reviewData.industries.includes(industry) && (
                              <CheckCircle className="w-4 h-4 text-landing-blue-700" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {extractedData?.skills && extractedData.skills.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                      <Label className="text-xs text-gray-600 mb-2 block">
                        Skills Detected
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {extractedData.skills.slice(0, 10).map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Complete */}
            {currentStep === 3 && (
              <div className="text-center space-y-6 py-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Ready to Complete!
                </h2>
                <p className="text-gray-600">
                  Click the button below to finish your profile setup.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  disabled={loading || extracting}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}

              <div className="flex-1" />

              {currentStep === 1 && (
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      // Skip onboarding - complete with minimal data
                      if (!userType) {
                        setError("Please select your user type first");
                        return;
                      }
                      try {
                        setLoading(true);
                        setError("");

                        if (!user) {
                          setError("User not found. Please sign in again.");
                          return;
                        }

                        // Ensure user exists in MongoDB
                        await userApi.createOrGetUser(
                          user.id,
                          user.primaryEmailAddress?.emailAddress || "",
                          user.fullName || user.firstName || "User"
                        );

                        // Complete onboarding with minimal data
                        await userApi.completeOnboarding({
                          userType: userType as
                            | "student"
                            | "fresher"
                            | "experienced",
                          experience: undefined,
                          currentJob: undefined,
                          industries: undefined,
                        });

                        // Check if there's a return URL from resume builder
                        const returnUrl = localStorage.getItem("resumeBuilderReturnUrl");
                        if (returnUrl) {
                          localStorage.removeItem("resumeBuilderReturnUrl");
                          router.push(returnUrl);
                        } else {
                          router.push("/dashboard");
                        }
                      } catch (error: any) {
                        console.error("Error skipping onboarding:", error);
                        setError(
                          error.response?.data?.message ||
                            "Failed to complete setup. Please try again."
                        );
                        setLoading(false);
                      }
                    }}
                    disabled={loading || extracting || !userType}
                    className="flex items-center gap-2"
                  >
                    Skip for Now
                  </Button>
                  <Button
                    type="button"
                    onClick={handleStep1Next}
                    disabled={extracting || !userType || !resumeFile}
                    className="bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 hover:from-landing-blue-800 hover:to-landing-blue-900 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    {extracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Extracting Data...
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      // Skip to complete with current data
                      try {
                        setLoading(true);
                        setError("");

                        if (!user) {
                          setError("User not found. Please sign in again.");
                          return;
                        }

                        // Ensure user exists in MongoDB
                        await userApi.createOrGetUser(
                          user.id,
                          user.primaryEmailAddress?.emailAddress || "",
                          user.fullName || user.firstName || "User"
                        );

                        // Complete onboarding with current data
                        await userApi.completeOnboarding({
                          userType: userType as
                            | "student"
                            | "fresher"
                            | "experienced",
                          experience:
                            reviewData.overallExperience > 0
                              ? reviewData.overallExperience
                              : userType === "experienced"
                              ? reviewData.experience
                              : undefined,
                          currentJob:
                            userType === "experienced" &&
                            reviewData.currentJob.company
                              ? reviewData.currentJob
                              : undefined,
                          industries:
                            reviewData.industries.length > 0
                              ? reviewData.industries
                              : undefined,
                        });

                        // Redirect to dashboard
                        // Check if there's a return URL from resume builder
                        const returnUrl = localStorage.getItem("resumeBuilderReturnUrl");
                        if (returnUrl) {
                          localStorage.removeItem("resumeBuilderReturnUrl");
                          router.push(returnUrl);
                        } else {
                          router.push("/dashboard");
                        }
                      } catch (error: any) {
                        console.error("Error completing onboarding:", error);
                        setError(
                          error.response?.data?.message ||
                            "Failed to complete setup. Please try again."
                        );
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    Skip for Now
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 hover:from-landing-blue-800 hover:to-landing-blue-900 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {currentStep === 3 && (
                <Button
                  type="button"
                  onClick={handleComplete}
                  disabled={loading}
                  className="bg-gradient-to-r from-landing-blue-600 to-landing-blue-700 hover:from-landing-blue-800 hover:to-landing-blue-900 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
