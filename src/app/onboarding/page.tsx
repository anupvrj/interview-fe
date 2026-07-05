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
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Rocket,
  TrendingUp,
  Upload,
  X,
  Eye,
} from "lucide-react";
import { isPaidPlanId } from "@/lib/pricingPageContent";
import { userApi } from "@/lib/api";
import { InstitutionAffiliationFields } from "@/components/profile/InstitutionAffiliationFields";
import {
  toOnboardingAffiliationPayload,
  type AffiliationValue,
} from "@/lib/affiliation-payload";
import {
  PDF_RESUME_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";
import { PageHeader } from "@/components/app/PageHeader";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

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
    null,
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

  const [affiliation, setAffiliation] = useState<AffiliationValue>({
    affiliationInstitutionId: null,
    affiliationInstitutionName: "",
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: pdfResumeDropzoneAccept,
    maxSize: PDF_RESUME_MAX_BYTES,
    multiple: false,
    validator: pdfResumeFileValidator,
    onDrop: (acceptedFiles, rejectedFiles) => {
      setError("");
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0];
        if (err.code === "file-too-large") {
          setError("File size must be less than 5 MB");
        } else {
          setError(err.message || "Only PDF files are allowed");
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
    let didRedirect = false;
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
        user.fullName || user.firstName || "User",
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
          didRedirect = true;
          router.replace(returnUrl);
          return;
        }

        const pendingPlan = localStorage.getItem("pendingPlan");
        if (pendingPlan === "enterprise") {
          localStorage.removeItem("pendingPlan");
          didRedirect = true;
          router.replace("/contact");
        } else if (pendingPlan && isPaidPlanId(pendingPlan)) {
          console.log("📦 Pending plan found, redirecting to checkout");
          localStorage.removeItem("pendingPlan");
          didRedirect = true;
          router.replace(`/checkout?plan=${pendingPlan}&cycle=monthly`);
        } else {
          if (pendingPlan) localStorage.removeItem("pendingPlan");
          console.log("🏠 Redirecting to dashboard");
          didRedirect = true;
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
      // Avoid briefly flashing the onboarding form if we've already triggered a redirect.
      if (!didRedirect) {
        setCheckingStatus(false);
      }
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
        user.fullName || user.firstName || "User",
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

    if (!user) {
      setError("User not found. Please sign in again.");
      return;
    }

    try {
      setExtracting(true);
      setError("");

      // Ensure MongoDB user exists before authenticated resume extract
      await userApi.createOrGetUser(
        user.id,
        user.primaryEmailAddress?.emailAddress || "",
        user.fullName || user.firstName || "User",
      );

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
          "Failed to extract data from resume. Please try again.",
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
        ...toOnboardingAffiliationPayload(affiliation),
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
      if (pendingPlan === "enterprise") {
        localStorage.removeItem("pendingPlan");
        router.push("/contact");
      } else if (pendingPlan && isPaidPlanId(pendingPlan)) {
        localStorage.removeItem("pendingPlan");
        router.push(`/checkout?plan=${pendingPlan}&cycle=monthly`);
      } else {
        if (pendingPlan) localStorage.removeItem("pendingPlan");
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      setError(
        error.response?.data?.message ||
          "Failed to complete onboarding. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || checkingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
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
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          badge="Welcome"
          title="Welcome to Interview Trix!"
          description="Let's set up your profile to personalize your interview experience"
          className="[&_.min-w-0]:flex [&_.min-w-0]:flex-col [&_.min-w-0]:items-center gap-6 text-center sm:flex-col sm:items-center sm:justify-center sm:text-center"
        />

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
                          ? "scale-110 border-primary bg-primary text-primary-foreground shadow-lg"
                          : isCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-border bg-card text-muted-foreground"
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
                        isActive ? "text-primary" : "text-gray-500"
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
                            ? "bg-primary/40"
                            : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card className={cn(appCard, "shadow-xl")}>
          <CardContent className="p-6 sm:p-8 lg:p-10">
            {/* Step 1: User Type + CV Upload */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg mx-auto mb-4">
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
                          ? "border-primary bg-primary-muted/30 shadow-md ring-2 ring-primary/20"
                          : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                      }`}
                    >
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-3">
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
                          ? "border-primary bg-primary-muted/30 shadow-md ring-2 ring-primary/20"
                          : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                      }`}
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-success text-white">
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
                          ? "border-primary bg-primary-muted/30 shadow-md ring-2 ring-primary/20"
                          : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                      }`}
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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

                <InstitutionAffiliationFields
                  value={affiliation}
                  onChange={setAffiliation}
                  disabled={loading || extracting}
                />

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
                          ? "border-primary bg-primary-muted/30 scale-[1.02]"
                          : "border-border bg-muted/40 hover:border-primary/60 hover:bg-primary-muted/20"
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
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
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
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
                    <div className="p-4 bg-muted rounded-xl border-2 border-border">
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
                    <div className="space-y-3 p-4 bg-muted rounded-xl border-2 border-border">
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
                              ? "border-primary bg-primary-muted/30"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {industry}
                            </span>
                            {reviewData.industries.includes(industry) && (
                              <CheckCircle className="w-4 h-4 text-primary" />
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
                          user.fullName || user.firstName || "User",
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
                          ...toOnboardingAffiliationPayload(affiliation),
                        });

                        // Check if there's a return URL from resume builder
                        const returnUrl = localStorage.getItem(
                          "resumeBuilderReturnUrl",
                        );
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
                            "Failed to complete setup. Please try again.",
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
                    className="bg-primary hover:bg-slate-900 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
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
                          user.fullName || user.firstName || "User",
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
                          ...toOnboardingAffiliationPayload(affiliation),
                        });

                        // Redirect to dashboard
                        // Check if there's a return URL from resume builder
                        const returnUrl = localStorage.getItem(
                          "resumeBuilderReturnUrl",
                        );
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
                            "Failed to complete setup. Please try again.",
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
                    className="bg-primary hover:bg-slate-900 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
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
                  className="bg-primary hover:bg-slate-900 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
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
