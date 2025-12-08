"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Briefcase,
  MapPin,
  Settings,
  Target,
  Star,
  Loader2,
  Search,
  ChevronRight,
  Building,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { JobPreferencesForm } from "@/components/JobPreferencesForm";
import { JobDetailDrawer } from "@/components/JobDetailDrawer";
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

interface JobPreferences {
  preferredTitles: string[];
  locations: string[];
  experienceBand: string;
  remoteOnly: boolean;
  minSalary?: number;
  keywords: string[];
}

export default function JobsPage() {
  const { user, isLoaded } = useUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [preferences, setPreferences] = useState<JobPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      loadJobPreferences();
      loadRecommendedJobs();
    }
  }, [isLoaded, user]);

  const loadJobPreferences = async () => {
    try {
      const preferences = await jobsApi.getPreferences();
      setPreferences(preferences);
    } catch (error) {
      console.error("Error loading job preferences:", error);
      // No preferences set yet, show preferences form
      setShowPreferences(true);
    }
  };

  const loadRecommendedJobs = async (pageNum = 1) => {
    try {
      const data = await jobsApi.getRecommended(pageNum, 20);
      if (pageNum === 1) {
        setJobs(data.jobs);
      } else {
        setJobs((prev) => [...prev, ...data.jobs]);
      }
      setHasMore(data.jobs.length === 20);
    } catch (error) {
      console.error("Error loading recommended jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (newPreferences: JobPreferences) => {
    try {
      const updatedPreferences = await jobsApi.updatePreferences(
        newPreferences
      );
      setPreferences(updatedPreferences);
      setShowPreferences(false);
      // Reload jobs with new preferences
      setLoading(true);
      setPage(1);
      await loadRecommendedJobs(1);
    } catch (error) {
      console.error("Error updating job preferences:", error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-700 border-green-200";
    if (score >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
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

  const filteredJobs = jobs.filter((job) =>
    searchQuery
      ? job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading job recommendations...</p>
        </div>
      </div>
    );
  }

  if (showPreferences || !preferences) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            AI Job Hunting
          </h1>
          <p className="text-lg text-gray-600">
            Set your job preferences to get personalized recommendations
          </p>
        </div>
        <JobPreferencesForm
          initialPreferences={preferences}
          onSave={handlePreferencesUpdate}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 lg:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              AI Job Recommendations
            </h1>
          </div>
          <p className="text-base lg:text-lg text-white/90 max-w-2xl">
            Discover jobs tailored to your skills and interview performance
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search jobs or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreferences(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Job Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Jobs Found
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Average Fit Score
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.length > 0
                    ? Math.round(
                        jobs.reduce((sum, job) => sum + job.fitScore, 0) /
                          jobs.length
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  High Match Jobs
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.filter((job) => job.fitScore >= 80).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <Card className="border-2 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl lg:text-2xl flex items-center gap-3">
            <Briefcase className="w-6 h-6" />
            Recommended Jobs
          </CardTitle>
          <CardDescription>
            Jobs ranked by AI fit score based on your resume and interview
            performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No jobs found
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchQuery
                  ? "Try adjusting your search terms or update your preferences"
                  : "Update your job preferences to get personalized recommendations"}
              </p>
              <Button
                onClick={() => setShowPreferences(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Settings className="w-4 h-4 mr-2" />
                Update Preferences
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer"
                  onClick={() => setSelectedJob(job)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedJob(job);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {job.company.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {job.title}
                          </h3>
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

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.strengths.slice(0, 3).map((skill) => (
                          <Badge
                            key={skill}
                            className="bg-green-100 text-green-700 border-green-200"
                          >
                            ✓ {skill}
                          </Badge>
                        ))}
                        {job.missingSkills.slice(0, 2).map((skill) => (
                          <Badge
                            key={skill}
                            className="bg-orange-100 text-orange-700 border-orange-200"
                          >
                            • {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex lg:flex-col items-center lg:items-end gap-4 lg:gap-2">
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${getScoreColor(
                            job.fitScore
                          )}`}
                        >
                          {job.fitScore}%
                        </div>
                        <div className="text-xs text-gray-500">Fit Score</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getScoreBadgeColor(job.atsMatch)}>
                          ATS {job.atsMatch}%
                        </Badge>
                        <Badge className={getScoreBadgeColor(job.readiness)}>
                          Ready {job.readiness}%
                        </Badge>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="text-center pt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const nextPage = page + 1;
                      setPage(nextPage);
                      loadRecommendedJobs(nextPage);
                    }}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    Load More Jobs
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Detail Drawer */}
      {selectedJob && (
        <JobDetailDrawer
          job={selectedJob}
          open={!!selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
