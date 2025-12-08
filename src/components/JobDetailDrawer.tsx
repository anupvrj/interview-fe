"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  MapPin,
  Building,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Loader2,
} from "lucide-react";
import { jobsApi } from "@/lib/api";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  jobType: string;
  url: string;
  postedAt: string;
  fitScore: number;
  atsMatch: number;
  readiness: number;
  missingSkills: string[];
  strengths: string[];
}

interface JobDetail extends Job {
  description?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}

interface JobDetailDrawerProps {
  readonly job: Job;
  readonly open: boolean;
  readonly onClose: () => void;
}

export function JobDetailDrawer({ job, open, onClose }: JobDetailDrawerProps) {
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && job) {
      loadJobDetail();
    }
  }, [open, job]);

  const loadJobDetail = async () => {
    setLoading(true);
    try {
      const jobDetail = await jobsApi.getById(job.id);
      setJobDetail(jobDetail);
    } catch (error) {
      console.error("Error loading job details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const formatSalary = (salary?: {
    min?: number;
    max?: number;
    currency?: string;
  }) => {
    if (!salary || (!salary.min && !salary.max)) return null;

    const currency = salary.currency === "INR" ? "₹" : salary.currency || "₹";
    const formatAmount = (amount: number) => {
      if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
      if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
      return amount.toLocaleString();
    };

    if (salary.min && salary.max) {
      return `${currency}${formatAmount(
        salary.min
      )} - ${currency}${formatAmount(salary.max)}`;
    } else if (salary.min) {
      return `${currency}${formatAmount(salary.min)}+`;
    } else if (salary.max) {
      return `Up to ${currency}${formatAmount(salary.max)}`;
    }
    return null;
  };

  const getReadinessMessage = (readiness: number) => {
    if (readiness >= 80) {
      return "You're well-prepared for this role! Your interview skills align well with the requirements.";
    } else if (readiness >= 60) {
      return "You have good potential for this role. Consider practicing a few more interviews to boost your confidence.";
    } else {
      return "This role might be challenging. Consider taking more practice interviews to improve your readiness.";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {job.company.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-bold text-gray-900 mb-2">
                {job.title}
              </SheetTitle>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Building className="w-4 h-4" />
                <span className="font-medium">{job.company}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                  {job.remote && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-green-100 text-green-700"
                    >
                      Remote
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(job.postedAt)}</span>
                </div>
                <Badge variant="outline">{job.jobType}</Badge>
              </div>
            </div>
          </div>

          {/* Salary */}
          {jobDetail?.salary && formatSalary(jobDetail.salary) && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-700">
                {formatSalary(jobDetail.salary)}
              </span>
            </div>
          )}
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Fit Score Overview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5" />
                AI Fit Analysis
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-lg ${getScoreBgColor(job.fitScore)}`}
                >
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        job.fitScore
                      )}`}
                    >
                      {job.fitScore}%
                    </div>
                    <div className="text-sm font-medium text-gray-600">
                      Overall Fit
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg ${getScoreBgColor(job.atsMatch)}`}
                >
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        job.atsMatch
                      )}`}
                    >
                      {job.atsMatch}%
                    </div>
                    <div className="text-sm font-medium text-gray-600">
                      ATS Match
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg ${getScoreBgColor(job.readiness)}`}
                >
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        job.readiness
                      )}`}
                    >
                      {job.readiness}%
                    </div>
                    <div className="text-sm font-medium text-gray-600">
                      Interview Ready
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  {getReadinessMessage(job.readiness)}
                </p>
              </div>
            </div>

            {/* Skills Analysis */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Skills Analysis</h3>

              {job.strengths.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Your Strengths
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.strengths.map((skill) => (
                      <Badge
                        key={skill}
                        className="bg-green-100 text-green-700 border-green-200"
                      >
                        ✓ {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {job.missingSkills.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-orange-700 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Skills to Develop
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.missingSkills.map((skill) => (
                      <Badge
                        key={skill}
                        className="bg-orange-100 text-orange-700 border-orange-200"
                      >
                        • {skill}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Consider learning these skills or highlighting related
                    experience to improve your match.
                  </p>
                </div>
              )}
            </div>

            {/* Job Description */}
            {jobDetail?.description && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Job Description</h3>
                <div className="prose prose-sm max-w-none">
                  <div
                    className="text-gray-700 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: jobDetail.description }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-6 border-t">
              <Button
                onClick={() => window.open(job.url, "_blank")}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                size="lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Apply for this Job
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    alert("Save job functionality coming soon!");
                  }}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Save Job
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `${job.title} at ${job.company}`,
                        url: job.url,
                      });
                    } else {
                      navigator.clipboard.writeText(job.url);
                      alert("Job link copied to clipboard!");
                    }
                  }}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Share Job
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
