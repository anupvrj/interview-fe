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
  ArrowLeft,
  Download,
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
import { interviewApi, Interview } from "@/lib/api";
import { getScoreColor, getScoreGradient, formatDate } from "@/lib/utils";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;
  const { user } = useUser();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadReport();
  }, [interviewId]);

  const loadReport = async () => {
    try {
      const data = await interviewApi.getReport(interviewId);
      setInterview(data);
    } catch (error: any) {
      console.error("Error loading report:", error);
      setError(error.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!interview || !interview.report) return;

    const doc = new jsPDF();
    const report = interview.report;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let y = 20;

    // Helper to convert image URL to base64
    const getBase64ImageFromURL = async (url: string): Promise<string> => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Error loading profile image:", error);
        return "";
      }
    };

    // Helper function to draw colored box
    const drawColoredBox = (
      x: number,
      y: number,
      width: number,
      height: number,
      color: number[]
    ) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(x, y, width, height, "F");
    };

    // Helper function to draw progress bar
    const drawProgressBar = (
      x: number,
      y: number,
      width: number,
      height: number,
      percentage: number,
      color: number[]
    ) => {
      // Background (light gray)
      doc.setFillColor(240, 240, 240);
      doc.rect(x, y, width, height, "F");

      // Progress (colored)
      const progressWidth = (width * percentage) / 100;
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(x, y, progressWidth, height, "F");

      // Border
      doc.setDrawColor(200, 200, 200);
      doc.rect(x, y, width, height, "S");
    };

    // Helper to get score color
    const getScoreColorRGB = (score: number): number[] => {
      if (score >= 80) return [16, 185, 129]; // Green
      if (score >= 60) return [59, 130, 246]; // Blue
      if (score >= 40) return [251, 146, 60]; // Orange
      return [239, 68, 68]; // Red
    };

    // ========== HEADER ==========
    // Purple gradient header background
    drawColoredBox(0, 0, pageWidth, 50, [139, 92, 246]);

    // Logo/Icon (small circle)
    doc.setFillColor(255, 255, 255);
    doc.circle(20, 25, 8, "F");
    doc.setFillColor(139, 92, 246);
    doc.setFontSize(14);
    doc.text("HI", 16, 28);

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("Interview Performance Report", 35, 25);

    // Subtitle
    doc.setFontSize(11);
    doc.text(formatDate(interview.createdAt), 35, 35);

    y = 65;

    // ========== CANDIDATE INFO & OVERALL SCORE SECTION ==========
    const sectionHeight = 60;

    // Left side - Candidate Information
    const leftBoxWidth = (pageWidth - 35) / 2;
    drawColoredBox(15, y, leftBoxWidth, sectionHeight, [249, 250, 251]);
    drawColoredBox(15, y, 4, sectionHeight, [139, 92, 246]); // Purple accent

    // Profile image or placeholder
    const profileX = 28;
    const profileY = y + 20;
    const profileRadius = 14;
    const candidateName = user?.fullName || user?.firstName || "Candidate";
    let imageLoaded = false;

    // Try to load and add profile image
    const profileImageUrl = user?.imageUrl;
    if (profileImageUrl) {
      try {
        const base64Image = await getBase64ImageFromURL(profileImageUrl);
        if (base64Image) {
          // Create a temporary canvas to crop image to circle
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = base64Image;

          await new Promise<void>((resolve) => {
            img.onload = () => {
              try {
                // Create canvas for circular cropping
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                  resolve();
                  return;
                }

                // Use higher resolution for better quality (3x for crisp image)
                const scaleFactor = 3;
                const size = profileRadius * 2 * scaleFactor;
                canvas.width = size;
                canvas.height = size;

                // Draw white background circle
                ctx.fillStyle = "#FFFFFF";
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
                ctx.fill();

                // Clip to circle
                ctx.save();
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
                ctx.clip();

                // Draw image centered and scaled to fill circle (high quality)
                const imageScale = Math.max(
                  size / img.width,
                  size / img.height
                );
                const x = (size - img.width * imageScale) / 2;
                const yPos = (size - img.height * imageScale) / 2;
                ctx.drawImage(
                  img,
                  x,
                  yPos,
                  img.width * imageScale,
                  img.height * imageScale
                );
                ctx.restore();

                // Convert to base64 with high quality
                const circularImage = canvas.toDataURL("image/png", 1.0);

                // Add to PDF (scale down from high-res canvas)
                const displaySize = profileRadius * 2;
                doc.addImage(
                  circularImage,
                  "PNG",
                  profileX - profileRadius,
                  profileY - profileRadius,
                  displaySize,
                  displaySize
                );

                // Draw border circle
                doc.setDrawColor(139, 92, 246);
                doc.setLineWidth(1.5);
                doc.circle(profileX, profileY, profileRadius, "S");

                imageLoaded = true;
              } catch (err) {
                console.error("Error processing image:", err);
              }
              resolve();
            };
            img.onerror = () => resolve();
          });
        }
      } catch (error) {
        console.error("Failed to load profile image, using initials:", error);
      }
    }

    // Fallback to initials if no image or image failed
    if (!imageLoaded) {
      doc.setFillColor(139, 92, 246);
      doc.circle(profileX, profileY, profileRadius, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      const initials = candidateName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
      const textWidth = doc.getTextWidth(initials);
      doc.text(initials, profileX - textWidth / 2, profileY + 6);
      doc.setFont("helvetica", "normal");
    }

    // Candidate Details
    const detailsX = profileX + 18;
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.text(candidateName, detailsX, y + 12);

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    doc.text(user?.primaryEmailAddress?.emailAddress || "", detailsX, y + 18);

    // Role and Experience line
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(10);
    const experienceText =
      interview.metadata.experience === 0
        ? "Fresher"
        : `${interview.metadata.experience} years exp`;
    doc.text(
      `${interview.metadata.role} • ${experienceText}`,
      detailsX,
      y + 26
    );

    // Target Company (if provided)
    if (interview.metadata.targetCompany) {
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(detailsX, y + 30, 70, 8, 2, 2, "F");
      doc.setTextColor(59, 130, 246);
      doc.setFontSize(9);
      doc.text(interview.metadata.targetCompany, detailsX + 3, y + 35);

      // Language below
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.text(
        `Language: ${
          interview.metadata.language === "hi" ? "Hindi" : "English"
        }`,
        detailsX,
        y + 45
      );
    } else {
      // Language if no company
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(9);
      doc.text(
        `Language: ${
          interview.metadata.language === "hi" ? "Hindi" : "English"
        }`,
        detailsX,
        y + 35
      );
    }

    // Interview ID (small)
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(7);
    doc.text(`ID: ${interview.interviewId}`, detailsX, y + sectionHeight - 5);

    // Right side - Overall Performance Score
    const rightBoxX = 15 + leftBoxWidth + 5;
    const rightBoxWidth = leftBoxWidth;
    const scoreColor = getScoreColorRGB(report.overallScore);

    drawColoredBox(rightBoxX, y, rightBoxWidth, sectionHeight, [255, 255, 255]);
    drawColoredBox(rightBoxX, y, 4, sectionHeight, scoreColor); // Colored accent

    // "Overall Performance" label
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(12);
    doc.text("Overall Performance", rightBoxX + 10, y + 15);

    // Large score with proper spacing
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setFontSize(48);
    doc.setFont("helvetica", "bold");
    const scoreNumberText = `${report.overallScore}`;
    const scoreNumberWidth = doc.getTextWidth(scoreNumberText);
    doc.text(scoreNumberText, rightBoxX + 20, y + 45);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(20);
    doc.setTextColor(156, 163, 175);
    doc.text("/100", rightBoxX + 20 + scoreNumberWidth + 5, y + 45);

    // Score indicator text
    let scoreLabel = "";
    if (report.overallScore >= 80) scoreLabel = "Excellent";
    else if (report.overallScore >= 60) scoreLabel = "Good";
    else if (report.overallScore >= 40) scoreLabel = "Fair";
    else scoreLabel = "Needs Improvement";

    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(scoreLabel, rightBoxX + 20, y + 54);
    doc.setFont("helvetica", "normal");

    y += sectionHeight + 15;

    // ========== CATEGORY SCORES TABLE ==========
    // Section header with colored background
    drawColoredBox(15, y, pageWidth - 30, 10, [249, 250, 251]);
    drawColoredBox(15, y, pageWidth - 30, 2, [139, 92, 246]); // Top purple line

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.text("Performance Breakdown", 20, y + 8);
    y += 15;

    const categories = [
      {
        name: "Technical Skills",
        score: report.categoryScores.technical,
        color: [168, 85, 247],
      },
      {
        name: "Behavioral",
        score: report.categoryScores.behavioral,
        color: [59, 130, 246],
      },
      {
        name: "Communication",
        score: report.categoryScores.communication,
        color: [16, 185, 129],
      },
      {
        name: "Confidence",
        score: report.categoryScores.confidence,
        color: [251, 146, 60],
      },
    ];

    // Draw table with borders
    const tableHeight = categories.length * 24;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.rect(15, y, pageWidth - 30, tableHeight, "S");

    categories.forEach((cat, index) => {
      const rowY = y + index * 24;
      const bgColor = index % 2 === 0 ? [255, 255, 255] : [249, 250, 251];
      drawColoredBox(15, rowY, pageWidth - 30, 24, bgColor);

      // Colored indicator on left
      drawColoredBox(15, rowY, 4, 24, cat.color);

      // Category name (no icon)
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(11);
      doc.text(cat.name, 25, rowY + 15);

      // Progress bar with proper spacing (ensure it fits in table)
      const progressBarX = 95;
      const progressBarWidth = 70;
      drawProgressBar(
        progressBarX,
        rowY + 8,
        progressBarWidth,
        8,
        cat.score,
        cat.color
      );

      // Score with proper spacing (right-aligned within table)
      doc.setTextColor(cat.color[0], cat.color[1], cat.color[2]);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      const scoreText = `${cat.score}`;
      const scoreTextWidth = doc.getTextWidth(scoreText);

      // Calculate "/100" width
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const slash100Width = doc.getTextWidth("/100");
      const totalScoreWidth = scoreTextWidth + slash100Width + 3;

      // Right-align score within table (with 10px margin from right edge)
      const tableRightEdge = pageWidth - 15;
      const scoreX = tableRightEdge - totalScoreWidth - 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(scoreText, scoreX, rowY + 15);

      // "/100" text with proper spacing
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(10);
      doc.text("/100", scoreX + scoreTextWidth + 3, rowY + 15);

      // Horizontal line between rows (except last)
      if (index < categories.length - 1) {
        doc.setDrawColor(229, 231, 235);
        doc.line(15, rowY + 24, pageWidth - 15, rowY + 24);
      }
    });

    y += tableHeight + 15;

    // Check if we need a new page before strengths section
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    // ========== STRENGTHS SECTION ==========
    // Calculate actual strengths height first
    let strengthsTextHeight = 0;
    doc.setFontSize(10);
    report.strengths.forEach((strength) => {
      const lines = doc.splitTextToSize(strength, pageWidth - 60);
      strengthsTextHeight += Math.max(12, lines.length * 6);
    });
    const strengthsSectionHeight = strengthsTextHeight + 25; // Header + padding

    // Check if strengths section fits on current page
    if (y + strengthsSectionHeight > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    // Green gradient header
    drawColoredBox(15, y, pageWidth - 30, 12, [16, 185, 129]);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("Key Strengths", 20, y + 8);
    y += 17;

    // Strengths box with border
    const strengthsHeight = strengthsTextHeight + 16;
    drawColoredBox(15, y, pageWidth - 30, strengthsHeight, [240, 253, 244]);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.rect(15, y, pageWidth - 30, strengthsHeight, "S");

    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61);

    report.strengths.forEach((strength, index) => {
      // Number badge
      doc.setFillColor(16, 185, 129);
      doc.circle(22, y - 2, 3.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(`${index + 1}`, 20.5, y);

      // Text
      doc.setTextColor(22, 101, 52);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(strength, pageWidth - 60);
      doc.text(lines, 30, y);
      y += Math.max(12, lines.length * 6);
    });

    y += 8;

    // Add proper spacing between sections
    y += 15;

    // Check if we need a new page before improvements section
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    // ========== IMPROVEMENTS SECTION ==========
    // Calculate actual improvements height first
    let improvementsTextHeight = 0;
    doc.setFontSize(10);
    report.improvements.forEach((improvement) => {
      const lines = doc.splitTextToSize(improvement, pageWidth - 60);
      improvementsTextHeight += Math.max(12, lines.length * 6);
    });
    const improvementsSectionHeight = improvementsTextHeight + 25; // Header + padding

    // Check if improvements section fits on current page
    if (y + improvementsSectionHeight > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    // Blue gradient header
    drawColoredBox(15, y, pageWidth - 30, 12, [59, 130, 246]);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("Areas for Improvement", 20, y + 8);
    y += 17;

    // Improvements box with border
    const improvementsHeight = improvementsTextHeight + 16;
    drawColoredBox(15, y, pageWidth - 30, improvementsHeight, [239, 246, 255]);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.rect(15, y, pageWidth - 30, improvementsHeight, "S");

    y += 8;
    doc.setFontSize(10);

    report.improvements.forEach((improvement, index) => {
      // Number badge
      doc.setFillColor(59, 130, 246);
      doc.circle(22, y - 2, 3.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(`${index + 1}`, 20.5, y);

      // Text
      doc.setTextColor(29, 78, 216);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(improvement, pageWidth - 60);
      doc.text(lines, 30, y);
      y += Math.max(12, lines.length * 6);
    });

    y += 8;

    // Add proper spacing before next section
    y += 15;

    // ========== BEHAVIORAL ANALYSIS TABLE ==========
    if (y > 150) {
      doc.addPage();
      y = 20;
    }

    // Purple gradient header
    drawColoredBox(15, y, pageWidth - 30, 12, [168, 85, 247]);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("Behavioral Analysis", 20, y + 8);
    y += 17;

    // Behavioral metrics in a 2x2 grid
    const behavioralMetrics = [
      {
        label: "Confidence",
        value: report.behavioral.confidence,
        unit: "%",
        color: [168, 85, 247],
      },
      {
        label: "Clarity",
        value: report.behavioral.clarity,
        unit: "%",
        color: [59, 130, 246],
      },
      {
        label: "Fluency",
        value: report.behavioral.fluency,
        unit: "%",
        color: [16, 185, 129],
      },
      {
        label: "Filler Words",
        value: report.behavioral.fillersPerMinute.toFixed(1),
        unit: "/min",
        color: [251, 146, 60],
      },
    ];

    const boxWidth = (pageWidth - 40) / 2;
    const boxHeight = 32;
    let xPos = 15;
    let rowY = y;

    behavioralMetrics.forEach((metric, index) => {
      if (index === 2) {
        xPos = 15;
        rowY += boxHeight + 5;
      }

      // Box with gradient background
      drawColoredBox(xPos, rowY, boxWidth, boxHeight, [255, 255, 255]);

      // Top colored bar
      drawColoredBox(xPos, rowY, boxWidth, 3, metric.color);

      // Border
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.rect(xPos, rowY, boxWidth, boxHeight, "S");

      // Label (no icon)
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(9);
      doc.text(metric.label, xPos + 8, rowY + 12);

      // Value with proper spacing
      const numValue =
        typeof metric.value === "number"
          ? metric.value
          : Number.parseFloat(metric.value);
      const valueColor = metric.color;
      doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      const valueText = `${metric.value}`;
      const valueTextWidth = doc.getTextWidth(valueText);
      doc.text(valueText, xPos + 8, rowY + 25);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.text(metric.unit, xPos + 8 + valueTextWidth + 3, rowY + 25);

      // Mini progress bar for percentage metrics (below value)
      if (metric.unit === "%") {
        drawProgressBar(
          xPos + 8,
          rowY + 28,
          boxWidth - 16,
          4,
          numValue,
          metric.color
        );
      }

      xPos += boxWidth + 5;
    });

    y = rowY + boxHeight + 15;

    // ========== RECOMMENDATIONS SECTION ==========
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    // Recommendations box
    drawColoredBox(15, y, pageWidth - 30, 12, [236, 72, 153]);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("Recommended Next Steps", 20, y + 8);
    y += 17;

    const recommendations = [
      "Practice more mock interviews to build confidence",
      "Review and improve on the identified weak areas",
      "Focus on reducing filler words in your responses",
      "Continue building on your strengths",
    ];

    const recHeight = recommendations.length * 10 + 8;
    drawColoredBox(15, y, pageWidth - 30, recHeight, [253, 242, 248]);
    doc.setDrawColor(236, 72, 153);
    doc.setLineWidth(0.5);
    doc.rect(15, y, pageWidth - 30, recHeight, "S");

    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(157, 23, 77);

    recommendations.forEach((rec, index) => {
      doc.text(`• ${rec}`, 20, y);
      y += 10;
    });

    y += 10;

    // ========== FOOTER ==========
    // Add footer on every page
    const addFooter = (pageNum: number) => {
      // Colored footer bar
      drawColoredBox(0, pageHeight - 25, pageWidth, 25, [249, 250, 251]);

      // Footer line
      doc.setDrawColor(139, 92, 246);
      doc.setLineWidth(1);
      doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);

      // Footer content
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text("Generated by Hello Interview", 15, pageHeight - 15);

      // Website
      doc.setTextColor(139, 92, 246);
      doc.text("hellointerview.ai", 15, pageHeight - 10);

      // Date
      doc.setTextColor(107, 114, 128);
      const currentDate = formatDate(new Date().toISOString());
      doc.text(currentDate, pageWidth / 2 - 15, pageHeight - 12);

      // Page number
      doc.setFontSize(9);
      doc.text(`Page ${pageNum}`, pageWidth - 30, pageHeight - 12);

      // Small branding
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(
        "Confidential • For Personal Use Only",
        pageWidth / 2 - 25,
        pageHeight - 5
      );
    };

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i);
    }

    // Save the PDF
    const fileName = `hello-interview-${interview.metadata.role
      .replace(/\s+/g, "-")
      .toLowerCase()}-${formatDate(interview.createdAt).replace(
      /\s+/g,
      "-"
    )}.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !interview || !interview.report) {
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

  const report = interview.report;

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
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" /> Share
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => downloadPDF()}
              >
                <Download className="w-4 h-4" /> Download PDF
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
                  <li key={index} className="flex items-start gap-2">
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
                  <li key={index} className="flex items-start gap-2">
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
                    {report.behavioral.fillersPerMinute < 2
                      ? "Excellent! Very few fillers"
                      : report.behavioral.fillersPerMinute < 4
                      ? "Good, but room for improvement"
                      : "Try to reduce 'um', 'ah', 'like'"}
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
