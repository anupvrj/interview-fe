/**
 * iX Report PDF — institutional marksheet layout via server Puppeteer.
 */

import { ixScoreApi, type IxScoreSnapshot } from "@/lib/api";
import { INTERVIEW_REPORT_PDF_PADDING_MM } from "@/lib/interview-report-pdf-export";
import {
  IX_CATEGORY_KEYS,
  IX_CATEGORY_META,
} from "@/lib/ix-score-constants";
import { getInterviewTrixLogoDataUri } from "@/lib/pdf-brand-assets";
import { formatDate } from "@/lib/utils";

/** InterviewTrix brand purple — marksheet theme */
const MS_BRAND = "#6e5edc";
const MS_BRAND_DARK = "#5a4bc4";
const MS_BRAND_LIGHT = "#f0edff";
const MS_BRAND_SOFT = "#ebe7ff";
const MS_BRAND_BORDER = "#c4b8f0";

export const IX_REPORT_MARKSHEET_CSS = `
.ms-doc {
  font-family: Georgia, "Times New Roman", Times, serif;
  color: #1a1a2e;
  font-size: 10pt;
  line-height: 1.45;
}
.ms-outer {
  border: 3px double ${MS_BRAND};
  padding: 14px;
  background: #fff;
}
.ms-inner {
  border: 1px solid ${MS_BRAND};
  padding: 18px 20px 16px;
}
.ms-head {
  text-align: center;
  border-bottom: 2px solid ${MS_BRAND};
  padding-bottom: 14px;
  margin-bottom: 14px;
}
.ms-logo {
  height: 46px;
  width: auto;
  max-width: 260px;
  object-fit: contain;
  display: block;
  margin: 0 auto 8px;
}
.ms-tag {
  font-size: 8.5pt;
  color: #475569;
  margin: 4px 0 0;
  font-style: italic;
}
.ms-doc-title {
  display: inline-block;
  margin: 12px auto 0;
  padding: 6px 28px;
  border: 2px solid ${MS_BRAND};
  background: linear-gradient(180deg, #faf9ff 0%, ${MS_BRAND_LIGHT} 100%);
  font-size: 14pt;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${MS_BRAND};
}
.ms-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 8.5pt;
  color: #334155;
  margin-bottom: 12px;
  padding: 0 2px;
}
.ms-meta strong { color: ${MS_BRAND}; }
.ms-info {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  font-size: 9pt;
}
.ms-info td {
  border: 1px solid ${MS_BRAND_BORDER};
  padding: 7px 10px;
  vertical-align: top;
}
.ms-info .lbl {
  width: 28%;
  background: ${MS_BRAND_LIGHT};
  font-weight: 700;
  color: ${MS_BRAND};
}
.ms-part {
  font-size: 9.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #fff;
  background: ${MS_BRAND};
  padding: 6px 10px;
  margin: 14px 0 0;
}
.ms-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
  margin-top: 0;
}
.ms-table th {
  background: ${MS_BRAND};
  border: 1px solid ${MS_BRAND_DARK};
  padding: 7px 8px;
  text-align: center;
  font-weight: 700;
  color: #fff;
  font-size: 8.5pt;
}
.ms-table td {
  border: 1px solid ${MS_BRAND_BORDER};
  padding: 7px 8px;
  vertical-align: middle;
}
.ms-table .c { text-align: center; }
.ms-table .r { text-align: right; }
.ms-table tbody tr:nth-child(even) { background: ${MS_BRAND_LIGHT}; }
.ms-total-row td {
  font-weight: 700;
  background: ${MS_BRAND_SOFT} !important;
  border-top: 2px solid ${MS_BRAND};
  color: #1a1a2e;
}
.ms-grade-a { color: #047857; font-weight: 700; }
.ms-grade-b { color: ${MS_BRAND}; font-weight: 700; }
.ms-grade-c { color: #b45309; font-weight: 700; }
.ms-grade-d { color: #be123c; font-weight: 700; }
.ms-grade-na { color: #94a3b8; }
.ms-summary-box {
  border: 2px solid ${MS_BRAND};
  margin-top: 14px;
  display: flex;
  align-items: stretch;
}
.ms-summary-left {
  flex: 1;
  padding: 12px 14px;
  background: ${MS_BRAND_LIGHT};
  border-right: 1px solid ${MS_BRAND_BORDER};
}
.ms-summary-right {
  width: 160px;
  text-align: center;
  padding: 12px 10px;
  background: linear-gradient(180deg, ${MS_BRAND_SOFT} 0%, #fff 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.ms-summary-score {
  font-size: 32pt;
  font-weight: 700;
  line-height: 1;
  color: ${MS_BRAND};
}
.ms-summary-cap {
  font-size: 8pt;
  color: #64748b;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.ms-formula {
  background: ${MS_BRAND_LIGHT};
  border: 1px solid ${MS_BRAND_BORDER};
  padding: 8px 10px;
  margin: 8px 0;
  font-family: ui-monospace, "Courier New", monospace;
  font-size: 8.5pt;
  color: #0f172a;
}
.ms-notes {
  border: 1px dashed ${MS_BRAND};
  padding: 10px 12px;
  margin-top: 14px;
  font-size: 8pt;
  color: #475569;
  background: ${MS_BRAND_LIGHT};
}
.ms-notes ul { margin: 6px 0 0; padding-left: 18px; }
.ms-notes li { margin-bottom: 4px; }
.ms-disclaimer {
  font-size: 7.5pt;
  color: #64748b;
  text-align: center;
  margin-top: 10px;
  font-style: italic;
}
.ms-accent { color: ${MS_BRAND}; font-weight: 700; }
`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pdfScoreColor(score: number): string {
  if (score >= 80) return "#047857";
  if (score >= 60) return MS_BRAND;
  if (score >= 40) return "#b45309";
  return "#be123c";
}

