# Resume Builder and ATS Checker: architecture audit

Baseline: `main` at fe `af7a9f5` / core `388ee80` (2026-11-24), branch `feature/ai-resume-builder-ats-upgrade` in both repos.
Backend docs that go deeper: `interview-core/docs/resume-builder-ats/ATS_SCORING_METHODOLOGY.md`, `AI_ARCHITECTURE.md`.

## End-to-end map

```
Public (no account)                         Signed in (/dashboard/*, Clerk-protected)
-------------------                         -----------------------------------------
/ai-resume-builder ── every CTA ──► sign-up ──► /dashboard/resumes/new (1290 lines)
                                                  template → import (PDF | LinkedIn | chat | voice "Ava" | profile CV)
                                                  → optional JD → AI enhance choice → resumeApi.create
                                                  ──► /dashboard/resumes/[id]/edit (8921-line component)
                                                        canvas editor (default) | classic forms
                                                        panels: outline, fix (ATS), tailor, templates, design, details, ai
                                                        autosave 1.5 s + baseRevision conflicts + local draft
                                                        download: DOM → server PDF (Puppeteer) | local fallback; PDF/TXT only

/ats-checker (guest) ── extract → score ──► report (locked checks) ── sign-up ──► claim ──► editor ?view=ats
/ats-checker (signed in) ──► /dashboard/ats-checker: create resume (forAtsCheckOnly) → S3 upload → extract → ats-score
```

## Frontend (interview-fe, Next.js + Clerk + React Query)

| Area | Where | Notes |
|---|---|---|
| Builder landing | `src/app/ai-resume-builder/page.tsx` | flag `NEXT_PUBLIC_MARKETING_2026` (default on) else `legacy-page.tsx` |
| Creation | `src/app/dashboard/resumes/new/page.tsx` | sources in `components/resume-builder/*`; JD via `analyzeJobDescription` |
| From a job (extension) | `src/app/dashboard/resumes/from-job/page.tsx` | duplicate → tailor → update → rescore; deletes copy on failure |
| Resume list | `components/dashboard-2026/ResumesHome.tsx` | legacy list behind `NEXT_PUBLIC_DASHBOARD_2026` |
| Editor | `src/app/dashboard/resumes/[id]/edit/page.tsx` | ~70 `useState`; save payload built in 3 places |
| Canvas | `src/components/resume-canvas/*` | `FixMistakesPanel`, `CanvasInteractionLayer`, `TailorPanel`, `DownloadDialog`, `VersionHistoryDialog` |
| Renderer | `components/ResumeRenderer.tsx` (6149 lines) → `PaginatedPreview` | |
| ATS public | `src/app/ats-checker/page.tsx` + `lib/atsCheckFlow.ts`, `atsGuestState.ts`, `atsPendingFile.ts` | guest state survives refresh, sign-up, app switch |
| ATS dashboard | `src/app/dashboard/ats-checker/page.tsx` | report: `ATSReportWorkspace`; editor/job tracker use the older `ATSReportView`/`ATSFeedback` |
| API | `src/lib/api.ts` (6697 lines) | Clerk bearer token; revision map; `x-ats-device` on guest calls |
| Analytics | `lib/analytics/gtag.ts` (GA4), `fbq.ts` (Meta) | only editor-guide + sign_up events; **no resume/ATS funnel events** |
| Tests | vitest (`config/vitest.config.ts`), 573 passing | **no Playwright/E2E**; nothing covers editor autosave/conflicts, dashboard ATS page, claim |

## Backend (interview-core, Fastify + Mongoose + OpenAI)

| Area | Where | Notes |
|---|---|---|
| Resume CRUD | `routers/resumeRoutes.ts` → `ResumeController` → `ResumeService` | per-handler auth + ownership; optimistic `revision` |
| ATS score | `POST /resumes/:id/ats-score` → `ResumeScoringPipeline` → `ats/ATSScoringEngineV3` | rule checks + one LLM call (gpt-4o-mini, seeded); fingerprint cache |
| Rescore (no AI) | `POST /resumes/:id/ats-rescore` → `ats/rescoreReport.ts` | |
| Job match | `JobMatchService` + `ats/checks/jobMatchChecks.ts` | deterministic matching on LLM-extracted JD requirements |
| Writing | `resumeBuilder/ResumeWritePipeline.ts` | `tailor` → JD orchestrator; `quality_improve` → profile generation |
| Extraction | `/extract-resume-data` → `ResumeProfileGenerationService` | client does PDF → text; **no DOCX anywhere** |
| Guest ATS | `ats/AtsGuestPreviewService.ts` | 2 h TTL, hashed token, per-device + per-IP limits |
| PDF | `PuppeteerPDFService` | new browser per request |
| Models | `Resume` (latest report only), `ResumeVersion` (max 50, no ATS fields), `AtsGuestPreview` | **no ATS report history** |
| Tests | jest, 1639 passing / 6 failing (pre-existing: `hackathon/importBoundary`, `connector/blogAdmin`) | no tests for ATS/PDF/upload controllers or authZ |

## Findings that drive the roadmap

**Security (verified by reading the code):**
1. `GET /resumes/:id/thumbnail-url` has no authentication or ownership check and returns a 7-day presigned link (`ResumeController.ts:1509`). Not used by the web app, extension or plugin. Ids are random (`res_` + 16-char nanoid), but they appear in page URLs.
2. `POST /resumes/:id/confirm-pdf-upload` saves any client-supplied `s3Key` as `pdfS3Key` (`ResumeController.ts:1167`); `download-pdf` and `resolveRawPdfText` then read that key. No check that it belongs to the user.
3. Puppeteer renders user HTML with `--no-sandbox --disable-web-security`, allows every request, and the image inliner fetches any `http*` URL server-side (SSRF surface).
4. Global JSON body limit and multipart file size are 500 MB and apply to resume routes; `rawPdfText` is saved uncapped.
5. Authenticated AI endpoints (ats-score, improve-from-ats, tailor-to-jd, ai-rewrite, extract-resume-data, analyze-job-description) have no per-user rate limit.
6. Resume and JD text go into prompts with no delimiters or "treat as data" instruction (prompt-injection risk), only post-hoc fact guards.

**Reliability and maintainability:**
- Per-process state (rate limits, in-flight maps, ATS "generation" guard) breaks with more than one instance; `recalculateATSScore` saves without a revision guard.
- LLM JSON is cast, not schema-validated; no explicit OpenAI timeouts.
- Dead code: `AdvancedATSScoringEngine`, `ATSScoringService`(V2), `CATEGORY_WEIGHTS_ADVANCED`, unused route timeouts.
- JD threshold mismatch: tailored ATS needs > 50 chars, job match ≥ 50.
- Two report UIs, two editor UIs, legacy pages behind env flags.

**Product gaps (see FEATURE_GAP_ANALYSIS.md):** builder has a sign-up wall before value, no DOCX export, no ATS history/before-after, no funnel analytics, `/dashboard/resumes/new` skips the resume-count limit, "Start free" on the builder page goes to a mock interview.
