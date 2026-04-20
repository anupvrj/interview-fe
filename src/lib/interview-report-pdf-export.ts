/**
 * Interview report PDF via server Puppeteer (same flow as resume generate-pdf).
 * HTML + dedicated CSS — Tailwind classes are not available in headless Chrome.
 */

import { interviewApi, type Interview, type InterviewReport } from "@/lib/api";
import { buildOverallExperienceParagraph } from "@/lib/interview-report-overall-experience";
import { sessionAverageScore } from "@/lib/interview-report-session-scores";
import { formatDate } from "@/lib/utils";

export const INTERVIEW_REPORT_PDF_PADDING_MM = {
  top: 12,
  bottom: 12,
  left: 14,
  right: 14,
} as const;

export const INTERVIEW_REPORT_PDF_CSS = `
.ir-doc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; font-size: 10.5pt; line-height: 1.45; }
.ir-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 18px; }
.ir-brand { font-size: 18pt; font-weight: 700; color: #6366f1; }
.ir-date { font-size: 9pt; color: #64748b; }
.ir-h1 { font-size: 20pt; font-weight: 700; color: #111827; margin: 0 0 6px 0; }
.ir-sub { color: #64748b; font-size: 10pt; margin: 0 0 20px 0; }
.ir-card { border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 16px; overflow: hidden; page-break-inside: avoid; }
.ir-card-top { height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6); }
.ir-card-h { padding: 10px 14px 0; }
.ir-card-h h2 { margin: 0; font-size: 12pt; color: #334155; }
.ir-card-h p { margin: 4px 0 0; font-size: 9pt; color: #64748b; }
.ir-card-b { padding: 12px 14px 14px; }
.ir-overall { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.ir-overall-score { text-align: center; }
.ir-overall-num { font-size: 36pt; font-weight: 700; line-height: 1; }
.ir-overall-cap { font-size: 9pt; color: #64748b; margin-top: 4px; }
.ir-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ir-metric { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #fafafa; page-break-inside: avoid; }
.ir-metric-tint-p { background: linear-gradient(135deg, #faf5ff 0%, #ffffff 100%); border-color: #e9d5ff; }
.ir-metric-tint-b { background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%); border-color: #bfdbfe; }
.ir-metric-tint-g { background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); border-color: #bbf7d0; }
.ir-metric-tint-o { background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%); border-color: #fed7aa; }
.ir-metric-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.ir-metric-label { font-size: 10pt; font-weight: 600; color: #334155; }
.ir-metric-val { font-size: 18pt; font-weight: 700; }
.ir-bar-bg { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.ir-bar-fill { height: 100%; border-radius: 4px; }
.ir-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ir-list { margin: 0; padding-left: 18px; }
.ir-list li { margin-bottom: 6px; color: #334155; }
.ir-section-title { font-size: 13pt; font-weight: 700; color: #6366f1; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #e0e7ff; }
.ir-behave-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.ir-pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 8pt; font-weight: 600; margin-right: 4px; margin-bottom: 4px; }
.ir-pill-easy { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.ir-pill-med { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
.ir-pill-hard { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
.ir-pill-type { background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; }
.ir-pill-ok { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.ir-pill-warn { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
.ir-pill-depth { background: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff; }
.ir-qa { border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 14px; page-break-inside: avoid; }
.ir-qa-top { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
.ir-qa-q { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 4px; }
.ir-qa-title { font-size: 11pt; font-weight: 600; color: #1e293b; margin: 0; }
.ir-qa-body { padding: 12px; }
.ir-label { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; margin: 12px 0 6px; }
.ir-label:first-child { margin-top: 0; }
.ir-answer { background: #f8fafc; border-radius: 8px; padding: 10px; font-size: 9.5pt; color: #0f172a; white-space: pre-wrap; }
.ir-suggest { background: #f5f3ff; border-radius: 8px; padding: 10px; font-size: 9.5pt; color: #0f172a; white-space: pre-wrap; }
.ir-scores3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
.ir-score-cell { text-align: center; border: 1px solid #f1f5f9; border-radius: 8px; padding: 8px; background: #fafafa; }
.ir-score-cell p { margin: 0; font-size: 8pt; color: #64748b; }
.ir-score-cell .big { font-size: 16pt; font-weight: 700; margin-top: 4px; }
.ir-foot { margin-top: 24px; padding: 14px; text-align: center; background: linear-gradient(135deg, #f5f3ff, #eff6ff); border-radius: 10px; border: 1px solid #e9d5ff; }
.ir-foot h3 { margin: 0 0 6px; font-size: 12pt; color: #4c1d95; }
.ir-foot p { margin: 0; font-size: 9.5pt; color: #5b21b6; }
.ir-domain { border-left: 3px solid #8b5cf6; padding-left: 10px; margin-bottom: 12px; }
.ir-domain h4 { margin: 0 0 4px; font-size: 10.5pt; color: #5b21b6; }
`;

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