function ixGrade(score: number | null | undefined): {
  letter: string;
  remark: string;
  className: string;
} {
  if (score == null) {
    return { letter: "—", remark: "Not assessed", className: "ms-grade-na" };
  }
  if (score >= 80) {
    return { letter: "A", remark: "Excellent", className: "ms-grade-a" };
  }
  if (score >= 60) {
    return { letter: "B", remark: "Good", className: "ms-grade-b" };
  }
  if (score >= 40) {
    return { letter: "C", remark: "Average", className: "ms-grade-c" };
  }
  return { letter: "D", remark: "Needs improvement", className: "ms-grade-d" };
}

function buildReportRef(snapshot: IxScoreSnapshot): string {
  const d = new Date(snapshot.computedAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const id = snapshot.clerkId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  return `IX-${y}${m}-${id || "00000000"}`;
}

function buildMarksheetCategoryRows(snapshot: IxScoreSnapshot): string {
  const opted = IX_CATEGORY_KEYS.filter((k) => snapshot.optIns[k]);
  if (opted.length === 0) {
    return `<tr><td colspan="7" class="c">No interview categories opted in.</td></tr>`;
  }

  return opted
    .map((key, idx) => {
      const meta = IX_CATEGORY_META[key];
      const cat = snapshot.categories[key];
      const score = cat?.score ?? null;
      const n = cat?.sessionCount ?? 0;
      const grade = ixGrade(score);
      const status =
        n > 0 && score != null ? "Completed" : n > 0 ? "In progress" : "Not attempted";

      return `<tr>
        <td class="c">${idx + 1}</td>
        <td>${escapeHtml(meta.label)}</td>
        <td class="c">${n}</td>
        <td class="c">100</td>
        <td class="c" style="color:${score != null ? pdfScoreColor(score) : "#94a3b8"};font-weight:700;">${score ?? "—"}</td>
        <td class="c ${grade.className}">${grade.letter}</td>
        <td class="c">${status}</td>
      </tr>`;
    })
    .join("");
}

function buildOverallWorkedExample(snapshot: IxScoreSnapshot): string {
  const categoriesWithScores = IX_CATEGORY_KEYS.filter((k) => {
    if (!snapshot.optIns[k]) return false;
    const cat = snapshot.categories[k];
    return cat?.hasData && cat.score != null;
  });

  const overallParts = categoriesWithScores
    .map((key) => snapshot.categories[key]?.score)
    .filter((s): s is number => s != null);

  if (overallParts.length === 0) {
    return "Complete at least one session in an opted-in category.";
  }
  if (overallParts.length === 1) {
    return `Only one category has data → Overall iX Score = ${overallParts[0]}.`;
  }

  const sum = overallParts.reduce((a, b) => a + b, 0);
  const avg = sum / overallParts.length;
  const rounded = Math.round(avg);
  return (
    `ROUND( (${overallParts.join(" + ")}) ÷ ${overallParts.length} )` +
    ` = ROUND( ${sum} ÷ ${overallParts.length} ) = <strong>${rounded}</strong>`
  );
}

function buildCalculationMethodologyHtml(snapshot: IxScoreSnapshot): string {
  const optedCategories = IX_CATEGORY_KEYS.filter((k) => snapshot.optIns[k]);
  const categoriesWithScores = optedCategories.filter((key) => {
    const cat = snapshot.categories[key];
    return cat?.hasData && cat.score != null;
  });

  const verificationRows = optedCategories
    .map((key) => {
      const meta = IX_CATEGORY_META[key];
      const cat = snapshot.categories[key];
      const score = cat?.score;
      const n = cat?.sessionCount ?? 0;
      const formulaCell =
        n > 0 && score != null
          ? `ROUND( Σ ÷ ${n} ) = ${score}`
          : "—";
      return `<tr>
        <td>${escapeHtml(meta.label)}</td>
        <td class="c">${n}</td>
        <td class="c">${score ?? "—"}</td>
        <td>${formulaCell}</td>
      </tr>`;
    })
    .join("");

  const comm = snapshot.communication;
  const overallGrade = ixGrade(snapshot.overall.average);

  return `
  <div class="ms-part">Part C — Grading scheme</div>
  <table class="ms-table">
    <thead>
      <tr>
        <th>Marks range</th>
        <th>Grade</th>
        <th>Remark</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="c">80 – 100</td><td class="c ms-grade-a">A</td><td>Excellent</td></tr>
      <tr><td class="c">60 – 79</td><td class="c ms-grade-b">B</td><td>Good</td></tr>
      <tr><td class="c">40 – 59</td><td class="c ms-grade-c">C</td><td>Average</td></tr>
      <tr><td class="c">0 – 39</td><td class="c ms-grade-d">D</td><td>Needs improvement</td></tr>
    </tbody>
  </table>

  <div class="ms-part">Part D — Calculation methodology</div>
  <p style="margin:8px 0 0;font-size:8.5pt;color:#475569;">Formulae for manual verification (all scores 0–100, ROUND = nearest integer).</p>

  <p style="margin:10px 0 4px;font-size:9pt;font-weight:700;" class="ms-accent">1. Session score (per interview)</p>
  <p style="margin:0 0 6px;font-size:8.5pt;color:#334155;line-height:1.5;">
    <strong>Screening:</strong> AI report overall &nbsp;|&nbsp;
    <strong>Coding:</strong> ROUND((discussion + coding) ÷ 2) or discussion only &nbsp;|&nbsp;
    <strong>System Design:</strong> report overall &nbsp;|&nbsp;
    <strong>Peer:</strong> report or interviewer manual overall
  </p>

  <p style="margin:10px 0 4px;font-size:9pt;font-weight:700;" class="ms-accent">2. Category score</p>
  <div class="ms-formula">Category Score = ROUND( Σ session scores in category ÷ number of sessions )</div>
  <table class="ms-table">
    <thead>
      <tr>
        <th>Category</th>
        <th>Sessions</th>
        <th>Score</th>
        <th>Verification</th>
      </tr>
    </thead>
    <tbody>${verificationRows}</tbody>
  </table>

  <p style="margin:12px 0 4px;font-size:9pt;font-weight:700;" class="ms-accent">3. Overall iX Score</p>
  <div class="ms-formula">Overall iX Score = ROUND( Σ category scores with data ÷ categories with data )</div>
  <p style="margin:6px 0 0;font-size:8.5pt;color:#334155;">Worked example: ${buildOverallWorkedExample(snapshot)}</p>
  ${
    snapshot.overall.average != null && categoriesWithScores.length > 1
      ? `<p style="margin:6px 0 0;font-size:8pt;color:#64748b;">Sum: ${snapshot.overall.rawSum} · Categories with data: ${snapshot.overall.categoriesWithData} · Opted-in: ${snapshot.overall.optedCount} · Grade: <span class="${overallGrade.className}">${overallGrade.letter} (${overallGrade.remark})</span></p>`
      : ""
  }

  <p style="margin:12px 0 4px;font-size:9pt;font-weight:700;" class="ms-accent">4. Communication (informational — not in Overall iX Score)</p>
  <div class="ms-formula">
    Behavioural = ROUND( Σ behavioural ÷ ${comm.sessionCount || "n"} ) &nbsp;|&nbsp;
    ${escapeHtml(comm.technicalLabel)} = ROUND( Σ skills ÷ ${comm.sessionCount || "n"} )
  </div>

  <div class="ms-notes">
    <strong>Important notes</strong>
    <ul>
      <li>Only opted-in interview categories appear on this marksheet.</li>
      <li>Categories with no sessions are excluded from the overall average (not counted as zero).</li>
      <li>Session-level detail is available in the InterviewTrix dashboard session history.</li>
      <li>This is a computer-generated statement of performance; no physical signature is required for online verification.</li>
      <li>Data computed on ${escapeHtml(formatDate(snapshot.computedAt))}.</li>
    </ul>
  </div>`;
}

export function buildIxReportPdfHtml(
  snapshot: IxScoreSnapshot,
  candidateName: string,
  logoDataUri: string,
  candidateEmail = "",
): string {
  const genDate = formatDate(snapshot.computedAt);
  const reportRef = buildReportRef(snapshot);
  const overall = snapshot.overall.average;
  const overallGrade = ixGrade(overall);
  const comm = snapshot.communication;
  const hasComm =
    comm.sessionCount > 0 &&
    (comm.behavioral != null || comm.technical != null);

  const commRows = hasComm
    ? `<table class="ms-table" style="margin-top:0;">
        <thead>
          <tr>
            <th>Component</th>
            <th>Max marks</th>
            <th>Marks obtained</th>
            <th>Grade</th>
            <th>Sessions considered</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Behavioural communication</td>
            <td class="c">100</td>
            <td class="c" style="font-weight:700;color:${comm.behavioral != null ? pdfScoreColor(comm.behavioral) : "#94a3b8"}">${comm.behavioral ?? "—"}</td>
            <td class="c ${ixGrade(comm.behavioral).className}">${ixGrade(comm.behavioral).letter}</td>
            <td class="c">${comm.sessionCount}</td>
          </tr>
          <tr>
            <td>${escapeHtml(comm.technicalLabel)}</td>
            <td class="c">100</td>
            <td class="c" style="font-weight:700;color:${comm.technical != null ? pdfScoreColor(comm.technical) : "#94a3b8"}">${comm.technical ?? "—"}</td>
            <td class="c ${ixGrade(comm.technical).className}">${ixGrade(comm.technical).letter}</td>
            <td class="c">${comm.sessionCount}</td>
          </tr>
        </tbody>
      </table>`
    : `<p style="margin:8px 0 0;font-size:8.5pt;color:#64748b;">No communication data — complete interview sessions to populate this section.</p>`;

  const optedCount = snapshot.overall.optedCount;
  const withData = snapshot.overall.categoriesWithData;

  return `<div class="ms-doc">
  <div class="ms-outer">
    <div class="ms-inner">

      <div class="ms-head">
        <img class="ms-logo" src="${logoDataUri}" alt="InterviewTrix" />
        <p class="ms-tag">AI Interview Practice &amp; Performance Assessment Platform</p>
        <div class="ms-doc-title">Statement of Performance — iX Report</div>
      </div>

      <div class="ms-meta">
        <span><strong>Ref. No.:</strong> ${escapeHtml(reportRef)}</span>
        <span><strong>Date of issue:</strong> ${escapeHtml(genDate)}</span>
      </div>

      <table class="ms-info">
        <tr>
          <td class="lbl">Name of candidate</td>
          <td>${escapeHtml(candidateName)}</td>
          <td class="lbl">Report type</td>
          <td>iX Performance Report</td>
        </tr>
        <tr>
          <td class="lbl">Email</td>
          <td>${candidateEmail.trim() ? escapeHtml(candidateEmail.trim()) : "—"}</td>
          <td class="lbl">Categories opted</td>
          <td>${optedCount}</td>
        </tr>
        <tr>
          <td class="lbl">Assessment period</td>
          <td colspan="3">All completed sessions up to ${escapeHtml(genDate)} (${withData} of ${optedCount} opted categor${optedCount === 1 ? "y" : "ies"} with scored data)</td>
        </tr>
      </table>

      <div class="ms-part">Part A — Category performance</div>
      <table class="ms-table">
        <thead>
          <tr>
            <th style="width:6%">S.No.</th>
            <th style="width:34%">Interview category</th>
            <th style="width:10%">Sessions</th>
            <th style="width:10%">Max marks</th>
            <th style="width:12%">Marks obtained</th>
            <th style="width:10%">Grade</th>
            <th style="width:18%">Status</th>
          </tr>
        </thead>
        <tbody>
          ${buildMarksheetCategoryRows(snapshot)}
          <tr class="ms-total-row">
            <td colspan="4" class="r">Overall iX Score (mean of category marks with data)</td>
            <td class="c" style="font-size:11pt;color:${overall != null ? pdfScoreColor(overall) : "#94a3b8"}">${overall ?? "—"}</td>
            <td class="c ${overallGrade.className}">${overallGrade.letter}</td>
            <td class="c">${overall != null ? overallGrade.remark : "Pending"}</td>
          </tr>
        </tbody>
      </table>

      <div class="ms-summary-box">
        <div class="ms-summary-left">
          <p style="margin:0 0 6px;font-size:9pt;font-weight:700;" class="ms-accent">Result summary</p>
          <p style="margin:0 0 4px;font-size:8.5pt;color:#334155;"><strong>Overall iX Score:</strong> ${overall != null ? `${overall} out of 100` : "Not yet available"}</p>
          <p style="margin:0 0 4px;font-size:8.5pt;color:#334155;"><strong>Grade:</strong> <span class="${overallGrade.className}">${overallGrade.letter}</span> — ${overallGrade.remark}</p>
          <p style="margin:0;font-size:8pt;color:#64748b;">Formula: ROUND( sum of category averages ÷ categories with data ). Equal weight per category.</p>
        </div>
        <div class="ms-summary-right">
          <div class="ms-summary-score" style="color:${overall != null ? pdfScoreColor(overall) : "#94a3b8"}">${overall ?? "—"}</div>
          <div class="ms-summary-cap">Out of 100</div>
        </div>
      </div>

      <div class="ms-part">Part B — Communication skills (supplementary)</div>
      ${commRows}

      ${buildCalculationMethodologyHtml(snapshot)}

      <p class="ms-disclaimer">
        This document is issued by InterviewTrix and reflects aggregated interview practice scores only.
        It is not an official academic transcript. Verify authenticity using Ref. No. ${escapeHtml(reportRef)}.
      </p>

    </div>
  </div>
</div>`;
}

export async function generateIxReportPdfViaServer(params: {
  snapshot: IxScoreSnapshot;
  candidateName: string;
  candidateEmail?: string;
  templateCSS?: string;
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}): Promise<{ downloadUrl: string; s3Key: string }> {
  const {
    snapshot,
    candidateName,
    candidateEmail = "",
    templateCSS = IX_REPORT_MARKSHEET_CSS,
    padding = INTERVIEW_REPORT_PDF_PADDING_MM,
  } = params;

  const logoDataUri = await getInterviewTrixLogoDataUri();
  const htmlContent = buildIxReportPdfHtml(
    snapshot,
    candidateName,
    logoDataUri,
    candidateEmail,
  );

  return ixScoreApi.generateReportPDF({
    htmlContent,
    candidateName,
    padding,
    templateCSS,
  });
}
