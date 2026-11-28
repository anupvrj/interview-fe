# Feature gap analysis

Sources: `COMPETITIVE_ANALYSIS.md` (14 platforms, public sources), `ARCHITECTURE_AUDIT.md`, hands-on audit (`USER_JOURNEY_AUDIT.md`).
Priority: **Critical** (security/data or blocks the core journey), **High** (large user or conversion impact), **Medium**, **Low**.
Complexity: S (≤1 day), M (2–4 days), L (1–2 weeks).

## What InterviewTrix already does well (keep)

| Capability | Why it's good | Evidence |
|---|---|---|
| Free ATS score with no sign-up, report with locked findings | Only Novorésumé matches this; most gate the score or the details | Guest ATS flow, `COMPETITIVE_ANALYSIS.md` |
| Findings marked on the resume itself (original PDF or rebuilt), click to see the fix | No competitor shows this publicly | `ATSOriginalPdfCanvas`, `FixMistakesPanel` |
| Separate ATS quality score and job-match score | Matches the industry split (Resume Worded, Jobscan) | `ResumeScoringPipeline` profiles |
| Mostly deterministic scoring with a seeded LLM part, fingerprint cache, "same resume, same score" | Addresses the top complaint about competitors (inconsistent scores) | `ATSScoringEngineV3`, `atsFingerprint.ts` |
| Suggest-then-accept edits, per-issue AI fix, undo | Industry best practice (Enhancv, Jobscan) | canvas editor |
| Many intake paths: PDF, LinkedIn, chat, voice, profile CV | Broader than most; voice is unique | `/dashboard/resumes/new` |
| Fact guards against invented jobs, degrees, metrics | Most competitors don't claim this | `factGuards.ts`, `bulletGuard.ts` |
| Version history, share link, conflict-safe autosave | Solid editing foundation | `VersionHistoryDialog`, `baseRevision` |

## Gap matrix (prioritised)

| # | Gap / problem | Type | Priority | User impact | Complexity | Repo |
|---|---|---|---|---|---|---|
| G1 | `thumbnail-url` returns any resume's thumbnail without auth | Incorrect (security) | Critical | Privacy of candidate data | S | core |
| G2 | `confirm-pdf-upload` accepts any storage key | Incorrect (security) | Critical | Cross-user file access | S | core |
| G3 | Puppeteer SSRF surface (`--disable-web-security`, server fetch of any image URL) | Incorrect (security) | High | Server-side request forgery | M | core |
| G4 | No per-user rate limit on paid AI endpoints; 500 MB body limit on resume routes | Missing | High | Cost abuse, DoS | S–M | core |
| G5 | Resume builder has a sign-up wall before any value | Needs improvement | High | Top-of-funnel conversion; the ATS checker already proves guest-first works | L | fe+core |
| G6 | No funnel analytics for builder or ATS | Missing | High | Can't measure or improve conversion | M | fe |
| G7 | No ATS report history / before-after comparison | Missing | High | Users can't see progress; competitors show improvement | M | core+fe |
| G8 | No DOCX export (PDF/TXT only) | Missing | High | Many Indian portals and recruiters ask for Word; Jobscan gives DOCX free | M–L | fe+core |
| G9 | Missing-keyword report is not a first-class, linked list (keywords live inside job match / tailor panel) | Needs improvement | High | The feature people pay competitors for | M | fe |
| G10 | Prompt injection: resume/JD text not delimited in prompts | Missing | Medium | A crafted resume could steer scores | S | core |
| G11 | LLM output not schema-validated (cast with `as`) | Needs improvement | Medium | Silent bad data, "Analysis incomplete" | M | core |
| G12 | No Playwright E2E suite | Missing | High (engineering) | Regressions in the core journeys go unseen | L | fe |
| G13 | `/dashboard/resumes/new` skips the resume-count limit | Incorrect | Medium | Plan limit bypass | S | fe |
| G14 | "Start free" on the builder page goes to a mock interview | Incorrect | Medium | Wrong destination on the main CTA bar | S | fe |
| G15 | JD threshold mismatch (> 50 vs ≥ 50 chars) | Incorrect | Low | Edge-case inconsistent mode | S | core |
| G16 | Per-process state (limits, in-flight maps, generation guard) | Needs improvement | Medium (when scaling to >1 instance) | Duplicate AI runs, limits multiply | M | core |
| G17 | Two report UIs (`ATSReportWorkspace` vs `ATSReportView`/`ATSFeedback`), legacy pages behind flags | Unnecessary complexity | Medium | Inconsistent UX, double maintenance | M | fe |
| G18 | Dead scoring code (`AdvancedATSScoringEngine`, `ATSScoringService*`) | Unnecessary | Low | Confusion | S | core |
| G19 | Score transparency: show category weights and what each check measures, "not an employer's ATS score" note everywhere | Needs improvement | Medium | Trust (Enhancv/Teal set this norm) | S | fe |
| G20 | AI writing quality: rewrite left flagged lines unchanged until line-quoting was added | Needs improvement | Medium | Users see few real fixes | M | core |
| G21 | Editor page is one 8,921-line component | Maintainability | Medium | Slows every change, regression risk | L (incremental) | fe |

## Deliberately not recommended now
- **Copying "passes ATS" verdicts or a single magic score.** Competitors that do this draw complaints; keep the explained, category-based score.
- **Paywall at download time with auto-renewing trials** (Zety/Resume.io pattern): heavy billing complaints; conflicts with the trust positioning.
- **Rewriting the editor from scratch.** It works and has conflict-safe saving; split it incrementally instead.
- **More LLM calls in scoring.** Keep deterministic checks deterministic; add schema validation rather than extra calls.

## Owner decisions (2026-11-24)
1. **Guest resume builder (G5): yes.** Visitors build and preview a full resume before signing up; sign-up to save or download.
2. **DOCX export (G8): free for everyone.**
3. **ATS report history (G7): last 20 full checks per resume.**
4. **Signed-in testing:** the owner's own account, signed in by the owner in the browser pane, against the local app and the QA database only. Automated E2E sign-in reuses a saved session from that sign-in (no test account is created).
   - **Changed 2026-11-24:** the owner asked for a dummy user instead. Signed-in tests now run as a dummy user in Clerk's development instance, on the QA database only (see `PLAYWRIGHT_TEST_STRATEGY.md`).