function questionTypeLabel(type: string): string {
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
}

function difficultyPillClass(d: string): string {
  if (d === "easy") return "ir-pill ir-pill-easy";
  if (d === "medium") return "ir-pill ir-pill-med";
  return "ir-pill ir-pill-hard";
}

function fillerHint(fpm: number): string {
  if (fpm < 2) return "Excellent! Very few fillers.";
  if (fpm < 4) return "Good, but room for improvement.";
  return "Try to reduce 'um', 'ah', 'like'.";
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
): string {
  const v = Math.max(0, Math.min(100, value));
  return `<div class="ir-metric ${tintClass}">
    <div class="ir-metric-head">
      <span class="ir-metric-label">${escapeHtml(label)}</span>
      <span class="ir-metric-val" style="color:${pdfScoreColor(v)}">${v}</span>
    </div>
    ${progressBar(v, barColor)}
  </div>`;
}

/**
 * Printable HTML body (injected into Puppeteer wrapper). Pair with INTERVIEW_REPORT_PDF_CSS as templateCSS.
 */
export function buildInterviewReportPdfHtml(
  report: InterviewReport,
  interview: Interview,
  candidateName: string,
): string {
  const genDate = formatDate(new Date().toISOString());
  const intDate = formatDate(interview.createdAt);
  const lang =
    interview.metadata.language === "hi" ? "Hindi" : "English";

  const strengthsHtml =
    report.strengths.length > 0
      ? `<ul class="ir-list">${report.strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
      : "<p style='color:#64748b;font-size:9.5pt;'>None listed.</p>";

  const improveHtml =
    report.improvements.length > 0
      ? `<ul class="ir-list">${report.improvements.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
      : "<p style='color:#64748b;font-size:9.5pt;'>None listed.</p>";

  const behavioralNorm = (u: "%" | "fpm", v: number) =>
    u === "%" ? v : Math.max(0, Math.min((v / 6) * 100, 100));

  const behavioralRows = [
    {
      label: "Confidence",
      value: report.behavioral.confidence,
      unit: "%" as const,
      color: "#a855f7",
    },
    {
      label: "Clarity",
      value: report.behavioral.clarity,
      unit: "%" as const,
      color: "#3b82f6",
    },
    {
      label: "Fluency",
      value: report.behavioral.fluency,
      unit: "%" as const,
      color: "#10b981",
    },
    {
      label: "Filler words",
      value: Number(report.behavioral.fillersPerMinute.toFixed(1)),
      unit: "fpm" as const,
      color: "#f97316",
    },
  ];

  const behavioralHtml = behavioralRows
    .map((row) => {
      const display =
        row.unit === "%"
          ? `${row.value}%`
          : `${row.value} / min`;
      const barPct = behavioralNorm(row.unit, row.value);
      return `<div style="margin-bottom:12px;">
        <div class="ir-metric-head">
          <span class="ir-metric-label">${escapeHtml(row.label)}</span>
          <span class="ir-metric-val" style="color:${row.color}">${escapeHtml(display)}</span>
        </div>
        ${progressBar(barPct, row.color)}
      </div>`;
    })
    .join("");

  const isCodingRoundLayout = !!(
    report.codingSummary && report.codingSummary.problems.length > 0
  );

  const codingScoresHtml =
    report.codingSummary && report.codingSummary.problems.length > 0
      ? `<h2 class="ir-section-title">Practice coding round — problem scores</h2>
  <div class="ir-card"><div class="ir-card-b">
    <p style="margin:0 0 10px;font-size:10.5pt;color:#334155;">
      Overall coding score:
      <strong style="color:${pdfScoreColor(report.codingSummary.overallCodingScore)}">${report.codingSummary.overallCodingScore}</strong> / 100
      <span style="color:#64748b;font-size:9pt;"> (automated tests: public + hidden on submit)</span>
    </p>
    <ul class="ir-list">
      ${report.codingSummary.problems
        .map(
          (p) =>
            `<li><strong>${escapeHtml(p.title)}</strong> — ${p.score}% · ${p.passed}/${p.total} tests · ${escapeHtml(p.language)}</li>`,
        )
        .join("")}
    </ul>
  </div></div>`
      : "";

  const sessionScoresHtml =
    report.codingSummary && report.codingSummary.problems.length > 0
      ? (() => {
          const avg = sessionAverageScore(report);
          const c = report.categoryScores;
          return `<h2 class="ir-section-title">Session scores</h2>
  <div class="ir-card"><div class="ir-card-b">
    <p style="margin:0 0 8px;font-size:10pt;color:#334155;">
      <strong>Discussion overall:</strong> ${report.overallScore}/100 &nbsp;·&nbsp;
      <strong>Coding average:</strong> ${report.codingSummary.overallCodingScore}/100 &nbsp;·&nbsp;
      <strong>Overall session average:</strong> <span style="color:${pdfScoreColor(avg)};font-weight:700;">${avg}</span>/100 <span style="color:#64748b;font-size:9pt;">(mean of discussion + coding)</span>
    </p>
    <p class="ir-label" style="margin-top:12px;">Category scores (discussion)</p>
    <div class="ir-grid2" style="margin-top:8px;">
      ${metricCard("Technical", c.technical, "ir-metric-tint-p", "#6366f1")}
      ${metricCard("Behavioral", c.behavioral, "ir-metric-tint-b", "#3b82f6")}
      ${metricCard("Communication", c.communication, "ir-metric-tint-g", "#10b981")}
      ${metricCard("Confidence", c.confidence, "ir-metric-tint-o", "#f97316")}
    </div>
  </div></div>`;
        })()
      : "";

  const overallExperienceHtml =
    report.codingSummary && report.codingSummary.problems.length > 0
      ? (() => {
          const body = buildOverallExperienceParagraph(report);
          return body
            ? `<h2 class="ir-section-title">Overall experience</h2>
  <div class="ir-card"><div class="ir-card-b"><p style="margin:0;font-size:10.5pt;color:#334155;line-height:1.55;">${escapeHtml(body)}</p></div></div>`
            : "";
        })()
      : "";

  const qaBlocks =
    report.qaAnalysis?.map((qa, index) => {
      const pills = [
        `<span class="${difficultyPillClass(qa.questionDifficulty)}">${escapeHtml(qa.questionDifficulty.toUpperCase())}</span>`,
        `<span class="ir-pill ir-pill-type">${escapeHtml(questionTypeLabel(qa.questionType))}</span>`,
        `<span class="ir-pill ${qa.answerMatchedQuestion ? "ir-pill-ok" : "ir-pill-warn"}">${qa.answerMatchedQuestion ? "Aligned" : "Needs alignment"}</span>`,
        `<span class="ir-pill ir-pill-depth">Depth: ${escapeHtml(qa.technicalDepthMatch)}</span>`,
      ].join("");

      const scores3 = [
        { label: "Correctness", value: qa.correctnessScore },
        { label: "Clarity", value: qa.clarityScore },
        { label: "Completeness", value: qa.completenessScore },
      ]
        .map(
          (m) => `<div class="ir-score-cell">
          <p>${escapeHtml(m.label)}</p>
          <div class="big" style="color:${pdfScoreColor(m.value)}">${m.value}</div>
        </div>`,
        )
        .join("");

      const strList =
        qa.strengths?.length > 0
          ? `<ul class="ir-list">${qa.strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
          : "";
      const impList =
        qa.improvements?.length > 0
          ? `<ul class="ir-list">${qa.improvements.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
          : "";

      return `<div class="ir-qa">
        <div class="ir-qa-top">
          <p class="ir-qa-q">Question #${index + 1}</p>
          <p class="ir-qa-title">${escapeHtml(qa.question)}</p>
          <div style="margin-top:8px;">${pills}</div>
        </div>
        <div class="ir-qa-body">
          <p class="ir-label">Meta</p>
          <p style="font-size:9pt;color:#64748b;margin:0 0 8px;">
            Experience alignment: ${qa.experienceAlignmentScore} / 100
          </p>
          <p class="ir-label">Candidate answer</p>
          <div class="ir-answer">${escapeHtml(qa.candidateAnswer)}</div>
          <p class="ir-label">Suggested answer</p>
          <div class="ir-suggest">${escapeHtml(qa.suggestedAnswer)}</div>
          <div class="ir-scores3">${scores3}</div>
          ${qa.validationNotes && qa.validationNotes !== "N/A" ? `<p style="font-size:9pt;color:#64748b;margin-top:8px;">${escapeHtml(qa.validationNotes)}</p>` : ""}
          <p class="ir-label">Feedback</p>
          <p style="font-size:9.5pt;color:#334155;margin:0;">${escapeHtml(qa.feedback)}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
            <div>
              <p class="ir-label" style="color:#047857;">Strengths</p>
              ${strList || "<span style='font-size:9pt;color:#64748b'>—</span>"}
            </div>
            <div>
              <p class="ir-label" style="color:#c2410c;">Improvements</p>
              ${impList || "<span style='font-size:9pt;color:#64748b'>—</span>"}
            </div>
          </div>
        </div>
      </div>`;
    })
    .join("") || "";

  const qaSectionHtml = qaBlocks
    ? `<h2 class="ir-section-title">Question-by-question analysis</h2>
  <p class="ir-sub" style="margin-top:-12px;">Voice discussion and interview Q&amp;A — per-question scoring and feedback</p>
  ${qaBlocks}`
    : "";

  const domainHtml =
    report.domainSpecificFeedback?.length > 0
      ? `<h2 class="ir-section-title">Domain-specific feedback</h2>
        ${report.domainSpecificFeedback
          .map(
            (d) => `<div class="ir-domain">
            <h4>${escapeHtml(d.domain)} — ${d.score}</h4>
            <p style="margin:0 0 6px;font-size:9.5pt;color:#334155;">${escapeHtml(d.feedback)}</p>
            ${
              d.recommendations?.length
                ? `<ul class="ir-list">${d.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>`
                : ""
            }
          </div>`,
          )
          .join("")}`
      : "";

  const reportH1 =
    interview.metadata.interviewKind === "coding_practice"
      ? "Practice coding round report"
      : "Interview Performance Report";

  const overallPerformanceAndCategoryHtml = !isCodingRoundLayout
    ? `<div class="ir-card">
    <div class="ir-card-top"></div>
    <div class="ir-card-b">
      <div class="ir-overall">
        <div>
          <h2 style="margin:0 0 4px;font-size:14pt;color:#1e293b;">Overall performance</h2>
          <p style="margin:0;font-size:9.5pt;color:#64748b;">Across all scored categories</p>
        </div>
        <div class="ir-overall-score">
          <div class="ir-overall-num" style="color:${pdfScoreColor(report.overallScore)}">${report.overallScore}</div>
          <div class="ir-overall-cap">out of 100</div>
        </div>
      </div>
    </div>
  </div>

  <h2 class="ir-section-title">Category scores</h2>
  <div class="ir-grid2">
    ${metricCard("Technical skills", report.categoryScores.technical, "ir-metric-tint-p", "#6366f1")}
    ${metricCard("Behavioral", report.categoryScores.behavioral, "ir-metric-tint-b", "#3b82f6")}
    ${metricCard("Communication", report.categoryScores.communication, "ir-metric-tint-g", "#10b981")}
    ${metricCard("Confidence", report.categoryScores.confidence, "ir-metric-tint-o", "#f97316")}
  </div>`
    : "";

  return `<div class="ir-doc">
  <div class="ir-header">
    <span class="ir-brand">Interview Trix</span>
    <span class="ir-date">Generated ${escapeHtml(genDate)}</span>
  </div>
  <h1 class="ir-h1">${escapeHtml(reportH1)}</h1>
  <p class="ir-sub">${escapeHtml(interview.metadata.role)} • ${escapeHtml(intDate)}</p>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;font-size:9.5pt;margin-bottom:18px;color:#334155;">
    <div><strong style="color:#64748b;display:block;font-size:8pt;text-transform:uppercase;">Interview ID</strong>${escapeHtml(interview.interviewId)}</div>
    <div><strong style="color:#64748b;display:block;font-size:8pt;text-transform:uppercase;">Company</strong>${escapeHtml(interview.metadata.targetCompany || "Not specified")}</div>
    <div><strong style="color:#64748b;display:block;font-size:8pt;text-transform:uppercase;">Candidate</strong>${escapeHtml(candidateName)}</div>
    <div><strong style="color:#64748b;display:block;font-size:8pt;text-transform:uppercase;">Language</strong>${escapeHtml(lang)}</div>
  </div>

  ${sessionScoresHtml}
  ${codingScoresHtml}
  ${overallExperienceHtml}
  ${isCodingRoundLayout ? qaSectionHtml : ""}

  ${overallPerformanceAndCategoryHtml}

  <h2 class="ir-section-title">Strengths &amp; improvements</h2>
  <div class="ir-two-col">
    <div class="ir-card" style="margin-bottom:0;border-color:#bbf7d0;background:#f0fdf4;">
      <div class="ir-card-b"><strong style="color:#15803d;">Strengths</strong>${strengthsHtml}</div>
    </div>
    <div class="ir-card" style="margin-bottom:0;border-color:#bfdbfe;background:#eff6ff;">
      <div class="ir-card-b"><strong style="color:#1d4ed8;">Areas for improvement</strong>${improveHtml}</div>
    </div>
  </div>

  <h2 class="ir-section-title">Behavioral metrics</h2>
  <div class="ir-card"><div class="ir-card-b">
    <div class="ir-behave-grid">
      <div>${behavioralHtml}</div>
      <div>
        <div style="border:1px solid #e9d5ff;border-radius:8px;padding:12px;background:#faf5ff;margin-bottom:10px;">
          <div style="font-weight:600;color:#5b21b6;font-size:10pt;">Filler words</div>
          <div style="font-size:20pt;font-weight:700;color:#7c3aed;">${report.behavioral.fillersPerMinute.toFixed(1)} <span style="font-size:11pt;font-weight:500;">/ min</span></div>
          <div style="font-size:8.5pt;color:#6b21a8;margin-top:4px;">${escapeHtml(fillerHint(report.behavioral.fillersPerMinute))}</div>
        </div>
      </div>
    </div>
  </div></div>

  ${domainHtml}

  ${!isCodingRoundLayout ? qaSectionHtml : ""}

  <div class="ir-foot">
    <h3>Ready for your next interview?</h3>
    <p>Keep practicing to improve your scores and build confidence.</p>
  </div>
</div>`;
}

export async function generateInterviewReportPdfViaServer(params: {
  interviewId: string;
  htmlContent: string;
  templateCSS?: string;
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}): Promise<{ downloadUrl: string; s3Key: string }> {
  const { interviewId, htmlContent, templateCSS = INTERVIEW_REPORT_PDF_CSS, padding = INTERVIEW_REPORT_PDF_PADDING_MM } = params;
  return interviewApi.generateReportPDF(
    interviewId,
    htmlContent,
    padding,
    templateCSS,
  );
}
