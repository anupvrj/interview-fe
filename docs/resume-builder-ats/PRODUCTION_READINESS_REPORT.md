# Production readiness: Resume Builder + ATS Checker upgrade

Date: 2026-11-24. Branch `feature/ai-resume-builder-ats-upgrade` in interview-fe (23 commits) and interview-core (11 commits). **Nothing is pushed, merged or deployed.** All testing used the local app with the backend on the QA database (`interview-trix-qa`); production was never touched.

## Verdict
Ready for stage. Every planned item (T1–T21) is done and tested. Before production, do the stage checks listed at the end: they cover what local testing can't (real email sign-up, real phones, GA4 DebugView).

## What changed

### Security (core)
| Change | Effect |
|---|---|
| Resume thumbnail link needs the owner's sign-in | It used to give any resume's thumbnail to anyone with the id |
| PDF upload key must be the user's own | It used to accept any storage key |
| PDF renderer allowlist; removed `--disable-web-security` and certificate overrides | The server can no longer be made to fetch other sites or internal addresses |
| Body limits (10 MB, 20 MB for PDF render), `rawPdfText` capped; 4xx errors no longer turned into 500 | Oversized requests get a clear 413 |
| Hourly AI limits per user (`aiUsageLimit.ts`) | Caps abuse and runaway AI cost; 429 `RATE_LIMITED` |
| Resume and job text marked as untrusted data in prompts | A resume demanding "score 100" was tested and still scored 25 |
| zod validation of the AI's output | Bad types, junk elements and overlong text are cleaned before scoring |
| Score saved only if the resume wasn't edited meanwhile (revision check) | No more reports describing text that has changed; works across instances |

### ATS checker
- **Report history**: the last 20 full checks per resume (new `atsreporthistories` collection; summaries only, the job description stored as a hash). `GET /resumes/:id/ats-history`.
- **"Your progress" card**: score trend, points since the first check, checks fixed or newly flagged.
- **Job keywords**: required and nice-to-have skills from a pasted job, missing first, "Add in editor" opens the editor's job panel (`?view=job`). Without a job, it asks for one.
- **"How this score works"**: the category weights actually used (`scoreWeights` on each report), what each category looks at, why a score is held, and that it's our estimate, not an employer's score. Every cap now gives its reason (the placeholder cap had none).
- **One set of report pieces** across the report page, the editor's detailed report and the job tracker. The old "Unlock Job Match" promo is gone.
- JD threshold: exactly 50 characters now counts as a job description everywhere.

### Resume builder
- **Guest-first builder** at `/resume-builder/start`: upload a PDF or start from basics, try up to 8 enabled templates on your own resume, light edits. Sign up only to keep editing or download; the draft stays in the browser for 7 days and becomes a resume after sign-up (onboarding skipped while a draft waits). "Build free" / "Start free" on the resume pages now go here.
- **Free Word (.docx) download** for everyone (owner decision).
- Resume limit shown when "New resume" opens, not at the last step.

### Analytics (GA4)
Funnel events for both products with a `journey_id`. No personal data: no resume text, names, emails, file names or job descriptions; scores only as ranges.

### Removed
`ATSScoringService.ts`, `ATSScoringServiceV2.ts`, `AdvancedATSScoringEngine.ts` (1,932 lines, imported by nothing). `JobMatchPromoBanner.tsx` (replaced by the keywords card).

## Bugs found and fixed
B1–B11 in `BUG_TRACKER.md`. Found along the way, beyond the original audit:
- **B10** 4xx errors returned as 500.
- **B11** Word file saved as `Name.docx.pdf`.
- `StartLink` sent every signed-out visitor to sign-up, so no public tool was reachable from the marketing buttons (fixed with the guest builder).
- A placeholder-capped score showed no reason.

## Test results (final run)
| Suite | Result | Baseline at start |
|---|---|---|
| Frontend unit (vitest) | **596 pass**, 119 files | 573 |
| Backend unit (jest) | **1,686 pass**, 6 fail | 1,639 pass, same 6 fail |
| E2E (Playwright) | **43 pass**: 25 signed out (desktop + phone), 18 signed in | 0 |
| Type-check, both repos | 0 errors | — |
| Frontend production build (`next build`) | succeeds | — |

The 6 backend failures are pre-existing and also fail on `main`: `src/modules/hackathon/__tests__/importBoundary.test.ts`, `src/services/connector/__tests__/blogAdmin.test.ts`.

Signed-in E2E runs as a dummy user in Clerk's development instance (`e2e-tester+clerk_test@example.com`; login only in the git-ignored `.env.e2e`). Tests tagged `@real-ai` make real, small AI calls; skip them with `--grep-invert @real-ai`.

## Deploy notes
- **Order:** core first, then frontend. The frontend copes with an older backend (history fetch failure is ignored; `scoreWeights` is optional), but the guest builder needs the core rate limits and the new body limits.
- **Database:** one new collection, `atsreporthistories`, with index `{ resumeId, createdAt }` (Mongoose creates it). No migration. Older reports have no `scoreWeights`; the explainer then shows the framing without the weights table.
- **Config:** optional `PDF_RENDER_ALLOWED_HOSTS` (comma-separated) if resumes embed images from a host other than our S3 bucket and Google Fonts. Without it, such images are left out of the PDF.
- **Middleware:** `/resume-builder(.*)` is public.
- **Rollback:** revert the merge commits; the history collection can stay (unused) or be dropped.

## Risks and things to watch
| Risk | Mitigation |
|---|---|
| PDF images from other hosts now blocked | Add the host to `PDF_RENDER_ALLOWED_HOSTS`; watch for reports of images missing from downloaded PDFs |
| Hourly AI limits hit by heavy users | Limits are generous (e.g. 40 ATS checks/hour) and in one file to tune |
| Guest builder uses the guest extraction endpoint (per-IP limit, shared with the ATS checker) | A shared office IP could hit it; the page explains and offers "start from scratch" |
| Rate limits and the generation guard are per process | The revision check now protects saves across instances; rate limits multiply with instances (known, G16) |
| Score weights were fitted to one competitor on 13 resumes | Documented in `ATS_SCORING_METHODOLOGY.md`; build an evaluation set before changing weights |

## Not done, needs a decision
1. **Legacy `ATSFeedback`** (pre-V3 report view) is kept: older resumes still store those reports, and removing it would blank them.
2. **Lint**: the project has no ESLint config (`next lint` was removed in Next 16). Worth setting up separately.
3. **The editor page is one ~8,900-line component** (G21). Splitting it is a separate, incremental piece of work.

## Stage checks before production
1. Sign up with a real email from the guest builder and from a guest ATS check: the draft or check carries over, through email verification.
2. Phones: iPhone Safari and Android Chrome on `/resume-builder/start`, the ATS checker and the report.
3. GA4 DebugView: the funnel events arrive with `journey_id` and no personal data.
4. Download a PDF of a resume with a profile photo (checks the renderer allowlist).
5. Run the E2E suite against stage: `E2E_BASE_URL=<stage> E2E_ALLOW_REMOTE=<stage host> npx playwright test`.
