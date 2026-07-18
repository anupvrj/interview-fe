import type {
  Interview,
  PeerBooking,
  SystemDesignSession,
} from "@/lib/api";
import { IX_CATEGORY_META } from "@/lib/ix-score-constants";
import { getProblemById } from "@/lib/systemDesignProblems";
import {
  interviewRoundLabel,
  isCodingPracticeInterview,
} from "@/lib/interview-kind";
import { formatDate } from "@/lib/utils";

export type DashboardSessionKind =
  | "screening"
  | "coding"
  | "systemDesign"
  | "peer";

export type DashboardSessionFilter = "all" | DashboardSessionKind;

export type DashboardRecentSessionRow = {
  key: string;
  kind: DashboardSessionKind;
  title: string;
  subtitle: string;
  sessionLabel: string;
  score: number | null;
  status: string;
  sortAt: string;
  reportHref?: string;
  /** Primary details page (booking / session / report). */
  detailsHref?: string;
  continueHref?: string;
  /** AI interviews — play recording */
  interviewId?: string;
  /** System design session id for recording playback */
  systemDesignSessionId?: string;
  /** Peer booking id for recording playback */
  peerBookingId?: string;
  canPlayRecording?: boolean;
  canDelete?: boolean;
  showGenerateReport?: boolean;
};

const KIND_LABELS: Record<DashboardSessionKind, string> = {
  screening: IX_CATEGORY_META.screening.label,
  coding: IX_CATEGORY_META.coding.label,
  systemDesign: IX_CATEGORY_META.systemDesign.label,
  peer: IX_CATEGORY_META.peer.label,
};

export function dashboardSessionKindLabel(kind: DashboardSessionKind): string {
  return KIND_LABELS[kind];
}

function systemDesignScore(session: SystemDesignSession): number | null {
  const raw = session.scoreReport?.overallScore ?? session.score;
  if (typeof raw !== "number" || Number.isNaN(raw)) return null;
  return Math.round(raw);
}

function peerDisplayScore(booking: PeerBooking): number | null {
  const overall = booking.interviewerCandidateScore?.overall;
  if (typeof overall === "number" && Number.isFinite(overall)) {
    return Math.round(overall);
  }
  return null;
}

function peerTableStatus(booking: PeerBooking): string {
  if (booking.status === "completed") {
    if (booking.reportStatus === "completed" || peerDisplayScore(booking) != null) {
      return "completed";
    }
    if (booking.reportStatus === "processing" || booking.reportStatus === "pending") {
      return "processing";
    }
    return "completed";
  }
  if (
    booking.status === "paid_confirmed" ||
    booking.status === "accepted_unpaid" ||
    booking.status === "pending_acceptance"
  ) {
    return "active";
  }
  if (booking.status === "cancelled") {
    return "cancelled";
  }
  if (booking.status === "rejected") {
    return "failed";
  }
  return booking.status;
}

function mapAiInterview(interview: Interview): DashboardRecentSessionRow {
  const kind: DashboardSessionKind = isCodingPracticeInterview(interview)
    ? "coding"
    : "screening";
  const role = interview.metadata.role || "General Interview";
  const company = interview.metadata.targetCompany?.trim();
  const createdLabel = formatDate(interview.createdAt);
  const subtitle = company
    ? `${company} · ${createdLabel}`
    : createdLabel;

  return {
    key: `ai-${interview.interviewId}`,
    kind,
    title: role,
    subtitle,
    sessionLabel: interviewRoundLabel(interview),
    score:
      typeof interview.report?.overallScore === "number"
        ? interview.report.overallScore
        : null,
    status: interview.status,
    sortAt: interview.createdAt,
    reportHref:
      interview.status === "completed" ||
      interview.status === "processing" ||
      interview.status === "failed"
        ? `/dashboard/interviews/${interview.interviewId}/report`
        : undefined,
    detailsHref:
      interview.status === "completed" ||
      interview.status === "processing" ||
      interview.status === "failed"
        ? `/dashboard/interviews/${interview.interviewId}/report`
        : interview.status === "draft" || interview.status === "active"
          ? `/interview/${interview.interviewId}/realtime`
          : undefined,
    continueHref:
      interview.status === "draft" || interview.status === "active"
        ? `/interview/${interview.interviewId}/realtime`
        : undefined,
    interviewId: interview.interviewId,
    canPlayRecording:
      interview.status === "completed" || interview.status === "failed",
    canDelete:
      interview.status === "draft" || interview.status === "active",
    showGenerateReport:
      (interview.status === "completed" || interview.status === "failed") &&
      !interview.report,
  };
}

