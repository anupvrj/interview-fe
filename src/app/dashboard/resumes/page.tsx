"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { Resume, resumeApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ResumesPage() {
  const { user, isLoaded } = useUser();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadResumes();
    }
  }, [isLoaded, user]);

  const loadResumes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await resumeApi.list(user.id);
      setResumes(data);
    } catch (error) {
      console.error("Error loading resumes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resumeId: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;

    try {
      setDeletingId(resumeId);
      await resumeApi.delete(resumeId);
      await loadResumes();
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert("Failed to delete resume. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (resumeId: string) => {
    try {
      await resumeApi.duplicate(resumeId);
      await loadResumes();
    } catch (error) {
      console.error("Error duplicating resume:", error);
      alert("Failed to duplicate resume. Please try again.");
    }
  };

  const handleDownload = async (resumeId: string) => {
    try {
      setDownloadingId(resumeId);
      const pdfUrl = await resumeApi.downloadPDF(resumeId);
      window.open(pdfUrl, "_blank");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 p-6 lg:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FileEdit className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Resume Builder</h1>
          </div>
          <p className="text-base lg:text-lg text-white/90 max-w-2xl">
            Create ATS-friendly resumes with professional templates. Build,
            edit, and download unlimited resumes.
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Quick Stats */}
      {resumes.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-4 lg:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Total Resumes
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {resumes.length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {averageATSScore > 0 && (
            <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-4 lg:pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Avg ATS Score
                    </p>
                    <p
                      className={`text-2xl lg:text-3xl font-bold ${
                        averageATSScore >= 80
                          ? "text-green-600"
                          : averageATSScore >= 70
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {Math.round(averageATSScore)}%
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-4 lg:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    ATS Ready
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {
                      resumes.filter((r) => r.atsScore && r.atsScore >= 80)
                        .length
                    }
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        <Link href="/dashboard/resumes/new">
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Resume
          </Button>
        </Link>
      </div>

      {/* Resumes List */}
      {resumes.length === 0 ? (
        <Card className="border-2 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-16 pb-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileEdit className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No resumes yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              Create your first ATS-friendly resume with our professional
              templates
            </p>
            <Link href="/dashboard/resumes/new">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Resume
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {resumes.map((resume) => (
            <Card
              key={resume._id}
              className="border-2 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all group"
            >
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                      {resume.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatDate(resume.updatedAt)}
                    </p>
                    {resume.atsScore !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          ATS Score:
                        </span>
                        <span
                          className={`text-sm font-bold ${
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
                    <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                      Default
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Link
                    href={`/dashboard/resumes/${resume.resumeId}/edit`}
                    className="flex-1 min-w-[80px] sm:min-w-[100px]"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 text-xs sm:text-sm"
                    >
                      <Edit className="w-3 h-3 mr-1 sm:mr-1.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(resume.resumeId)}
                    disabled={downloadingId === resume.resumeId}
                    className="flex-1 min-w-[80px] sm:min-w-[100px] border-blue-300 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
                  >
                    {downloadingId === resume.resumeId ? (
                      <Loader2 className="w-3 h-3 mr-1 sm:mr-1.5 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3 mr-1 sm:mr-1.5" />
                    )}
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(resume.resumeId)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-shrink-0"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(resume.resumeId)}
                    disabled={deletingId === resume.resumeId}
                    className="border-red-300 text-red-700 hover:bg-red-50 flex-shrink-0"
                    title="Delete"
                  >
                    {deletingId === resume.resumeId ? (
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
