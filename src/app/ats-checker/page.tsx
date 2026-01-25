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
import { NavigationMenu } from "@/components/NavigationMenu";

type Step = "upload" | "processing" | "results";

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

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!user) {
      // Redirect to sign-in with return URL
      router.push(`/sign-in?redirect_url=${encodeURIComponent("/ats-checker")}`);
      return;
    }

    setUploadedFile(file);
    setError(null);
    await handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    if (!user) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent("/ats-checker")}`);
      return;
    }

    try {
      setUploading(true);
      setStep("processing");

      // Step 1: Extract text from PDF
      const resumeText = await extractTextFromPDF(file);

      // Step 2: Create a temporary resume
      const newResume = await resumeApi.create(user.id, {
        title: "ATS Check - " + file.name,
        templateId: "professional-classic", // Default template
        content: {
          personalInfo: {},
        },
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
      const { uploadUrl, s3Key } = await resumeApi.getPresignedUploadUrl(newResume.resumeId);

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

      // Step 4: Extract data from PDF (optional - skip if it fails)
      try {
        await resumeDataExtractionApi.extractResumeData("professional-classic", resumeText);
      } catch (extractError) {
        console.warn("Data extraction failed, continuing with ATS check:", extractError);
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
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
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
    <div className="min-h-screen bg-white">
      <NavigationMenu />
      
      <div className="pt-20 pb-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FileCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              ATS Score Checker
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your resume to get an instant ATS score and detailed feedback
            </p>
          </div>

          {/* Upload Step */}
          {step === "upload" && (
            <Card className="border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors">
              <CardContent className="p-8 sm:p-12">
                <div
                  {...getRootProps()}
                  className={`cursor-pointer text-center ${
                    isDragActive ? "opacity-70" : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-10 h-10 text-blue-600" />
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
                    <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
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
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {uploading ? "Uploading your resume..." : "Analyzing your resume..."}
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
              <Card className="border-2 border-blue-200">
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
                      <h2 className="text-2xl font-bold text-slate-900">ATS Score</h2>
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
                <Card>
                  <CardContent className="p-8 sm:p-12">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">
                      Detailed Feedback
                    </h3>
                    <div className="space-y-6">
                      {atsFeedback.strengths && atsFeedback.strengths.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h4 className="text-lg font-semibold text-slate-900">
                              Strengths
                            </h4>
                          </div>
                          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-7">
                            {atsFeedback.strengths.map((strength: string, idx: number) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {atsFeedback.weaknesses && atsFeedback.weaknesses.length > 0 && (
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
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {atsFeedback.suggestions && atsFeedback.suggestions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            <h4 className="text-lg font-semibold text-slate-900">
                              Suggestions
                            </h4>
                          </div>
                          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-7">
                            {atsFeedback.suggestions.map(
                              (suggestion: string, idx: number) => (
                                <li key={idx}>{suggestion}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {atsFeedback.keywords && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
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
                                      )
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
                                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                        >
                                          {keyword}
                                        </span>
                                      )
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
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                <CardContent className="p-8 sm:p-12 text-center">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    Ready to Improve Your ATS Score?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Use our AI-powered resume builder to optimize your resume and boost your ATS score. Get access to professional templates, AI suggestions, and real-time ATS scoring.
                  </p>
                  <Button
                    size="lg"
                    onClick={handleImproveScore}
                    className="text-white font-medium shadow-lg transition-all h-12 px-8 hover:opacity-90 !bg-[rgb(37,99,235)] text-base sm:text-lg hover:!bg-[rgb(17,24,39)]"
                  >
                    Improve Your Resume
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