function mapSystemDesignSession(
  session: SystemDesignSession,
): DashboardRecentSessionRow {
  const title = getProblemById(session.problemId)?.title ?? "System Design";
  const detailsHref =
    session.status === "completed"
      ? `/dashboard/system-design/${session.sessionId}`
      : `/dashboard/system-design/${session.sessionId}`;
  return {
    key: `sd-${session.sessionId}`,
    kind: "systemDesign",
    title,
    subtitle: formatDate(session.createdAt),
    sessionLabel: KIND_LABELS.systemDesign,
    score: systemDesignScore(session),
    status: session.status === "completed" ? "completed" : "active",
    sortAt: session.completedAt ?? session.createdAt,
    reportHref:
      session.status === "completed"
        ? `/dashboard/system-design/${session.sessionId}/report`
        : undefined,
    detailsHref,
    continueHref:
      session.status === "active"
        ? `/dashboard/system-design/${session.sessionId}`
        : undefined,
    systemDesignSessionId: session.sessionId,
    canPlayRecording: Boolean(session.recordingS3Key),
  };
}

function mapPeerBooking(
  booking: PeerBooking,
  typeNames?: Record<string, string>,
): DashboardRecentSessionRow {
  const typeLabel =
    typeNames?.[booking.interviewType] ||
    booking.interviewType.replace(/_/g, " ");
  const interviewer =
    booking.interviewer?.name || booking.interviewerName || "Interviewer";
  const bookingHref = `/dashboard/peer-interviews/bookings/${booking.id}`;
  const hasRecording = Boolean(
    booking.sessionRecording?.s3Key ||
      booking.meetArtifacts?.recordingAvailable,
  );

  return {
    key: `peer-${booking.id}`,
    kind: "peer",
    title: `${typeLabel} — Peer Interview`,
    subtitle: `${interviewer} · ${formatDate(booking.createdAt)}`,
    sessionLabel: KIND_LABELS.peer,
    score: peerDisplayScore(booking),
    status: peerTableStatus(booking),
    sortAt: booking.start,
    reportHref: bookingHref,
    detailsHref: bookingHref,
    continueHref:
      booking.status === "paid_confirmed" ? bookingHref : undefined,
    peerBookingId: booking.id,
    canPlayRecording: hasRecording,
  };
}

export function buildDashboardRecentSessions(input: {
  interviews: Interview[];
  systemDesignSessions: SystemDesignSession[];
  peerBookings: PeerBooking[];
}): DashboardRecentSessionRow[] {
  const rows: DashboardRecentSessionRow[] = [
    ...input.interviews.map(mapAiInterview),
    ...input.systemDesignSessions.map(mapSystemDesignSession),
    ...input.peerBookings.map((booking) => mapPeerBooking(booking)),
  ];

  return rows.sort(
    (a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime(),
  );
}

export function countDashboardSessionsByFilter(
  rows: DashboardRecentSessionRow[],
): Record<DashboardSessionFilter, number> {
  return {
    all: rows.length,
    screening: rows.filter((r) => r.kind === "screening").length,
    coding: rows.filter((r) => r.kind === "coding").length,
    systemDesign: rows.filter((r) => r.kind === "systemDesign").length,
    peer: rows.filter((r) => r.kind === "peer").length,
  };
}

export function filterDashboardSessions(
  rows: DashboardRecentSessionRow[],
  filter: DashboardSessionFilter,
): DashboardRecentSessionRow[] {
  if (filter === "all") return rows;
  return rows.filter((r) => r.kind === filter);
}

/** Map peer bookings into dashboard-style rows for the bookings history table. */
export function buildPeerHistorySessionRows(
  bookings: PeerBooking[],
  typeNames: Record<string, string> = {},
): DashboardRecentSessionRow[] {
  return bookings
    .map((booking) => {
      const row = mapPeerBooking(booking);
      const typeLabel =
        typeNames[booking.interviewType] ||
        booking.interviewType.replace(/_/g, " ");
      const bookingHref = `/dashboard/peer-interviews/bookings/${booking.id}`;
      const interviewer =
        booking.interviewer?.name || booking.interviewerName || "Interviewer";
      return {
        ...row,
        title: `${typeLabel} — Peer Interview`,
        subtitle: `${interviewer} · Created ${formatDate(booking.createdAt)}`,
        sessionLabel: formatDate(booking.start),
        // History "View" should open booking details, not the report.
        reportHref: bookingHref,
        detailsHref: bookingHref,
        continueHref: undefined,
      };
    })
    .sort(
      (a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime(),
    );
}

export function isPreviousPeerBooking(
  booking: PeerBooking,
  now = Date.now(),
): boolean {
  if (booking.status === "completed") return true;
  if (
    booking.status === "rejected" ||
    booking.status === "cancelled" ||
    booking.status === "refunded"
  ) {
    return true;
  }
  if (
    booking.status === "paid_confirmed" &&
    new Date(booking.end).getTime() < now
  ) {
    return true;
  }
  return false;
}
