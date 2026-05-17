/**
 * System design practice report PDF — same Puppeteer pipeline as interview reports.
 */

import type {
  SystemDesignPracticeReport,
  SystemDesignDimensionScores,
  SystemDesignDimensionVerdicts,
} from "@/lib/api";
import { jsPDF } from "jspdf";
import {
  INTERVIEW_REPORT_PDF_CSS,
  INTERVIEW_REPORT_PDF_PADDING_MM,
} from "@/lib/interview-report-pdf-export";
import { formatDate } from "@/lib/utils";
import { systemDesignApi } from "@/lib/api";

export const SYSTEM_DESIGN_REPORT_PDF_PADDING_MM =
  INTERVIEW_REPORT_PDF_PADDING_MM;
export const SYSTEM_DESIGN_REPORT_PDF_CSS = INTERVIEW_REPORT_PDF_CSS;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pdfScoreColor(score: number): string {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#2563eb";
  if (score >= 40) return "#ca8a04";
  return "#dc2626";
}

function progressBar(pct: number, color: string): string {
  const w = Math.max(0, Math.min(100, pct));
  return `<div class="ir-bar-bg"><div class="ir-bar-fill" style="width:${w}%;background:${color}"></div></div>`;
}

function metricCard(
  label: string,
  value: number,
  tintClass: string,
  barColor: string,
  verdict?: string,
): string {
  const v = Math.max(0, Math.min(100, value));
  const verdictBlock = verdict?.trim()
    ? `<p style="margin-top:8px;font-size:9pt;color:#475569;">${escapeHtml(verdict.trim())}</p>`
    : "";
  return `<div class="ir-metric ${tintClass}">
    <div class="ir-metric-head">
      <span class="ir-metric-label">${escapeHtml(label)}</span>
      <span class="ir-metric-val" style="color:${pdfScoreColor(v)}">${v}</span>
    </div>
    ${progressBar(v, barColor)}
    ${verdictBlock}
  </div>`;
}

function listSection(items: string[], emptyNote: string): string {
  if (!items.length) {
    return `<p style='color:#64748b;font-size:9.5pt;'>${escapeHtml(emptyNote)}</p>`;
  }
  return `<ul class="ir-list">${items.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`;
}

function orderedList(items: string[], emptyNote: string): string {
  if (!items.length) {
    return `<p style='color:#64748b;font-size:9.5pt;'>${escapeHtml(emptyNote)}</p>`;
  }
  return `<ol class="ir-list">${items.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`;
}

const DIMENSION_PDF_META: Array<{
  key: keyof SystemDesignDimensionScores;
  label: string;
  tintClass: string;
  barColor: string;
}> = [
  {
    key: "scopeRequirements",
    label: "Scope & requirements (~15%)",
    tintClass: "ir-metric-tint-p",
    barColor: "#0ea5e9",
  },
  {
    key: "componentArchitecture",
    label: "Component architecture (~25%)",
    tintClass: "ir-metric-tint-b",
    barColor: "#2563eb",
  },
  {
    key: "scalingDeepDive",
    label: "Scaling & deep dive (~40%)",
    tintClass: "ir-metric-tint-g",
    barColor: "#0891b2",
  },
  {
    key: "tradeoffsCommunication",
    label: "Trade-offs & communication (~20%)",
    tintClass: "ir-metric-tint-o",
    barColor: "#6366f1",
  },
];

export function buildSystemDesignReportPdfHtml(
  report: SystemDesignPracticeReport,
  opts: {
    problemTitle: string;
    completedAtIso?: string | null;
    candidateName: string;
  },
): string {
  const genDate = formatDate(new Date().toISOString());
  const completedLabel = opts.completedAtIso
    ? formatDate(opts.completedAtIso)
    : "recently";
  const verdicts = report.dimensionVerdicts ?? ({} as SystemDesignDimensionVerdicts);

  const dimsGrid = DIMENSION_PDF_META.map(
    ({ key, label, tintClass, barColor }) =>
      metricCard(
        label,
        report.dimensionScores[key],
        tintClass,
        barColor,
        verdicts[key],
      ),
  ).join("");

  const overallColor = pdfScoreColor(report.overallScore);

  return `
<div class="ir-doc">
  <div class="ir-header">
    <span class="ir-brand">InterviewTrix · System Design</span>
    <span class="ir-date">Generated · ${escapeHtml(genDate)}</span>
  </div>
  <h1 class="ir-h1">System design session report</h1>
  <p class="ir-sub">${escapeHtml(opts.problemTitle)} · Completed ${escapeHtml(completedLabel)}</p>

  <div class="ir-card">
    <div class="ir-card-top" style="background:linear-gradient(90deg,${overallColor},#6366f1);"></div>
    <div class="ir-card-h"><h2>Overall performance</h2>
    <p>Holistic rubric score from transcript and diagram evaluation.</p></div>
    <div class="ir-card-b">
      <div class="ir-overall">
        <div>
          <p style="margin:0;font-size:9.5pt;color:#64748b;">Summary</p>
          <p style="margin:8px 0 0;font-size:10pt;color:#334155;">${escapeHtml(report.overallSummary || "—")}</p>
        </div>
        <div class="ir-overall-score">
          <div class="ir-overall-num" style="color:${overallColor};">${report.overallScore}</div>
          <div class="ir-overall-cap">out of 100</div>
        </div>
      </div>
    </div>
  </div>

  <h2 class="ir-section-title">Rubric dimensions</h2>
  <div class="ir-grid2">
    ${dimsGrid}
  </div>

  <h2 class="ir-section-title">Analysis</h2>
  <div class="ir-two-col">
    <div class="ir-card" style="margin-bottom:0;border-color:#bbf7d0;background:#f0fdf4;">
      <div class="ir-card-b"><strong style="color:#15803d;">What you did well</strong>
      ${listSection(report.whatYouDidWell, "No items listed.")}</div>
    </div>
    <div class="ir-card" style="margin-bottom:0;border-color:#bfdbfe;background:#eff6ff;">
      <div class="ir-card-b"><strong style="color:#1d4ed8;">Gaps in your design</strong>
      ${listSection(report.gapsInDesign, "No gaps listed.")}</div>
    </div>
  </div>

  <div class="ir-two-col" style="margin-top:12px;">
    <div class="ir-card" style="margin-bottom:0;">
      <div class="ir-card-b"><strong style="color:#0369a1;">Technical approaches covered</strong>
      ${listSection(report.approachesCovered, "None listed.")}</div>
    </div>
    <div class="ir-card" style="margin-bottom:0;border-color:#fecdd3;background:#fff1f2;">
      <div class="ir-card-b"><strong style="color:#be123c;">Missed or weak areas</strong>
      ${listSection(report.approachesMissedOrWeak, "None listed.")}</div>
    </div>
  </div>

  <h2 class="ir-section-title">Concrete recommendations</h2>
  <div class="ir-card"><div class="ir-card-b">
    ${orderedList(report.concreteRecommendations, "No additional steps listed.")}
  </div></div>

  <div style="margin-top:16px;font-size:9pt;color:#64748b;border-top:1px solid #e2e8f0;padding-top:12px;">
    <div><strong style="color:#64748b;text-transform:uppercase;font-size:8pt;">Candidate</strong> ${escapeHtml(opts.candidateName)}</div>
  </div>

  <div class="ir-foot">
    <h3>Practice another system design?</h3>
    <p>Keep rehearsing and refining how you sketch and narrate trade-offs.</p>
  </div>
</div>`;
}

