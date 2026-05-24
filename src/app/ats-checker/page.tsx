"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { resumeApi, resumeDataExtractionApi } from "@/lib/api";
import { extractTextFromPDF } from "@/lib/pdf-utils";
import {
  PDF_RESUME_MAX_BYTES,
  pdfResumeDropzoneAccept,
  pdfResumeFileValidator,
} from "@/lib/pdf-dropzone";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import type { FileRejection } from "react-dropzone";

type Step = "upload" | "processing" | "results";

/** Map extracted API sections to resume content shape; ensure array items have id for edit page */
function mapExtractedSectionsToContent(
  sections: Record<
    string,
    {
      sectionType: string;
      content: string | unknown;
      format: "html" | "list" | "paragraph" | "structured";
    }
  >,
): Record<string, unknown> {
  const content: Record<string, unknown> = {};
  const nanoid = () => Math.random().toString(36).substring(2, 11);

  for (const [sectionType, sectionData] of Object.entries(sections)) {
    if (sectionType === "personalInfo") {
      if (
        sectionData.format === "structured" &&
        typeof sectionData.content === "object" &&
        sectionData.content !== null &&
        !Array.isArray(sectionData.content)
      ) {
        content.personalInfo = sectionData.content;
      } else if (
        typeof sectionData.content === "object" &&
        sectionData.content !== null
      ) {
        content.personalInfo = sectionData.content;
      }
    } else if (sectionType === "technicalSkills") {
      content.skills = sectionData.content;
    } else if (sectionType === "skills") {
      content.skills = sectionData.content;
    } else if (
      sectionData.format === "structured" &&
      Array.isArray(sectionData.content)
    ) {
      // Ensure each item has an id for the edit page
      const arr = sectionData.content as Record<string, unknown>[];
      content[sectionType] = arr.map((item) =>
        item && typeof item === "object" && "id" in item
          ? item
          : { ...item, id: nanoid() },
      );
    } else if (typeof sectionData.content === "string") {
      content[sectionType] = sectionData.content;
    } else {
      content[sectionType] = sectionData.content;
    }
  }

  if (!content.customSections) {
    content.customSections = [];
  }

  return content;
}

