"use client";

import { JourneyCard, JourneyIconTile, JourneyLoader, journey } from "@/components/interview/journey-ui";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Download,
  Mail,
  Share2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { interviewApi, InterviewReport, Interview } from "@/lib/api";
import { InterviewReportView } from "@/components/dashboard-2026/InterviewReportView";
import { dash2026Scope, Eyebrow } from "@/components/dashboard-2026/ui";
import { ReportSectionTabs } from "@/components/reports/ReportSectionTabs";
import {
  buildInterviewReportPdfHtml,
  generateInterviewReportPdfViaServer,
} from "@/lib/interview-report-pdf-export";
import { buildOverallExperienceParagraph } from "@/lib/interview-report-overall-experience";
import { sessionAverageScore } from "@/lib/interview-report-session-scores";
import { uploadPDFToS3 } from "@/lib/pdf-generator";
import { formatDate, cn } from "@/lib/utils";
import {
  practiceHubHref,
  practiceHubLabel,
} from "@/lib/interview-practice-hub";
import {
  hackathonDashboardFromTags,
  hackathonResultPath,
  resolveHackathonInterviewHome,
  resolveInterviewReturnTo,
} from "@/lib/interview-return-to";
import {
  institutePrimaryClass,
  instituteSecondaryClass,
} from "@/components/institute/InstituteChrome";
import { LockedFeatureOverlay } from "@/components/upsell/LockedFeatureOverlay";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function ReportPage() {
  const params = useParams();
  const interviewId = params.id as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  /** Which share action is preparing the link; the other button just waits. */
  const [shareAction, setShareAction] = useState<"copy" | "email" | null>(null);
  const shareBusy = shareAction !== null;
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const { canUse } = useEntitlements();
  const isHackathonReport = Boolean(
    interview?.metadata?.tags?.includes("hackathon") ||
      hackathonDashboardFromTags(interview?.metadata?.tags) ||
      resolveHackathonInterviewHome(resolveInterviewReturnTo(interviewId, searchParams)),
  );
  const reportLocked = !canUse("detailedInterviewReport") && !isHackathonReport;

  useEffect(() => {
    loadReport();
  }, [interviewId]);

  const reportBackHref = (session: Interview | null) => {
    const home =
      resolveHackathonInterviewHome(resolveInterviewReturnTo(interviewId, searchParams)) ??
      hackathonDashboardFromTags(session?.metadata?.tags);
    if (home) return { href: home, label: "Back to hackathon" };
    return { href: practiceHubHref(session), label: practiceHubLabel(session) };
  };

  const loadReport = async () => {
    try {
      const [reportData, interviewData] = await Promise.all([
        interviewApi.getReport(interviewId),
        interviewApi.getInterview(interviewId),
      ]);
      setReport(reportData);
      setInterview(interviewData);
    } catch (error: any) {
      // Hackathon results come after the event: go to the hackathon's result pop-up instead.
      if (error.response?.data?.code === "RESULTS_HIDDEN") {
        router.replace(hackathonResultPath(resolveInterviewReturnTo(interviewId, searchParams), interviewId));
        return;
      }
      console.error("Error loading report:", error);
      setError(error.response?.data?.message || "Failed to load report");
      try {
        const interviewData = await interviewApi.getInterview(interviewId);
        setInterview(interviewData);
      } catch {
        /* interview stays null; hub link defaults to AI Interview Practice list */
      }
    } finally {
      setLoading(false);
    }
  };

  const buildReportPdfBlob = (): Blob | null => {
    if (!report || !interview) return null;

    const isCodingPdfLayout = !!(
      report.codingSummary && report.codingSummary.problems.length > 0
    );

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let cursorY = margin;

    const ensureSpace = (height: number = 24) => {
      if (cursorY + height > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
    };

    const addSectionTitle = (
      title: string,
      color: [number, number, number] = [99, 102, 241]
    ) => {
      ensureSpace(50);
      cursorY += 12; // Add top padding

      // Colored accent bar on the left
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(margin, cursorY - 2, 4, 18, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(title, margin + 10, cursorY + 10);
      cursorY += 18;

      // Subtle line below title
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 24; // Add bottom padding
    };

    const addParagraph = (text: string, fontSize = 11) => {
      const lines = doc.splitTextToSize(text, contentWidth);
      lines.forEach((line: string) => {
        ensureSpace(16);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(fontSize);
        doc.setTextColor(70, 70, 70);
        doc.text(line, margin, cursorY);
        cursorY += 14;
      });
      cursorY += 6;
    };

    const addBulletList = (items: string[]) => {
      if (!items.length) return;
      items.forEach((item) => {
        ensureSpace(18);

        // Bullet point
        doc.setFillColor(99, 102, 241);
        doc.circle(margin + 3, cursorY - 3, 2, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        const lines = doc.splitTextToSize(item, contentWidth - 10);
        lines.forEach((line: string, lineIndex: number) => {
          doc.text(line, margin + 10, cursorY);
          if (lineIndex < lines.length - 1) {
            cursorY += 12;
          }
        });
        cursorY += 16;
      });
      cursorY += 4;
    };

    const appendQuestionByQuestion = () => {
      if (!report.qaAnalysis?.length) return;
      addSectionTitle("Question-by-Question Analysis", [236, 72, 153]);
      report.qaAnalysis.forEach((qa, index) => {
        ensureSpace(50);

        doc.setFillColor(236, 72, 153);
        doc.roundedRect(margin, cursorY - 3, 80, 16, 4, 4, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(`Question #${index + 1}`, margin + 8, cursorY + 8);
        cursorY += 20;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        addParagraph(qa.question, 11);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        addParagraph(
          `Type: ${getQuestionTypeText(qa.questionType)} | Difficulty: ${
            qa.questionDifficulty
          } | Alignment: ${
            qa.answerMatchedQuestion ? "Aligned" : "Needs work"
          } | Depth: ${qa.technicalDepthMatch} | Experience Alignment: ${
            qa.experienceAlignmentScore
          } / 100`,
        );

        cursorY += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(59, 130, 246);
        doc.text("Candidate Answer", margin, cursorY);
        cursorY += 12;
        addParagraph(qa.candidateAnswer);

        cursorY += 4;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129);
        doc.text("Suggested Answer", margin, cursorY);
        cursorY += 12;
        addParagraph(qa.suggestedAnswer);

        cursorY += 4;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(168, 85, 247);
        doc.text(
          `Scores — Correctness: ${qa.correctnessScore}, Clarity: ${qa.clarityScore}, Completeness: ${qa.completenessScore}`,
          margin,
          cursorY,
        );
        cursorY += 16;

        if (qa.validationNotes && qa.validationNotes !== "N/A") {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          addParagraph(`Validation Notes: ${qa.validationNotes}`);
        }

        if (qa.feedback) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          addParagraph(`Feedback: ${qa.feedback}`);
        }

        if (qa.strengths.length) {
          cursorY += 6;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(16, 185, 129);
          doc.text("\u2713 Strengths", margin, cursorY);
          cursorY += 12;
          addBulletList(qa.strengths);
        }

        if (qa.improvements.length) {
          cursorY += 6;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(251, 146, 60);
          doc.text("→ Improvement Ideas", margin, cursorY);
          cursorY += 12;
          addBulletList(qa.improvements);
        }

        cursorY += 12;
      });
    };

    // Header with brand color
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(99, 102, 241);
    doc.text("Interview Trix", margin, cursorY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Generated on ${formatDate(new Date().toISOString())}`,
      pageWidth - margin - 200,
      cursorY
    );
    cursorY += 8;

    // Subtle line below brand
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(30, 30, 30);
    const pdfReportHeading =
      interview.metadata.interviewKind === "coding_practice"
        ? "Practice coding round report"
        : "Interview Performance Report";
    doc.text(pdfReportHeading, margin, cursorY);
    cursorY += 28;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Interview Date: ${formatDate(interview.createdAt)}`,
      margin,
      cursorY
    );
    cursorY += 22;

    const candidateName = user?.fullName || user?.firstName || "Candidate Name";
    const leftRows = [
      ["Interview ID", interview.interviewId],
      ["Candidate Name", candidateName],
      ["Role Applying For", interview.metadata.role],
    ];
    const rightRows = [
      [
        "Company Applying For",
        interview.metadata.targetCompany || "Not specified",
      ],
      [
        "Experience",
        interview.metadata.experience != null
          ? `${interview.metadata.experience} years`
          : "Not specified",
      ],
      ["Overall Performance", `${report.overallScore} / 100`],
    ];

    const startY = cursorY;
    let leftY = startY;
    leftRows.forEach((row) => {
      ensureSpace(32);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      doc.text(row[0].toUpperCase(), margin, leftY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(row[1], margin, leftY + 14);
      leftY += 36;
    });

    let rightY = startY;
    const rightX = pageWidth / 2 + 10;
    rightRows.forEach((row, index) => {
      ensureSpace(32);
      if (index === rightRows.length - 1) {
        // Overall performance card with gradient
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(99, 102, 241);
        doc.setLineWidth(2);
        doc.roundedRect(
          rightX - 14,
          rightY - 14,
          pageWidth - rightX - margin + 14,
          62,
          8,
          8,
          "FD"
        );
        doc.setFont("helvetica", "bold");
        doc.setFontSize(32);
        doc.setTextColor(99, 102, 241);
        doc.text(`${report.overallScore}`, rightX, rightY + 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text("Overall Performance", rightX, rightY + 46);
        rightY += 68;
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        doc.text(row[0].toUpperCase(), rightX, rightY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text(row[1], rightX, rightY + 14);
        rightY += 36;
      }
    });

    cursorY = Math.max(leftY, rightY) + 20;

    if (isCodingPdfLayout && report.codingSummary) {
      addSectionTitle("Session scores", [79, 70, 229]);
      const sessAvg = sessionAverageScore(report);
      addParagraph(
        `Discussion overall: ${report.overallScore}/100 · Coding average: ${report.codingSummary.overallCodingScore}/100 · Overall session average: ${sessAvg}/100 (mean of discussion + coding).`,
      );
      addParagraph(
        `Category scores (discussion) — Technical: ${report.categoryScores.technical}/100, Behavioral: ${report.categoryScores.behavioral}/100, Communication: ${report.categoryScores.communication}/100, Confidence: ${report.categoryScores.confidence}/100.`,
      );
      cursorY += 8;
      addSectionTitle("Practice coding round — problem scores", [51, 65, 85]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      addParagraph(
        `Overall coding score: ${report.codingSummary.overallCodingScore} / 100 (automated tests: public + hidden on submit).`,
      );
      report.codingSummary.problems.forEach((p) => {
        ensureSpace(22);
        addParagraph(
          `${p.title}: ${p.score}% · ${p.passed}/${p.total} tests · ${p.language}`,
        );
      });
      cursorY += 8;
      const overallExp = buildOverallExperienceParagraph(report);
      if (overallExp) {
        addSectionTitle("Overall experience", [99, 102, 241]);
        addParagraph(overallExp);
        cursorY += 8;
      }
      appendQuestionByQuestion();
    }

    addSectionTitle("Performance Breakdown", [139, 92, 246]);

    const performanceMetrics = [
      {
        key: "technical",
        label: "Technical Skills",
        value: report.categoryScores.technical,
        color: [99, 102, 241] as [number, number, number],
      },
      {
        key: "communication",
        label: "Communication",
        value: report.categoryScores.communication,
        color: [16, 185, 129] as [number, number, number],
      },
      {
        key: "behavioral",
        label: "Behavioral",
        value: report.categoryScores.behavioral,
        color: [251, 146, 60] as [number, number, number],
      },
      {
        key: "confidence",
        label: "Confidence",
        value: report.categoryScores.confidence,
        color: [236, 72, 153] as [number, number, number],
      },
    ];

    performanceMetrics.forEach((metric) => {
      ensureSpace(42);

      // Label and score on the same line
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text(metric.label, margin, cursorY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      doc.text(`${metric.value}%`, pageWidth - margin - 60, cursorY);

      cursorY += 14;

      // Progress bar
      const barWidth = contentWidth;
      const barHeight = 12;

      // Background bar
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, cursorY, barWidth, barHeight, 6, 6, "F");

      // Filled bar with gradient effect
      const fillWidth = (barWidth * metric.value) / 100;
      doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
      doc.roundedRect(margin, cursorY, fillWidth, barHeight, 6, 6, "F");

      cursorY += 24;
    });

    if (report.strengths.length) {
      addSectionTitle("Key Strengths Highlighted", [16, 185, 129]);
      addBulletList(report.strengths);
    }

    if (report.improvements.length) {
      addSectionTitle("Improvement Ideas", [251, 146, 60]);
      addBulletList(report.improvements);
    }

    addSectionTitle("Behavioral Metrics", [168, 85, 247]);
    const behavioralMetrics = [
      {
        label: "Confidence",
        value: report.behavioral.confidence,
        unit: "%",
        color: [168, 85, 247] as [number, number, number],
      },
      {
        label: "Clarity",
        value: report.behavioral.clarity,
        unit: "%",
        color: [59, 130, 246] as [number, number, number],
      },
      {
        label: "Fluency",
        value: report.behavioral.fluency,
        unit: "%",
        color: [16, 185, 129] as [number, number, number],
      },
      {
        label: "Filler Words",
        value: Number(report.behavioral.fillersPerMinute.toFixed(1)),
        unit: "per min",
        color: [251, 146, 60] as [number, number, number],
      },
    ];

    behavioralMetrics.forEach((metric) => {
      ensureSpace(42);

      // Label and value on the same line
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text(metric.label, margin, cursorY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      const valueText =
        metric.unit === "%"
          ? `${metric.value}%`
          : `${metric.value} ${metric.unit}`;
      doc.text(valueText, pageWidth - margin - 60, cursorY);

      cursorY += 14;

      // Progress bar
      const barWidth = contentWidth;
      const barHeight = 12;
      const normalized =
        metric.unit === "%"
          ? metric.value
          : Math.max(0, Math.min((metric.value / 6) * 100, 100));

      // Background bar
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, cursorY, barWidth, barHeight, 6, 6, "F");

      // Filled bar
      const fillWidth = (barWidth * normalized) / 100;
      doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
      doc.roundedRect(margin, cursorY, fillWidth, barHeight, 6, 6, "F");

      cursorY += 24;
    });
    cursorY += 8;

    if (!isCodingPdfLayout) {
      appendQuestionByQuestion();
    }

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Subtle line above footer
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(99, 102, 241);
      doc.text("Interview Trix", margin, pageHeight - 24);

      doc.setTextColor(140, 140, 140);
      doc.text(
        `Generated on ${formatDate(new Date().toISOString())}`,
        margin,
        pageHeight - 16
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin - 55,
        pageHeight - 20
      );
    }

    return doc.output("blob");
  };

  const candidateDisplayName =
    user?.fullName || user?.firstName || "Candidate";

  const downloadPDF = async () => {
    if (!report || !interview) return;
    setPdfDownloading(true);
    try {
      const html = buildInterviewReportPdfHtml(
        report,
        interview,
        candidateDisplayName,
      );
      const { downloadUrl, s3Key } =
        await generateInterviewReportPdfViaServer({
          interviewId,
          htmlContent: html,
        });
      setReport((r) => (r ? { ...r, reportPdfS3Key: s3Key } : null));
      window.open(downloadUrl, "_blank");
    } catch (serverErr) {
      console.warn(
        "Server report PDF failed, falling back to client jsPDF:",
        serverErr,
      );
      const blob = buildReportPdfBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `easy-interview-${interview.interviewId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfDownloading(false);
    }
  };

  const resolveShareUrl = async (): Promise<string> => {
    if (!report || !interview) {
      throw new Error("Report not ready");
    }
    const existing = await interviewApi.getReportPdfShareUrl(interviewId);
    if (existing.stored) {
      return existing.shareUrl;
    }
    try {
      const html = buildInterviewReportPdfHtml(
        report,
        interview,
        candidateDisplayName,
      );
      const { s3Key } = await generateInterviewReportPdfViaServer({
        interviewId,
        htmlContent: html,
      });
      const after = await interviewApi.getReportPdfShareUrl(interviewId);
      if (after.stored) {
        setReport((r) => (r ? { ...r, reportPdfS3Key: s3Key } : null));
        return after.shareUrl;
      }
    } catch (serverErr) {
      console.warn(
        "Server report PDF for share failed, falling back to client jsPDF:",
        serverErr,
      );
    }
    const blob = buildReportPdfBlob();
    if (!blob) {
      throw new Error("Could not generate PDF");
    }
    const { uploadUrl, s3Key } =
      await interviewApi.getReportPdfUploadUrl(interviewId);
    await uploadPDFToS3(blob, uploadUrl);
    const { downloadUrl } = await interviewApi.confirmReportPdfUpload(
      interviewId,
      s3Key,
    );
    setReport((r) => (r ? { ...r, reportPdfS3Key: s3Key } : null));
    return downloadUrl;
  };

  const copyReportLink = async () => {
    setShareAction("copy");
    try {
      const url = await resolveShareUrl();
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch (e: unknown) {
      console.error(e);
      const message =
        e instanceof Error ? e.message : "Could not prepare share link";
      toast.error(message);
    } finally {
      setShareAction(null);
    }
  };

  const openEmailShare = async () => {
    if (!interview) return;
    setShareAction("email");
    try {
      const shareUrl = await resolveShareUrl();
      const subjectPlain = `Interview report: ${interview.metadata.role}`;
      const bodyPlain = `Interview report PDF (link expires in 7 days):\n\n${shareUrl}`;

      const mobileUa =
        typeof navigator !== "undefined" &&
        /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );

      if (mobileUa) {
        window.location.href = `mailto:?subject=${encodeURIComponent(subjectPlain)}&body=${encodeURIComponent(bodyPlain)}`;
        return;
      }

      // Desktop: open web mail in the browser (Gmail compose) instead of a native mail client
      const gmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subjectPlain)}&body=${encodeURIComponent(bodyPlain)}`;
      const opened = window.open(
        gmailCompose,
        "_blank",
        "noopener,noreferrer",
      );
      if (!opened) {
        toast.error(
          "Could not open a new tab (popup blocked). Allow popups for this site or use Copy link.",
        );
      }
    } catch (e: unknown) {
      console.error(e);
      const message =
        e instanceof Error ? e.message : "Could not prepare share link";
      toast.error(message);
    } finally {
      setShareAction(null);
    }
  };

  const getQuestionTypeText = (type: string) => {
    switch (type) {
      case "technical":
        return "Technical";
      case "behavioral":
        return "Behavioral";
      case "system-design":
        return "System Design";
      case "hr":
        return "HR / Fit";
      default:
        return type;
    }
  };

  if (loading) {
    return <JourneyLoader title="Loading your report…" description="Scores, answers and feedback from this interview." />;
  }

  if (error || !report || !interview) {
    if (reportLocked && !hackathonDashboardFromTags(interview?.metadata?.tags)) {
      return (
        <div className="mx-auto w-full max-w-4xl space-y-4 p-4">
          <Link
            href={practiceHubHref(interview)}
            className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{practiceHubLabel(interview)}</span>
          </Link>
          <LockedFeatureOverlay
            title="Detailed interview report"
            description="Unlock full scoring, behavioral analysis, and improvement tips with General Pass or higher."
            badge="General Pass"
            ctaLabel="Upgrade to General Pass"
            ctaHref="/checkout?plan=general_pass"
            preview={
              <div className="grid grid-cols-3 gap-4 p-6">
                {[72, 85, 68].map((score) => (
                  <div
                    key={score}
                    className="rounded-lg border bg-card p-4 text-center"
                  >
                    <p className="text-3xl font-bold">{score}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                ))}
              </div>
            }
          />
        </div>
      );
    }

    const back = reportBackHref(interview);
    const codingRound = interview?.metadata.interviewKind === "coding_practice";
    return (
      <div className={cn(dash2026Scope, "mx-auto w-full max-w-3xl pt-6")}>
        <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
          <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative p-6 md:p-9">
            <Link href={back.href} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> {back.label}
            </Link>
            <div className="mt-7 flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-6 w-6" aria-hidden />
              </span>
              <div className="min-w-0">
                <Eyebrow>{codingRound ? "CODING ROUND REPORT" : "INTERVIEW REPORT"}</Eyebrow>
                <h1 className="mt-3 text-[26px] font-black leading-tight tracking-[-0.04em] text-foreground md:text-[32px]">No report for this round.</h1>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {error || "The report isn't ready yet, or this round doesn't have one."}
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                  {codingRound
                    ? "A report needs the AI discussion after coding. Rounds that end before it don't get scored."
                    : "Rounds that end before any answers are given don't get scored."}
                </p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5 border-t border-border pt-5">
              <Button asChild className="h-11 rounded-xl px-5 text-[14.5px] shadow-[0_10px_30px_-12px_rgba(115,103,240,.75)] hover:bg-primary/90">
                <Link href={codingRound ? "/dashboard/coding-interviews/new" : "/dashboard/interviews/new"}>Start another round <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-[14.5px]">
                <Link href={back.href}>{back.label}</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const isCoding = interview.metadata.interviewKind === "coding_practice";
  const back = reportBackHref(interview);
  const duration = interview.metadata.interviewDuration;

  return (
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      {/* header: which round this was, and what you can do with the report */}
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_70%_at_8%_0%,rgba(115,103,240,.13),transparent_70%),radial-gradient(40%_70%_at_95%_20%,rgba(31,143,255,.09),transparent_70%)]" />
        <div className="relative p-6 md:p-8">
          <Link href={back.href} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {back.label}
          </Link>
          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Eyebrow>{isCoding ? "CODING ROUND REPORT" : "INTERVIEW REPORT"}</Eyebrow>
              <h1 className="text-balance mt-4 break-words text-[30px] font-black leading-[1.04] tracking-[-0.045em] text-foreground md:text-[40px]">
                {interview.metadata.role}
              </h1>
              <p className="mt-2 font-[family-name:var(--font-geist-mono)] text-[12px] text-muted-foreground">
                {[interview.metadata.targetCompany, formatDate(interview.createdAt), duration ? `${duration} MIN` : null].filter(Boolean).join(" · ").toUpperCase()}
              </p>
              {interview.session?.terminationReason === "server_error" ? (
                <p className="mt-3 inline-flex rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[13px] text-amber-700 dark:text-amber-300">
                  This interview was cut short by a server error.
                </p>
              ) : null}
            </div>
            <div className="grid w-full shrink-0 grid-cols-2 gap-2.5 sm:w-auto sm:flex">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-11 gap-2 rounded-xl px-4 text-[14px]">
                    <Share2 className="h-4 w-4 shrink-0" /> Share
                  </Button>
                </DialogTrigger>
                <DialogContent className={cn(dash2026Scope, "rounded-[22px] sm:max-w-md")}>
                  <DialogHeader>
                    <DialogTitle className="text-[20px] font-bold tracking-tight">Share this report</DialogTitle>
                    <DialogDescription>
                      Shares a PDF link that expires after 7 days. The PDF is made once and reused for later shares. On desktop, Email opens Gmail in your browser; on phones, your mail app.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="outline" className="h-11 w-full gap-2 rounded-xl sm:flex-1" disabled={shareBusy} onClick={() => void copyReportLink()}>
                      {shareAction === "copy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                      Copy link
                    </Button>
                    <Button type="button" variant="outline" className="h-11 w-full gap-2 rounded-xl sm:flex-1" disabled={shareBusy} onClick={() => void openEmailShare()}>
                      {shareAction === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      Email
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                className="h-11 gap-2 rounded-xl px-4 text-[14px] shadow-[0_10px_30px_-12px_rgba(115,103,240,.75)] hover:bg-primary/90"
                disabled={pdfDownloading}
                onClick={() => void downloadPDF()}
              >
                {pdfDownloading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Download className="h-4 w-4 shrink-0" />}
                <span className="truncate">{pdfDownloading ? "Generating…" : "Download PDF"}</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ReportSectionTabs
        audience="candidate"
        integrityReport={report.integrityReport}
        performance={<InterviewReportView report={report} />}
      />

      {/* next round */}
      <section className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <Eyebrow>NEXT ROUND</Eyebrow>
            <h2 className="mt-3 text-[24px] font-extrabold tracking-[-0.035em] text-foreground md:text-[28px]">Run it again while the feedback is fresh.</h2>
            <p className="mt-1.5 text-[14.5px] text-muted-foreground">Your next interviewer will pick up where this one left off.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Button asChild className="h-11 rounded-xl px-5 text-[14.5px] shadow-[0_10px_30px_-12px_rgba(115,103,240,.75)] hover:bg-primary/90">
              <Link href={isCoding ? "/dashboard/coding-interviews/new" : "/dashboard/interviews/new"}>Start another round <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-[14.5px]">
              <Link href={back.href}>All rounds</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
