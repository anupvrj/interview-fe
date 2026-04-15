"use client";

import { adminApi, type User } from "@/lib/api";
import { getInterviewCreditsUsed } from "@/lib/utils";

type Batch = { _id: string; name?: string };

type BatchPerformance = {
  averageScore: number | null;
  reportsCompleted: number;
  interviewsStarted: number;
  memberCount: number;
  topPerformers: Array<{
    clerkId: string;
    name: string | null;
    email: string | null;
    overallScore: number;
    interviewId: string;
  }>;
};

export type InstituteAnalyticsData = {
  daily: Array<{
    day: string;
    label: string;
    interviews: number;
    resumes: number;
    credits: number;
    avgScore: number;
  }>;
  totals: {
    usersInvited: number;
    usersPendingOnboarding: number;
    schedulesCount: number;
    schedulesCompleted: number;
    schedulesStarted: number;
    schedulesPending: number;
    schedulesCancelled: number;
    interviewsCount: number;
    resumesCount: number;
    totalCreditsSpent: number;
  };
  topPerformers: Array<{
    clerkId: string;
    name: string | null;
    email: string | null;
    score: number;
    sourceBatch: string;
    interviewId: string;
  }>;
  batchPerformance: Array<{
    batchId: string;
    batchName: string;
    averageScore: number;
    reportsCompleted: number;
    interviewsStarted: number;
    memberCount: number;
  }>;
};

async function listAllInstitutionUsers(institutionId: string): Promise<User[]> {
  const pageSize = 200;
  let skip = 0;
  let total = 0;
  const users: User[] = [];

  do {
    const page = await adminApi.listUsers({
      institutionId,
      limit: pageSize,
      skip,
    });
    users.push(...page.data);
    total = page.total ?? users.length;
    skip += page.data.length;
    if (page.data.length === 0) break;
  } while (users.length < total);

  return users;
}

export async function fetchInstitutionAnalytics(
  institutionId: string,
  days: number = 14,
): Promise<InstituteAnalyticsData> {
  const [users, schedules, batches] = await Promise.all([
    listAllInstitutionUsers(institutionId),
    adminApi.listInterviewSchedules(institutionId).catch(() => [] as any[]),
    adminApi.listBatches(institutionId).catch(() => [] as Batch[]),
  ]);

  const userDetails = await Promise.all(
    users.map(async (u) => {
      const [interviews, resumes] = await Promise.all([
        adminApi.getUserInterviews(u.clerkId).catch(() => [] as any[]),
        adminApi.getUserResumes(u.clerkId).catch(() => [] as any[]),
      ]);
      return { user: u, interviews, resumes };
    }),
  );

  const batchPerfEntries = await Promise.all(
    batches.map(async (batch) => {
      const perf = (await adminApi
        .getBatchPerformance(batch._id)
        .catch(() => null)) as BatchPerformance | null;
      return { batch, perf };
    }),
  );

  const now = new Date();
  const dayKeys = Array.from({ length: days }, (_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (days - 1 - idx));
    return d.toISOString().slice(0, 10);
  });
  const dayMap = new Map(
    dayKeys.map((day) => [
      day,
      { day, interviews: 0, resumes: 0, credits: 0, scoreCount: 0, scoreTotal: 0 },
    ]),
  );

  let interviewCount = 0;
  let resumeCount = 0;
  for (const row of userDetails) {
    for (const interview of row.interviews) {
      interviewCount += 1;
      const day = new Date(interview.createdAt).toISOString().slice(0, 10);
      const bucket = dayMap.get(day);
      if (!bucket) continue;
      bucket.interviews += 1;
      const credits = getInterviewCreditsUsed(interview);
      if (credits != null) bucket.credits += credits;
      const score = interview?.report?.overallScore;
      if (typeof score === "number" && Number.isFinite(score)) {
        bucket.scoreCount += 1;
        bucket.scoreTotal += score;
      }
    }
    for (const resume of row.resumes) {
      resumeCount += 1;
      const rawDate = resume.createdAt || resume.updatedAt;
      if (!rawDate) continue;
      const day = new Date(rawDate).toISOString().slice(0, 10);
      const bucket = dayMap.get(day);
      if (!bucket) continue;
      bucket.resumes += 1;
    }
  }

  const daily = dayKeys.map((day) => {
    const d = dayMap.get(day) ?? {
      day,
      interviews: 0,
      resumes: 0,
      credits: 0,
      scoreCount: 0,
      scoreTotal: 0,
    };
    const dateObj = new Date(`${day}T00:00:00`);
    return {
      day,
      label: dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      interviews: d.interviews,
      resumes: d.resumes,
      credits: d.credits,
      avgScore: d.scoreCount > 0 ? Math.round(d.scoreTotal / d.scoreCount) : 0,
    };
  });

  const scheduleCounts = schedules.reduce(
    (acc, s: any) => {
      const st = String(s.status || "").toLowerCase();
      if (st === "scheduled") acc.scheduled += 1;
      else if (st === "started" || st === "active") acc.started += 1;
      else if (st === "cancelled") acc.cancelled += 1;
      else if (st === "completed") acc.completed += 1;
      return acc;
    },
    { scheduled: 0, started: 0, cancelled: 0, completed: 0 },
  );

  const batchPerformance = batchPerfEntries
    .filter((x) => x.perf != null)
    .map((x) => ({
      batchId: x.batch._id,
      batchName: x.batch.name || "Batch",
      averageScore: x.perf?.averageScore ?? 0,
      reportsCompleted: x.perf?.reportsCompleted ?? 0,
      interviewsStarted: x.perf?.interviewsStarted ?? 0,
      memberCount: x.perf?.memberCount ?? 0,
    }))
    .sort((a, b) => b.averageScore - a.averageScore);

  const topPerformers = batchPerfEntries
    .flatMap((x) =>
      (x.perf?.topPerformers || []).map((p) => ({
        clerkId: p.clerkId,
        name: p.name,
        email: p.email,
        score: p.overallScore,
        sourceBatch: x.batch.name || "Batch",
        interviewId: p.interviewId,
      })),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return {
    daily,
    totals: {
      usersInvited: users.length,
      usersPendingOnboarding: users.filter((u) => u.onboardingCompleted === false)
        .length,
      schedulesCount: schedules.length,
      schedulesCompleted: scheduleCounts.completed,
      schedulesStarted: scheduleCounts.started,
      schedulesPending: scheduleCounts.scheduled,
      schedulesCancelled: scheduleCounts.cancelled,
      interviewsCount: interviewCount,
      resumesCount: resumeCount,
      totalCreditsSpent: daily.reduce((sum, d) => sum + d.credits, 0),
    },
    topPerformers,
    batchPerformance,
  };
}

