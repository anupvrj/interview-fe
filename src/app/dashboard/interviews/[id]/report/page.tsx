"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  Copy,
  Download,
  Mail,
  Share2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Award,
  Brain,
  MessageSquare,
  Mic,
} from "lucide-react";
import { interviewApi, InterviewReport, Interview } from "@/lib/api";
import {
  buildInterviewReportPdfHtml,
  generateInterviewReportPdfViaServer,
} from "@/lib/interview-report-pdf-export";
import { uploadPDFToS3 } from "@/lib/pdf-generator";
import { getScoreColor, getScoreGradient, formatDate } from "@/lib/utils";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;
  const { user } = useUser();

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [shareBusy, setShareBusy] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [interviewId]);

  const loadReport = async () => {
    try {
      // Load report and interview data in parallel
      const [reportData, interviewData] = await Promise.all([
        interviewApi.getReport(interviewId),
        interviewApi.getInterview(interviewId),
      ]);
      setReport(reportData);
      setInterview(interviewData);
    } catch (error: any) {
      console.error("Error loading report:", error);
      setError(error.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const buildReportPdfBlob = (): Blob | null => {
    if (!report || !interview) return null;

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
    doc.text("Interview Performance Report", margin, cursorY);
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
      ["Language", interview.metadata.language === "hi" ? "Hindi" : "English"],
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

    if (report.qaAnalysis?.length) {
      addSectionTitle("Question-by-Question Analysis", [236, 72, 153]);
      report.qaAnalysis.forEach((qa, index) => {
        ensureSpace(50);

        // Question number with colored background
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
          } / 100`
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
          cursorY
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
          doc.text("✓ Strengths", margin, cursorY);
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
    setShareBusy(true);
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
      setShareBusy(false);
    }
  };

  const openEmailShare = async () => {
    if (!interview) return;
    setShareBusy(true);
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
      setShareBusy(false);
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

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "medium":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      case "hard":
        return "bg-rose-50 text-rose-700 border border-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-100";
    }
  };

  const getValidationStyles = (match: string | boolean) => {
    if (typeof match === "boolean") {
      return match
        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
        : "bg-rose-50 text-rose-700 border border-rose-100";
    }

    switch (match) {
      case "exceeds":
        return "bg-violet-50 text-violet-700 border border-violet-100";
      case "meets":
        return "bg-blue-50 text-blue-700 border border-blue-100";
      case "below":
        return "bg-orange-50 text-orange-700 border border-orange-100";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !report || !interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Report Not Available</h3>
            <p className="text-gray-600 mb-4">
              {error ||
                "The interview report is not ready yet or doesn't exist."}
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="gradient"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
              },
            }}
          />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Interview Report</h1>
              <p className="text-gray-600">
                {interview.metadata.role} • {formatDate(interview.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Share2 className="w-4 h-4" /> Share
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share interview report</DialogTitle>
                    <DialogDescription>
                      Shares a PDF download link from cloud storage. If this
                      interview has not been uploaded yet, the PDF is generated
                      and stored once; later shares reuse the same file. Links
                      expire after 7 days. On desktop, Email opens Gmail in your
                      browser; on phones, it opens your mail app.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 w-full sm:flex-1"
                      disabled={shareBusy}
                      onClick={() => void copyReportLink()}
                    >
                      {shareBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copy link
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 w-full sm:flex-1"
                      disabled={shareBusy}
                      onClick={() => void openEmailShare()}
                    >
                      {shareBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      Email
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                className="gap-2"
                disabled={pdfDownloading}
                onClick={() => void downloadPDF()}
              >
                {pdfDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {pdfDownloading ? "Generating…" : "Download PDF"}
              </Button>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <Card className="border-2 mb-8 overflow-hidden">
          <div
            className={`h-2 bg-gradient-to-r ${getScoreGradient(
              report.overallScore
            )}`}
          />
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Overall Performance</h2>
                <p className="text-gray-600">
                  Your interview performance across all categories
                </p>
              </div>
              <div className="text-center">
                <div
                  className={`text-6xl font-bold ${getScoreColor(
                    report.overallScore
                  )}`}
                >
                  {report.overallScore}
                </div>
                <div className="text-gray-500 text-sm">out of 100</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Scores */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Technical Skills</CardTitle>
                  <CardDescription>Problem-solving & knowledge</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-3xl font-bold ${getScoreColor(
                    report.categoryScores.technical
                  )}`}
                >
                  {report.categoryScores.technical}
                </span>
                <span className="text-gray-500">/ 100</span>
              </div>
              <Progress
                value={report.categoryScores.technical}
                className="h-3"
              />
            </CardContent>
          </Card>

          <Card className="border-2 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Behavioral</CardTitle>
                  <CardDescription>STAR method & storytelling</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-3xl font-bold ${getScoreColor(
                    report.categoryScores.behavioral
                  )}`}
                >
                  {report.categoryScores.behavioral}
                </span>
                <span className="text-gray-500">/ 100</span>
              </div>
              <Progress
                value={report.categoryScores.behavioral}
                className="h-3"
              />
            </CardContent>
          </Card>

          <Card className="border-2 bg-gradient-to-br from-green-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Communication</CardTitle>
                  <CardDescription>Clarity & structure</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-3xl font-bold ${getScoreColor(
                    report.categoryScores.communication
                  )}`}
                >
                  {report.categoryScores.communication}
                </span>
                <span className="text-gray-500">/ 100</span>
              </div>
              <Progress
                value={report.categoryScores.communication}
                className="h-3"
              />
            </CardContent>
          </Card>

          <Card className="border-2 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Mic className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Confidence</CardTitle>
                  <CardDescription>Delivery & presence</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-3xl font-bold ${getScoreColor(
                    report.categoryScores.confidence
                  )}`}
                >
                  {report.categoryScores.confidence}
                </span>
                <span className="text-gray-500">/ 100</span>
              </div>
              <Progress
                value={report.categoryScores.confidence}
                className="h-3"
              />
            </CardContent>
          </Card>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.strengths.map((strength, index) => (
                  <li
                    key={`strength-${index}-${strength.slice(0, 10)}`}
                    className="flex items-start gap-2"
                  >
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <TrendingUp className="w-5 h-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.improvements.map((improvement, index) => (
                  <li
                    key={`improvement-${index}-${improvement.slice(0, 10)}`}
                    className="flex items-start gap-2"
                  >
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Behavioral Analysis */}
        <Card className="border-2 mb-8">
          <CardHeader>
            <CardTitle>Behavioral Analysis</CardTitle>
            <CardDescription>
              Insights into your communication style and delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Confidence</span>
                  <span
                    className={`text-sm font-semibold ${getScoreColor(
                      report.behavioral.confidence
                    )}`}
                  >
                    {report.behavioral.confidence}%
                  </span>
                </div>
                <Progress
                  value={report.behavioral.confidence}
                  className="h-2 mb-4"
                />

                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Clarity</span>
                  <span
                    className={`text-sm font-semibold ${getScoreColor(
                      report.behavioral.clarity
                    )}`}
                  >
                    {report.behavioral.clarity}%
                  </span>
                </div>
                <Progress
                  value={report.behavioral.clarity}
                  className="h-2 mb-4"
                />

                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Fluency</span>
                  <span
                    className={`text-sm font-semibold ${getScoreColor(
                      report.behavioral.fluency
                    )}`}
                  >
                    {report.behavioral.fluency}%
                  </span>
                </div>
                <Progress value={report.behavioral.fluency} className="h-2" />
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="font-semibold text-purple-900 mb-1">
                    Filler Words
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {report.behavioral.fillersPerMinute.toFixed(1)} / min
                  </div>
                  <div className="text-xs text-purple-700 mt-1">
                    {(() => {
                      if (report.behavioral.fillersPerMinute < 2) {
                        return "Excellent! Very few fillers";
                      }
                      if (report.behavioral.fillersPerMinute < 4) {
                        return "Good, but room for improvement";
                      }
                      return "Try to reduce 'um', 'ah', 'like'";
                    })()}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-semibold text-blue-900 mb-1">
                    Speaking Pace
                  </div>
                  <div className="text-sm text-blue-700">
                    Your pace was well-balanced. Keep maintaining a steady
                    rhythm while speaking.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Q&A Analysis */}
        {report.qaAnalysis && report.qaAnalysis.length > 0 && (
          <Card className="border-2 mb-8">
            <CardHeader>
              <CardTitle>Question-by-Question Analysis</CardTitle>
              <CardDescription>
                Deep dive into how each answer performed, including validation
                checks and suggested improvements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {report.qaAnalysis.map((qa, index) => (
                <div
                  key={`${qa.question}-${index}`}
                  className="rounded-2xl border border-slate-100 bg-white shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Question #{index + 1}
                      </p>
                      <h3 className="text-base font-semibold text-slate-800">
                        {qa.question}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getDifficultyStyles(
                          qa.questionDifficulty
                        )}`}
                      >
                        {qa.questionDifficulty.toUpperCase()}
                      </span>
                      <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                        {getQuestionTypeText(qa.questionType)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getValidationStyles(
                          qa.answerMatchedQuestion
                        )}`}
                      >
                        {qa.answerMatchedQuestion
                          ? "Aligned with question"
                          : "Needs better alignment"}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getValidationStyles(
                          qa.technicalDepthMatch
                        )}`}
                      >
                        Depth: {qa.technicalDepthMatch}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-5 px-6 py-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Candidate Answer
                      </p>
                      <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-900">
                        {qa.candidateAnswer}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Suggested Answer
                      </p>
                      <p className="mt-2 rounded-xl bg-violet-50/70 p-4 text-sm leading-relaxed text-slate-900">
                        {qa.suggestedAnswer}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          { label: "Correctness", value: qa.correctnessScore },
                          { label: "Clarity", value: qa.clarityScore },
                          {
                            label: "Completeness",
                            value: qa.completenessScore,
                          },
                        ].map((metric) => (
                          <div
                            key={`${qa.question}-${metric.label}`}
                            className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center"
                          >
                            <p className="text-xs text-slate-500">
                              {metric.label}
                            </p>
                            <p
                              className={`text-2xl font-semibold ${getScoreColor(
                                metric.value
                              )}`}
                            >
                              {metric.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-700">
                            Experience Alignment
                          </span>
                          <span className="text-sm font-semibold text-slate-900">
                            {qa.experienceAlignmentScore} / 100
                          </span>
                        </div>
                        <Progress
                          value={qa.experienceAlignmentScore}
                          className="mt-2 h-2"
                        />
                        {qa.validationNotes && qa.validationNotes !== "N/A" && (
                          <p className="mt-2 text-xs text-slate-500">
                            {qa.validationNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Feedback Summary
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {qa.feedback}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Strengths Highlighted
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-700">
                          {qa.strengths.map((strength, idx) => (
                            <li
                              key={`strength-${index}-${idx}`}
                              className="flex items-start gap-2"
                            >
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                          Improvement Ideas
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-700">
                          {qa.improvements.map((improvement, idx) => (
                            <li
                              key={`improvement-${index}-${idx}`}
                              className="flex items-start gap-2"
                            >
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Ready for Your Next Interview?
            </h2>
            <p className="text-gray-700 mb-6">
              Keep practicing to improve your scores and build confidence!
            </p>
            <Link href="/dashboard/interviews/new">
              <Button variant="gradient" size="lg" className="gap-2">
                Start New Interview
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
