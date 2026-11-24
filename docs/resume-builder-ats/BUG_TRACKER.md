# Bug tracker: Resume Builder and ATS Checker

Status: Not Started · In Progress · Blocked · Completed · Verified.
Severity: Critical · High · Medium · Low. "Found by": code (verified by reading), audit (seen running the app), test.

| ID | Bug | Severity | Found by | Root cause | Repo | Status |
|---|---|---|---|---|---|---|
| B1 | `GET /resumes/:id/thumbnail-url` gives a 7-day link to any resume's thumbnail with no auth or ownership check | Critical | code | Handler never calls `authenticateRequest` (`ResumeController.ts:1509`) | core | Completed (core `bb6da04`) |
| B2 | `POST /resumes/:id/confirm-pdf-upload` stores any client-supplied `s3Key` as the resume's PDF | Critical | code | No check that the key is under `${userId}/resumes/pdfs/` (`ResumeController.ts:1167`) | core | Completed (core `bb6da04`) |
| B3 | PDF rendering can be made to fetch arbitrary URLs from the server | High | code | `PuppeteerPDFService`: `--disable-web-security`, all requests allowed, image inliner fetches any `http*` src | core | Not Started |
| B4 | Resume routes accept 500 MB JSON bodies; `rawPdfText` saved uncapped (Mongo 16 MB limit) | High | code | Global `bodyLimit`/multipart limits in `app.ts` | core | Not Started |
| B5 | No per-user rate limit on paid AI endpoints | High | code | Only guest preview uses `assertRateLimit` | core | Not Started |
| B6 | `/dashboard/resumes/new` lets users exceed their plan's resume count | Medium | code | Page never calls `checkResumeLimit` (list page does) | fe | Not Started |
| B7 | "Start free" in the builder page nav goes to `/dashboard/interviews/new` | Medium | audit | Shared nav CTA points to interviews on every marketing page | fe | Not Started |
| B8 | A JD of exactly 50 characters gets job match but a standalone ATS score | Low | code | `> 50` in V3 vs `>= 50` in job match | core | Not Started |
| B9 | Two scorings on different instances can both save (last write wins) | Medium | code | `recalculateATSScore` saves without a revision guard; in-memory generation map | core | Not Started |

Pre-existing test failures (not regressions, also fail on `main`): `src/modules/hackathon/__tests__/importBoundary.test.ts`, `src/services/connector/__tests__/blogAdmin.test.ts` (6 tests).
