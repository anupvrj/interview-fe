# Implementation roadmap

Branch in both repos: `feature/ai-resume-builder-ats-upgrade` (from `main`, 2026-11-24). Nothing is merged to `main` or deployed without the owner's explicit approval.
Baseline tests: fe 573 pass; core 1639 pass, 6 fail (pre-existing).

## Order of work and why

1. **Security fixes first (B1–B5).** Small, isolated, and they protect candidate data now.
2. **Playwright baseline.** Before larger product changes, so every later step is checked against the core journeys.
3. **Analytics instrumentation.** Cheap, and needed to measure whether the product changes help.
4. **ATS report quality:** history and before/after, first-class missing-keyword list, score transparency, prompt-injection hardening, schema validation.
5. **Resume builder:** guest-first building (pending decision), DOCX export (pending decision), limit fix, CTA fix.
6. **Cross-product polish:** one report UI, editor deep links per finding, editor split (incremental).
7. **Final regression and production-readiness report.**

## Implementation tracker

| Task | Priority | Status | Repo | Tests | Notes |
|---|---|---|---|---|---|
| T1 Lock `thumbnail-url` behind auth + ownership (B1) | Critical | Completed | core | `resumeFileAccess.test.ts` (core `bb6da04`) | Unused by web, extension, plugin |
| T2 Validate `confirm-pdf-upload` key prefix (B2) | Critical | Completed | core | `resumeFileAccess.test.ts` (core `bb6da04`) | Key must start with `${userId}/resumes/pdfs/` |
| T3 Puppeteer hardening: block non-data/non-allowed requests, drop `--disable-web-security`, restrict image inliner to our CDN/S3 (B3) | High | Completed | core | jest + manual PDF check | Must not break template fonts/images |
| T4 Per-route body limits for resume/extraction routes; cap `rawPdfText` (B4) | High | Completed | core | `aiUsageLimit.test.ts` + live 413 check (core `ac26e5c`) | Keep video routes' large limit |
| T5 Per-user rate limit on AI endpoints (B5) | High | Completed | core | `aiUsageLimit.test.ts` (core `ac26e5c`) | In-memory first; note multi-instance limit |
| T6 Playwright setup: config, auth fixture, mocked-AI mode, HTML report | High | Completed | fe | 12 e2e tests + recorded-API replay (fe `7a4041c`); signed-in auth setup written, awaiting owner sign-in | Auth: owner signs in once, session saved as storageState (local + QA DB only) |
| T7 E2E suites: auth, builder, ATS (guest + signed in), cross-product, responsive | High | Not Started | fe | Playwright | Against local app + QA database only |
| T8 Analytics events for builder and ATS funnels | High | Completed | fe | `productEvents.test.ts` + live console check (fe `8a72d1e`) | No resume text/JD/PII in events |
| T9 ATS report history (last 20, approved) + before/after | High | Completed | core+fe | `atsHistory.test.ts`, `atsProgress.test.ts`, `ATSProgressCard.test.tsx` (core `f4b6b3d`, fe `d34e02b`); live check of the card waits for owner sign-in | Additive collection, no schema break |
| T10 Missing-keyword list as a first-class report section linked to the editor | High | Not Started | fe | vitest + Playwright | |
| T11 Prompt-injection delimiters in ATS/JD/writing prompts | Medium | Completed | core | `untrustedText.test.ts` + live injection test (core `68887de`) | |
| T12 zod validation of LLM outputs (ATS checks, JD analysis) | Medium | Not Started | core | jest | |
| T13 Score transparency in the report (weights, "not an employer's ATS") | Medium | Not Started | fe | vitest | |
| T14 Resume-count limit on `/dashboard/resumes/new` (B6) | Medium | Completed | fe | vitest | |
| T15 Builder page CTA fix (B7) | Medium | Completed | fe | Playwright | |
| T16 JD threshold consistency (B8) | Low | Completed | core | jest | |
| T17 Guest-first resume builder (G5) | High | Not Started | fe+core | Playwright | Approved 2026-11-24: build/preview signed out, sign-up to save/download |
| T18 DOCX export (G8) | High | Completed | fe+core | `resume-docx.test.ts` opens the real file (fe `c9ede79`); sample checked with macOS textutil; in-editor click waits for owner sign-in | Approved: free for everyone |
| T19 One report UI in editor/job tracker (G17) | Medium | Not Started | fe | Playwright | |
| T20 Remove dead scoring code (G18) | Low | Not Started | core | jest | |
| T21 Final regression + production-readiness report | High | Not Started | both | all | |