export default function ATSCheckerPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsFeedback, setAtsFeedback] = useState<any>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = async (
    acceptedFiles: File[],
    fileRejections: FileRejection[],
  ) => {
    if (fileRejections.length > 0) {
      const err = fileRejections[0].errors[0];
      if (err.code === "file-too-large") {
        setError("File size must be less than 5 MB");
      } else {
        setError(err.message || "Only PDF files are allowed");
      }
      setStep("upload");
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    if (!user) {
      // Redirect to sign-in with return URL
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent("/ats-checker")}`,
      );
      return;
    }

    setUploadedFile(file);
    setError(null);
    await handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    if (!user) {
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent("/ats-checker")}`,
      );
      return;
    }

    try {
      setUploading(true);
      setStep("processing");

      // Step 1: Extract text from PDF
      const resumeText = await extractTextFromPDF(file);

      // Step 2: Create a temporary resume (does not count toward resume limit)
      const newResume = await resumeApi.create(user.id, {
        title: "ATS Check - " + file.name,
        templateId: "classic", // Use a template ID that exists in the app
        content: {
          personalInfo: {},
        },
        forAtsCheckOnly: true,
      });

      // Update resume with profile summary if needed
      if (resumeText) {
        try {
          await resumeApi.update(newResume.resumeId, {
            profileSummary: resumeText.substring(0, 500),
          });
        } catch (updateError) {
          console.warn("Failed to update profile summary:", updateError);
        }
      }

      setResumeId(newResume.resumeId);

      // Step 3: Upload PDF to the resume
      const { uploadUrl, s3Key } = await resumeApi.getPresignedUploadUrl(
        newResume.resumeId,
      );

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload PDF");
      }

      // Confirm upload
      await resumeApi.confirmPDFUpload(newResume.resumeId, s3Key);

      // Step 4: Extract data from PDF and apply to resume so "Improve Resume" has correct data
      try {
        const extractedData = await resumeDataExtractionApi.extractResumeData(
          "classic",
          resumeText,
        );
        const content = mapExtractedSectionsToContent(extractedData.sections);
        await resumeApi.update(newResume.resumeId, {
          content,
        });
      } catch (extractError) {
        console.warn(
          "Data extraction failed, continuing with ATS check:",
          extractError,
        );
      }

      // Step 5: Calculate ATS score
      setProcessing(true);
      const updatedResume = await resumeApi.recalculateATS(newResume.resumeId);

      setAtsScore(updatedResume.atsScore || 0);
      setAtsFeedback(updatedResume.atsFeedback);
      setStep("results");
    } catch (err: any) {
      console.error("Error processing resume:", err);
      setError(err.message || "Failed to process resume. Please try again.");
      setStep("upload");
      setUploadedFile(null);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: pdfResumeDropzoneAccept,
    maxSize: PDF_RESUME_MAX_BYTES,
    maxFiles: 1,
    validator: pdfResumeFileValidator,
    disabled: uploading || processing,
  });

  const handleImproveScore = () => {
    if (resumeId) {
      // Redirect to edit the resume
      router.push(`/dashboard/resumes/${resumeId}/edit`);
    } else {
      // Redirect to create new resume
      router.push("/dashboard/resumes/new");
    }
  };

  return (
    <div className="min-h-screen bg-background scroll-smooth selection:bg-info-muted">
      <SiteHeader />

      {/* Hero Section with Animated Background */}
      <section className="pt-32 sm:pt-40 lg:pt-48 pb-16 sm:pb-20 md:pb-24 lg:pb-28 px-4 sm:px-6 overflow-hidden bg-muted relative">
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
              <FileCheck className="w-12 h-12 sm:w-16 sm:h-16 text-primary/70" />
            </div>
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`file-${i}`}
              className="absolute"
              style={{
                left: `${(i * 16) % 100}%`,
                top: `${(i * 22) % 100}%`,
                opacity: 0.07,
                animation: `float-${i % 3} ${7 + (i % 2) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <FileText className="w-10 h-10 sm:w-14 sm:h-14 text-primary/50" />
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
              <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-300" />
            </div>
          ))}
        </div>

        <div className="container mx-auto max-w-4xl relative z-10">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FileCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
              Escape the ATS Black Hole
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
              AI filters resumes before recruiters see yours. Upload for an instant Smart ATS Score and clear fixes—then build and iterate with Interview Trix&apos;s AI Resume Builder until you&apos;re desk-ready.
            </p>
          </div>

          {/* Upload Step */}
          {step === "upload" && (
            <Card className="border-2 border-dashed border-border hover:border-primary bg-white/95 backdrop-blur-sm shadow-xl transition-colors">
              <CardContent className="p-8 sm:p-12">
                <div
                  {...getRootProps()}
                  className={`cursor-pointer text-center ${
                    isDragActive ? "opacity-70" : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {isDragActive
                      ? "Drop your resume here"
                      : "Upload Your Resume"}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Drag and drop your PDF resume, or click to browse
                  </p>
                  {uploadedFile && (
                    <div className="flex items-center justify-center gap-2 text-primary mb-4">
                      <FileText className="w-5 h-5" />
                      <span className="font-medium">{uploadedFile.name}</span>
                    </div>
                  )}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                      </div>
                    </div>
                  )}
                  {!user && (
                    <p className="text-sm text-gray-500 mt-4">
                      You'll be asked to sign in to check your ATS score
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Step */}
          {step === "processing" && (
            <Card className="border-2 border-border bg-white/95 backdrop-blur-sm shadow-xl">
              <CardContent className="p-8 sm:p-12 text-center">
                <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {uploading
                    ? "Uploading your resume..."
                    : "Analyzing your resume..."}
                </h3>
                <p className="text-gray-600 mb-6">
                  {uploading
                    ? "Please wait while we upload your file"
                    : "This may take a few moments. We're calculating your ATS score and generating detailed feedback."}
                </p>
                {processing && (
                  <div className="max-w-md mx-auto">
                    <Progress value={undefined} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results Step */}
          {step === "results" && atsScore !== null && (
            <div className="space-y-6">
              {/* Score Card */}
              <Card className="border-2 border-border bg-white/95 backdrop-blur-sm shadow-xl">
                <CardContent className="p-8 sm:p-12">
                  <div className="text-center mb-6">
                    <div className="text-6xl sm:text-7xl font-bold mb-2">
                      <span
                        className={
                          atsScore >= 80
                            ? "text-green-600"
                            : atsScore >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                        }
                      >
                        {atsScore}
                      </span>
                      <span className="text-4xl text-gray-400">/100</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <FileCheck
                        className={`w-6 h-6 ${
                          atsScore >= 80
                            ? "text-green-600"
                            : atsScore >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      />
                      <h2 className="text-2xl font-bold text-slate-900">
                        ATS Score
                      </h2>
                    </div>
                    <Progress
                      value={atsScore}
                      className={`h-3 mb-4 ${
                        atsScore >= 80
                          ? "[&>div]:bg-green-600"
                          : atsScore >= 60
                            ? "[&>div]:bg-yellow-600"
                            : "[&>div]:bg-red-600"
                      }`}
                    />
                    <p className="text-gray-600">
                      {atsScore >= 80
                        ? "Excellent! Your resume is well-optimized for ATS systems."
                        : atsScore >= 60
                          ? "Good, but there's room for improvement."
                          : "Your resume needs optimization to pass ATS systems."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback Card */}
              {atsFeedback && (
                <Card className="border-2 border-border bg-white/95 backdrop-blur-sm shadow-xl">
                  <CardContent className="p-8 sm:p-12">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">
                      Detailed Feedback
                    </h3>
                    <div className="space-y-6">
                      {atsFeedback.strengths &&
                        atsFeedback.strengths.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <h4 className="text-lg font-semibold text-slate-900">
                                Strengths
                              </h4>
                            </div>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-7">
                              {atsFeedback.strengths.map(
                                (strength: string, idx: number) => (
                                  <li key={idx}>{strength}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {atsFeedback.weaknesses &&
                        atsFeedback.weaknesses.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                              <h4 className="text-lg font-semibold text-slate-900">
                                Areas for Improvement
                              </h4>
                            </div>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-7">
                              {atsFeedback.weaknesses.map(
                                (weakness: string, idx: number) => (
                                  <li key={idx}>{weakness}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {atsFeedback.suggestions &&
                        atsFeedback.suggestions.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-5 h-5 text-primary" />
                              <h4 className="text-lg font-semibold text-slate-900">
                                Suggestions
                              </h4>
                            </div>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-7">
                              {atsFeedback.suggestions.map(
                                (suggestion: string, idx: number) => (
                                  <li key={idx}>{suggestion}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {atsFeedback.keywords && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h4 className="text-lg font-semibold text-slate-900">
                              Keywords
                            </h4>
                          </div>
                          <div className="space-y-3">
                            {atsFeedback.keywords.missing &&
                              atsFeedback.keywords.missing.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-600 mb-2">
                                    Missing Keywords:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {atsFeedback.keywords.missing.map(
                                      (keyword: string, idx: number) => (
                                        <span
                                          key={idx}
                                          className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                                        >
                                          {keyword}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            {atsFeedback.keywords.priority &&
                              atsFeedback.keywords.priority.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-600 mb-2">
                                    Priority Keywords:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {atsFeedback.keywords.priority.map(
                                      (keyword: string, idx: number) => (
                                        <span
                                          key={idx}
                                          className="px-3 py-1 bg-muted text-primary rounded-full text-sm"
                                        >
                                          {keyword}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CTA Button */}
              <Card className="bg-card border-2 border-border shadow-xl">
                <CardContent className="p-8 sm:p-12 text-center">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    Ready to Improve Your ATS Score?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Use our AI-powered resume builder to optimize your resume
                    and boost your ATS score. Get access to professional
                    templates, AI suggestions, and real-time ATS scoring.
                  </p>
                  <Button
                    size="lg"
                    onClick={handleImproveScore}
                    className="text-white font-medium shadow-lg transition-all h-12 px-8 hover:opacity-90 !bg-primary text-base sm:text-lg hover:!bg-slate-900"
                  >
                    Improve Your Resume
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
