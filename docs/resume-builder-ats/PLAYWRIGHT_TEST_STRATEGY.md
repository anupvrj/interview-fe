# Playwright E2E test strategy

## Principles
- **Never against production.** Tests run against the local app with the backend on the QA database (`.claude/launch.json` config `interview-core-qa-db`, which refuses any other database), or a stage environment.
- **Two AI modes.** Default suites mock AI-backed endpoints with recorded fixtures (`page.route`) so they're fast and repeatable. A small, separately tagged suite (`@real-ai`) hits the real backend to catch integration drift; it is run on demand.
- **Real user behaviour, not just happy paths:** refresh mid-flow, back button, sign-up round trips, failed network calls, slow AI, invalid files.
- **Stable selectors:** roles and accessible names first (`getByRole`, `getByLabel`), `data-testid` only where no accessible name exists. No CSS-class selectors, no fixed sleeps (`expect.poll` / auto-waiting).
- **Independent tests:** each creates its own data (resume via API) and cleans up; safe to run in parallel.

## Layout (interview-fe)
```
e2e/
  playwright.config.ts        # projects: chromium, firefox, webkit, mobile (Pixel 7), tablet (iPad)
  fixtures/
    auth.ts                   # Clerk testing token + storageState per worker
    api.ts                    # create/delete test resumes through the backend
    ai-mocks.ts               # recorded responses for ats-preview, ats-score, extract, rewrite
    files/                    # fictional test resumes (PDF), corrupt.pdf, large.pdf, scanned.pdf, not-a-pdf.png
  auth/        auth.spec.ts
  builder/     create.spec.ts, edit.spec.ts, templates.spec.ts, export.spec.ts, data-safety.spec.ts
  ats/         guest.spec.ts, signed-in.spec.ts, files.spec.ts, report.spec.ts, rescore.spec.ts
  cross/       builder-to-ats.spec.ts, ats-to-builder.spec.ts
  ui/          responsive.spec.ts, links.spec.ts, a11y.spec.ts
```

## Authentication
Signed-in suites (`*.signed-in.spec.ts`, project `signed-in`) run as a **dummy user in Clerk's development instance**, never a real person's account:
- Created once through Clerk's Backend API with the development secret key (`sk_test_…` only). Its email ends in `+clerk_test@example.com`, so Clerk accepts the fixed code `424242` instead of emailing one.
- Its login lives only in the git-ignored `.env.e2e` (`E2E_CLERK_USER_EMAIL`, `E2E_CLERK_USER_PASSWORD`, `E2E_CLERK_USER_ID`).
- `e2e/auth.setup.ts` signs in by itself (password or code, whichever the page asks for) and saves the session to `e2e/.auth/user.json` (git-ignored). Without `.env.e2e` it waits for a person to sign in.
- In the QA database the user is marked onboarded, so tests land on the dashboard.
- Tests create fictional resumes through the API (`e2e/fixtures/api.ts`) and delete them afterwards. The fixture avoids sample-looking contact details, which the ATS "Sample Text & Blanks" check rightly caps at 25.

```
npx playwright test                      # everything (setup runs first for signed-in)
npx playwright test --project=signed-in  # signed-in only
npx playwright test --grep-invert @real-ai  # skip tests that make real AI calls
```

## Suites (first pass)
| Suite | Key cases |
|---|---|
| auth | signed-out access to `/dashboard/*` redirects with `redirect_url`; sign-in returns to the deep link; already signed in on `/sign-up` goes straight on |
| builder | create from template; import PDF (mocked extract); edit a bullet, refresh, change persists; undo; switch template; duplicate; download PDF (route intercepted, checks a PDF response); limit modal at plan limit |
| ats (guest) | upload → scan → result; locked findings show unlock CTA; refresh keeps the result; "Upload new" clears it; reload mid-scan resumes; invalid file / >2 MB rejected with a message |
| ats (signed in) | upload → report → "Fix my resume" opens editor `?view=ats`; ignore + restore a finding; re-run unchanged keeps the score |
| cross | create resume → check it → open the finding in the editor → apply fix → rescore moves; claim a guest check after sign-up |
| ui | no console errors or failed requests on key pages; mobile layouts have no horizontal scroll; keyboard reaches main CTAs |

## Running reliably
Run against a production build (`next build && next start -p 3001`) for automated runs. Against `next dev`, a page can recompile mid-test when files change, which shows up as a one-off console error (seen once on the `/ats-checker` "loads without errors" test while code was being edited; 3 clean reruns after).

## Suites as built (2026-11-24)
| File | What it covers |
|---|---|
| `ats/guest.spec.ts` | signed-out ATS check (recorded API): upload, result, refresh, Upload new, bad files |
| `ats/report.signed-in.spec.ts` | same resume same score, history, progress card, job keywords + editor link, score explainer, editor's detailed report (@real-ai) |
| `auth/redirects.spec.ts`, `auth/session.signed-in.spec.ts` | redirects with `redirect_url`; signed-in sign-up → dashboard; dashboard and ATS page load |
| `builder/guest-builder.spec.ts` | public builder: scratch, design switch, refresh keeps the draft, sign-up link carries it, bad input; PDF upload (@real-ai) |
| `builder/guest-claim.signed-in.spec.ts` | a guest draft becomes a resume after sign-in and opens in the editor |
| `builder/editor.signed-in.spec.ts`, `builder/editor-actions.signed-in.spec.ts` | open, edit persists, Word download, design switch, PDF download |
| `cross/claim-guest-check.signed-in.spec.ts` | real guest ATS check claimed after sign-in (@real-ai) |
| `marketing/entry-points.spec.ts` | entry links; Start free opens the public builder; pages load without errors |
| `ui/responsive*.spec.ts` | no sideways scroll on phones: public pages; dashboard, report, editor signed in |

`dismissPopups(page)` (fixtures/api.ts) registers Playwright overlay handlers for the timed trial offer and the first-visit tour, which otherwise block clicks at random.

## Reporting
HTML report, trace on first retry, screenshot and video on failure, `--grep @smoke` subset for quick runs. Results and known failures are recorded in `PRODUCTION_READINESS_REPORT.md`.
