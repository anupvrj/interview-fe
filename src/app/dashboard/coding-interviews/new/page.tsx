"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Code2,
  Sparkles,
  Crown,
  CheckCircle,
  Zap,
  Target,
  Clock,
  Globe,
  Building2,
  Briefcase,
  FileText,
  Upload,
  X,
  Mic,
  BarChart3,
} from "lucide-react";
import {
  codingInterviewApi,
  paymentApi,
  userApi,
  User,
} from "@/lib/api";
import {
  PDF_RESUME_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";

const disciplineOptionsByDepartment: Record<
  string,
  Array<{ value: string; label: string }>
> = {
  engineering: [
    { value: "cse", label: "CSE" },
    { value: "it", label: "IT" },
    { value: "mech", label: "Mechanical" },
    { value: "civil", label: "Civil" },
  ],
  management: [
    { value: "mba", label: "MBA" },
    { value: "bba", label: "BBA" },
  ],
};

export default function NewCodingInterviewPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [useSavedResume, setUseSavedResume] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [limitCheck, setLimitCheck] = useState<any>(null);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [formData, setFormData] = useState({
    role: "",
    experience: "0",
    language: "en",
    department: "",
    discipline: "",
    targetCompany: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const profile = await userApi.getMyProfile();
      setUserProfile(profile);
      if (profile.resume) {
        setUseSavedResume(true);
      } else {
        setUseSavedResume(false);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const checkInterviewLimit = async () => {
    if (!user) return;
    setCheckingLimit(true);
    try {
      const result = await paymentApi.checkInterviewLimit();
      setLimitCheck(result);
    } catch (error: unknown) {
      console.error("Error checking limit:", error);
    } finally {
      setCheckingLimit(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadUserProfile();
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("payment") === "success") {
        setTimeout(() => {
          checkInterviewLimit();
        }, 1000);
      } else {
        checkInterviewLimit();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: pdfResumeDropzoneAccept,
    maxSize: PDF_RESUME_MAX_BYTES,
    multiple: false,
    validator: pdfResumeFileValidator,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0];
        if (err.code === "file-too-large") {
          setErrors((prev) => ({
            ...prev,
            resume: "File size must be less than 5 MB",
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            resume: err.message || "Only PDF files are allowed",
          }));
        }
        return;
      }
      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
        setErrors((prev) => ({ ...prev, resume: "" }));
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrors({ form: "Please sign in to continue" });
      return;
    }

    const limitResult = await paymentApi.checkInterviewLimit();
    if (!limitResult.allowed) {
      setLimitCheck(limitResult);
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!formData.role.trim()) {
      newErrors.role = "Role is required";
    }
    if (!useSavedResume && !uploadedFile) {
      newErrors.resume = "Please upload your resume or use saved resume";
    }
    if (useSavedResume && !userProfile?.resume) {
      newErrors.resume = "No saved resume — upload a file below";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await codingInterviewApi.create(user.id, {
        role: formData.role.trim(),
        experience: parseInt(formData.experience, 10) || 0,
        language: formData.language as "en" | "hi",
        department: formData.department
          ? (formData.department as
              | "engineering"
              | "management"
              | "commerce_finance"
              | "healthcare_pharma"
              | "marketing"
              | "sales"
              | "general")
          : undefined,
        discipline: formData.discipline
          ? (formData.discipline as
              | "cse"
              | "it"
              | "mech"
              | "civil"
              | "mba"
              | "bba"
              | "none")
          : undefined,
        targetCompany: formData.targetCompany.trim() || undefined,
        resume: useSavedResume ? undefined : uploadedFile || undefined,
        useSavedResume:
          useSavedResume && userProfile?.resume ? true : undefined,
      });
      router.push(
        `/dashboard/coding-interviews/${res.data.interviewId}?autostart=1`,
      );
    } catch (err: unknown) {
      console.error("Error creating coding session:", err);
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create coding session. Please try again.";
      if (
        typeof errorMessage === "string" &&
        (errorMessage.includes("limit") || errorMessage.includes("upgrade"))
      ) {
        await checkInterviewLimit();
      }
      setErrors({ form: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 lg:space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" asChild className="-ml-2 text-slate-600">
          <Link href="/dashboard/coding-interviews">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Hero — aligned with Practice Interview */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-4 text-white sm:p-6 lg:p-8">
        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Code2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Start Your Practice Coding Round
            </h1>
          </div>
          <p className="max-w-2xl text-base text-white/90 lg:text-lg">
            Solve interview-style problems, run tests, then discuss your
            approach with AI — same credit rules as AI Interview Practice.
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-transparent opacity-50" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-blue-500/20 blur-2xl" />
      </div>

      {checkingLimit ? (
        <Card className="border-2 border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3 py-4">
              <Loader2 className="h-6 w-6 animate-spin text-[rgb(37,99,235)]" />
              <p className="font-medium text-gray-700">
                Checking your interview limit...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : limitCheck && !limitCheck.allowed ? (
        <Card className="border-2 border-orange-400 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-start gap-6 md:flex-row">
              <div className="flex-shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                  <Crown className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="mb-3 text-2xl font-bold text-gray-900">
                  Upgrade Your Free Tier
                </h3>
                <p className="mb-4 text-lg text-gray-700">
                  {limitCheck.reason ||
                    "Insufficient credits. Purchase more credits to continue!"}
                </p>
                {limitCheck.creditsAvailable !== undefined &&
                  limitCheck.minimumRequired !== undefined && (
                    <div className="mb-6 rounded-xl bg-white/60 p-4 backdrop-blur-sm">
                      <p className="mb-2 text-sm text-gray-700">
                        <span className="font-semibold">Available Credits: </span>
                        <span className="text-lg font-bold text-orange-600">
                          {limitCheck.creditsAvailable}
                        </span>
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Required: </span>
                        <span className="text-lg font-bold text-red-600">
                          {limitCheck.minimumRequired}
                        </span>{" "}
                        credits (session)
                      </p>
                      <p className="mt-2 text-xs text-gray-600">
                        💡 Same credit rules as practice interviews • Purchase
                        credits to continue
                      </p>
                    </div>
                  )}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() => router.push("/dashboard/plan")}
                    size="lg"
                    className="!bg-emerald-600 text-white shadow-lg transition-all hover:!bg-emerald-700 hover:shadow-xl"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Purchase Credits
                  </Button>
                  <Button
                    onClick={() => router.push("/pricing")}
                    size="lg"
                    variant="outline"
                    className="border-2 border-[rgb(37,99,235)] text-[rgb(37,99,235)] hover:bg-blue-50"
                  >
                    <Crown className="mr-2 h-5 w-5" />
                    View Plans
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : limitCheck && limitCheck.allowed ? (
        <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-md">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  You have{" "}
                  <span className="text-xl font-bold text-green-600">
                    {limitCheck.creditsAvailable || 0}
                  </span>{" "}
                  credits available
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Ready to start your coding round (same credits as AI Interview
                  Practice)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {limitCheck && limitCheck.allowed && (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-4 sm:space-y-6 lg:col-span-2">
            <Card className="overflow-hidden border-2 border-blue-200/50 bg-white/95 shadow-xl backdrop-blur-sm">
              <CardHeader className="px-3 pb-3 sm:px-6 sm:pb-4">
                <div className="mb-2 flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 sm:h-10 sm:w-10">
                    <Briefcase className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                  </div>
                  <CardTitle className="text-base sm:text-xl lg:text-2xl">
                    Session details
                  </CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  We use this to match problem difficulty and discussion context
                  (same as practice interviews)
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="role"
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                    >
                      <Target className="h-4 w-4 flex-shrink-0 text-[rgb(37,99,235)]" />
                      Role You&apos;re Preparing For
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="role"
                      placeholder="e.g., Software Developer"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className={`h-11 w-full text-sm sm:h-12 sm:text-base ${
                        errors.role
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-[rgb(37,99,235)] focus:ring-[rgb(37,99,235)]"
                      } transition-all`}
                    />
                    {errors.role && (
                      <p className="flex items-center gap-1 text-sm text-red-600">
                        <X className="h-4 w-4" />
                        {errors.role}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="experience"
                        className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                      >
                        <Clock className="h-4 w-4 text-blue-600" />
                        Years of Experience
                      </Label>
                      <Select
                        value={formData.experience}
                        onValueChange={(value) =>
                          setFormData({ ...formData, experience: value })
                        }
                      >
                        <SelectTrigger className="h-11 w-full text-sm sm:h-12 sm:text-base">
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Fresher</SelectItem>
                          <SelectItem value="1">1 Year</SelectItem>
                          <SelectItem value="2">2 Years</SelectItem>
                          <SelectItem value="3">3 Years</SelectItem>
                          <SelectItem value="4">4 Years</SelectItem>
                          <SelectItem value="5">5+ Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="language"
                        className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                      >
                        <Globe className="h-4 w-4 text-green-600" />
                        Interview Language
                      </Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value) =>
                          setFormData({ ...formData, language: value })
                        }
                      >
                        <SelectTrigger className="h-11 w-full text-sm sm:h-12 sm:text-base">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="department"
                        className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                      >
                        <Briefcase className="h-4 w-4 text-indigo-600" />
                        Department (Optional)
                      </Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            department: value,
                            discipline:
                              disciplineOptionsByDepartment[value]?.some(
                                (option) => option.value === prev.discipline,
                              )
                                ? prev.discipline
                                : "",
                          }));
                        }}
                      >
                        <SelectTrigger className="h-11 w-full text-sm sm:h-12 sm:text-base">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="management">Management</SelectItem>
                          <SelectItem value="commerce_finance">
                            Commerce & Finance
                          </SelectItem>
                          <SelectItem value="healthcare_pharma">
                            Healthcare & Pharma
                          </SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="discipline"
                        className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                      >
                        <Building2 className="h-4 w-4 text-teal-600" />
                        Discipline (Optional)
                      </Label>
                      <Select
                        value={formData.discipline}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, discipline: value }))
                        }
                        disabled={
                          !disciplineOptionsByDepartment[formData.department]
                        }
                      >
                        <SelectTrigger className="h-11 w-full text-sm sm:h-12 sm:text-base">
                          <SelectValue placeholder="Select discipline" />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            disciplineOptionsByDepartment[formData.department] ??
                            []
                          ).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="targetCompany"
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                    >
                      <Building2 className="h-4 w-4 flex-shrink-0 text-pink-600" />
                      Target Company (Optional)
                    </Label>
                    <Input
                      id="targetCompany"
                      placeholder="e.g., TCS, Amazon, Google"
                      value={formData.targetCompany}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetCompany: e.target.value,
                        })
                      }
                      className="h-11 w-full border-gray-300 text-sm transition-all focus:border-[rgb(37,99,235)] focus:ring-[rgb(37,99,235)] sm:h-12 sm:text-base"
                    />
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <Zap className="h-3 w-3" />
                      Helps match problem difficulty to company tier
                    </p>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 sm:text-sm">
                      <FileText className="h-3.5 w-3.5 flex-shrink-0 text-[rgb(37,99,235)] sm:h-4 sm:w-4" />
                      Resume
                      <span className="text-red-500">*</span>
                    </Label>

                    {userProfile?.resume && (
                      <div className="space-y-2">
                        <div
                          className={`relative cursor-pointer rounded-lg border-2 p-2.5 transition-all sm:p-3 ${
                            useSavedResume
                              ? "border-[rgb(37,99,235)] bg-gradient-to-br from-blue-50 to-blue-100/50"
                              : "border-gray-200 bg-white"
                          }`}
                          onClick={() => {
                            setUseSavedResume(true);
                            setUploadedFile(null);
                            setErrors({ ...errors, resume: "" });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setUseSavedResume(true);
                              setUploadedFile(null);
                              setErrors({ ...errors, resume: "" });
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div
                              className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 sm:h-5 sm:w-5 ${
                                useSavedResume
                                  ? "border-[rgb(37,99,235)] bg-[rgb(37,99,235)]"
                                  : "border-gray-300"
                              }`}
                            >
                              {useSavedResume && (
                                <div className="h-1.5 w-1.5 rounded-full bg-white sm:h-2 sm:w-2" />
                              )}
                            </div>
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 sm:h-10 sm:w-10">
                              <FileText className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-gray-900 sm:text-sm">
                                {userProfile.resume.filename}
                              </p>
                              <p className="truncate text-xs text-gray-500">
                                {new Date(
                                  userProfile.resume.uploadedAt,
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            {useSavedResume && (
                              <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500 sm:h-6 sm:w-6" />
                            )}
                          </div>
                        </div>
                        <p className="pl-11 text-xs text-gray-500 sm:pl-12">
                          Or upload new below
                        </p>
                      </div>
                    )}

                    <div
                      className={`relative cursor-pointer rounded-lg border-2 p-2.5 transition-all sm:p-3 ${
                        !useSavedResume
                          ? "border-[rgb(37,99,235)] bg-gradient-to-br from-blue-50 to-blue-100/50"
                          : "border-gray-200 bg-white"
                      }`}
                      onClick={() => {
                        setUseSavedResume(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setUseSavedResume(false);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 sm:h-5 sm:w-5 ${
                            !useSavedResume
                              ? "border-[rgb(37,99,235)] bg-[rgb(37,99,235)]"
                              : "border-gray-300"
                          }`}
                        >
                          {!useSavedResume && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white sm:h-2 sm:w-2" />
                          )}
                        </div>
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 sm:h-10 sm:w-10">
                          <Upload className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                        </div>
                        <span className="flex-1 text-xs font-semibold text-gray-900 sm:text-sm">
                          Upload new resume
                        </span>
                        {!useSavedResume && (
                          <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500 sm:h-6 sm:w-6" />
                        )}
                      </div>
                    </div>

                    {!useSavedResume && (
                      <div className="mt-2">
                        {!uploadedFile ? (
                          <div
                            {...getRootProps()}
                            className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-all sm:p-6 ${
                              isDragActive
                                ? "border-[rgb(37,99,235)] bg-gradient-to-br from-blue-50 to-blue-100/50"
                                : errors.resume
                                  ? "border-red-400 bg-red-50"
                                  : "border-gray-300 bg-gray-50/50"
                            }`}
                          >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center gap-2 sm:gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 sm:h-14 sm:w-14">
                                <Upload className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                              </div>
                              <div>
                                <p className="mb-1 text-xs font-semibold text-gray-700 sm:text-sm">
                                  {isDragActive ? "Drop here" : "Tap to upload"}
                                </p>
                                <p className="text-xs text-gray-400">
                                  PDF only • Max 5 MB
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 p-2.5 sm:p-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 sm:h-12 sm:w-12">
                                <FileText className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-gray-900 sm:text-sm">
                                  {uploadedFile.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {(uploadedFile.size / 1024 / 1024).toFixed(2)}{" "}
                                  MB
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setUploadedFile(null)}
                                className="h-8 w-8 flex-shrink-0 rounded-lg hover:bg-red-100 hover:text-red-600 sm:h-9 sm:w-9"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {errors.resume && (
                      <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
                        <X className="h-4 w-4" />
                        {errors.resume}
                      </p>
                    )}
                  </div>

                  {errors.form && (
                    <div className="flex items-start gap-2 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <X className="mt-0.5 h-5 w-5 flex-shrink-0" />
                      <span>{errors.form}</span>
                    </div>
                  )}

                  <div className="pt-2 sm:pt-3">
                    <Button
                      type="submit"
                      size="lg"
                      className="h-11 w-full text-sm font-semibold !bg-[rgb(37,99,235)] text-white shadow-lg transition-all hover:!bg-[rgb(17,24,39)] hover:shadow-xl sm:h-12 sm:text-base"
                      disabled={loading || (limitCheck && !limitCheck.allowed)}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          Start coding round
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-xl">
              <CardHeader className="pb-4">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">What happens next?</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-md">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-gray-900">
                        Problem mix
                      </p>
                      <p className="text-xs text-gray-600">
                        Three problems matched to your resume, role, and target
                        company tier
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-md">
                      <Code2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-gray-900">
                        Code & test
                      </p>
                      <p className="text-xs text-gray-600">
                        Monaco editor — run public tests, then submit for hidden
                        cases
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-md">
                      <Mic className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-gray-900">
                        AI Interview Practice discussion
                      </p>
                      <p className="text-xs text-gray-600">
                        Discuss your approach with AI (microphone required)
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-md">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-gray-900">
                        Full report
                      </p>
                      <p className="text-xs text-gray-600">
                        Coding and discussion scores in your dashboard
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
