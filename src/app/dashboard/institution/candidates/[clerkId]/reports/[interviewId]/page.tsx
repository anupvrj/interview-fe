"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { userApi, adminApi, type InterviewReport } from "@/lib/api";
import { InterviewReportAnalysis } from "@/components/institution/InterviewReportAnalysis";
import { formatDate } from "@/lib/utils";

export default function InstitutionInterviewReportPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const clerkId = params.clerkId as string;
  const interviewId = params.interviewId as string;
  const nameQ = searchParams.get("name") || "";
  const emailQ = searchParams.get("email") || "";

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [interviewMeta, setInterviewMeta] = useState<any | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      localStorage.setItem("clerk-user-id", user.id);
      loadProfile();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (
      !profile ||
      profile.accessRole !== "institution_admin" ||
      !profile.institutionId ||
      !clerkId ||
      !interviewId
    ) {
      return;
    }
    const q = new URLSearchParams();
    if (nameQ) q.set("name", nameQ);
    if (emailQ) q.set("email", emailQ);
    const qs = q.toString();
    router.replace(
      `/dashboard/institute/${profile.institutionId}/candidates/${clerkId}/reports/${interviewId}${qs ? `?${qs}` : ""}`
    );
  }, [profile, clerkId, interviewId, nameQ, emailQ, router]);

  useEffect(() => {
    if (profile?.accessRole === "super_admin" && clerkId && interviewId) {
      loadReport();
    }
  }, [profile, clerkId, interviewId]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const p = await userApi.getMyProfile();
      setProfile(p);
      if (p.accessRole !== "institution_admin" && p.accessRole !== "super_admin") {
        router.replace("/dashboard");
      }
    } catch {
      router.replace("/dashboard");
    }
  };

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminApi.getUserInterviews(clerkId);
      const inv = list.find((i: any) => i.interviewId === interviewId) ?? null;
      setInterviewMeta(inv);
      const data = await adminApi.getInterviewReport(interviewId);
      setReport(data as InterviewReport);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const listHref = `/dashboard/institution/candidates/${clerkId}/reports?${new URLSearchParams({
    ...(nameQ && { name: nameQ }),
    ...(emailQ && { email: emailQ }),
  }).toString()}`;

  if (!profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1">
          <Link href={listHref}>
            <ArrowLeft className="h-4 w-4" />
            All interviews
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Interview report</h1>
        <p className="mt-1 text-slate-600">
          {nameQ || "Candidate"}
          {emailQ ? ` · ${emailQ}` : ""}
          {interviewMeta?.metadata?.role ? ` · ${interviewMeta.metadata.role}` : ""}
          {interviewMeta?.createdAt ? ` · ${formatDate(interviewMeta.createdAt)}` : ""}
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && report && <InterviewReportAnalysis report={report} />}
    </div>
  );
}