/** Client fallback when Puppeteer PDF is unavailable — text layout only. */
export function buildSystemDesignReportPdfBlob(
  report: SystemDesignPracticeReport,
  opts: {
    problemTitle: string;
    completedAtIso?: string | null;
    candidateName: string;
  },
): Blob | null {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const completedLabel = opts.completedAtIso ? formatDate(opts.completedAtIso) : "recently";

  const ensureSpace = (h = 20) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (cursorY + h > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
  };

  const addTitle = (t: string) => {
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text(t, margin, cursorY);
    cursorY += 22;
    doc.setTextColor(30, 41, 59);
  };

  const addBody = (text: string, size = 10) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, contentWidth);
    for (const line of lines as string[]) {
      ensureSpace(14);
      doc.text(line, margin, cursorY);
      cursorY += 13;
    }
    cursorY += 6;
  };

  const addBullets = (items: string[], heading: string) => {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(heading, margin, cursorY);
    cursorY += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    for (const item of items) {
      const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 12);
      for (const line of lines as string[]) {
        ensureSpace(14);
        doc.text(line, margin + 8, cursorY);
        cursorY += 12;
      }
    }
    cursorY += 8;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.text("System design session report", margin, cursorY);
  cursorY += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  addBody(`${opts.problemTitle}`, 11);
  addBody(`Completed ${completedLabel} · Candidate: ${opts.candidateName}`, 9);
  cursorY += 4;

  addTitle(`Overall score: ${report.overallScore} / 100`);
  addBody(report.overallSummary || "");

  const verdicts = report.dimensionVerdicts ?? {};
  const dimLabels: Array<{ key: keyof SystemDesignPracticeReport["dimensionScores"]; label: string }> = [
    { key: "scopeRequirements", label: "Scope & requirements" },
    { key: "componentArchitecture", label: "Component architecture" },
    { key: "scalingDeepDive", label: "Scaling & deep dive" },
    { key: "tradeoffsCommunication", label: "Trade-offs & communication" },
  ];
  addTitle("Rubric dimensions");
  for (const { key, label } of dimLabels) {
    const v = report.dimensionScores[key];
    const ver = verdicts[key]?.trim();
    addBody(`${label}: ${v}/100${ver ? ` — ${ver}` : ""}`, 10);
  }

  if (report.whatYouDidWell.length) addBullets(report.whatYouDidWell, "What you did well");
  if (report.gapsInDesign.length) addBullets(report.gapsInDesign, "Gaps in your design");
  if (report.approachesCovered.length)
    addBullets(report.approachesCovered, "Technical approaches covered");
  if (report.approachesMissedOrWeak.length)
    addBullets(report.approachesMissedOrWeak, "Missed or weak areas");
  if (report.concreteRecommendations.length) {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Concrete recommendations", margin, cursorY);
    cursorY += 16;
    doc.setFont("helvetica", "normal");
    let n = 1;
    for (const step of report.concreteRecommendations) {
      const lines = doc.splitTextToSize(`${n}. ${step}`, contentWidth);
      for (const line of lines as string[]) {
        ensureSpace(14);
        doc.text(line, margin, cursorY);
        cursorY += 12;
      }
      n += 1;
    }
    cursorY += 8;
  }

  return doc.output("blob");
}

export async function generateSystemDesignReportPdfViaServer(params: {
  sessionId: string;
  htmlContent: string;
  templateCSS?: string;
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}): Promise<{ downloadUrl: string; s3Key: string }> {
  const { sessionId, htmlContent, templateCSS, padding } = params;
  return systemDesignApi.generatePracticeReportPdf(
    sessionId,
    htmlContent,
    padding ?? SYSTEM_DESIGN_REPORT_PDF_PADDING_MM,
    templateCSS ?? SYSTEM_DESIGN_REPORT_PDF_CSS,
  );
}
