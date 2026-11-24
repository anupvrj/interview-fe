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
Clerk's testing tokens (`@clerk/testing`) let a test sign in without solving bot checks. It needs:
- a **test user** in the Clerk development instance (created by the owner; Claude doesn't create accounts),
- `CLERK_SECRET_KEY` for the dev instance in the test environment (never committed),
- `E2E_CLERK_USER_EMAIL` / password in a local, git-ignored `.env.e2e`.

## Suites (first pass)
| Suite | Key cases |
|---|---|
| auth | signed-out access to `/dashboard/*` redirects with `redirect_url`; sign-in returns to the deep link; already signed in on `/sign-up` goes straight on |
| builder | create from template; import PDF (mocked extract); edit a bullet, refresh, change persists; undo; switch template; duplicate; download PDF (route intercepted, checks a PDF response); limit modal at plan limit |
| ats (guest) | upload → scan → result; locked findings show unlock CTA; refresh keeps the result; "Upload new" clears it; reload mid-scan resumes; invalid file / >2 MB rejected with a message |
| ats (signed in) | upload → report → "Fix my resume" opens editor `?view=ats`; ignore + restore a finding; re-run unchanged keeps the score |
| cross | create resume → check it → open the finding in the editor → apply fix → rescore moves; claim a guest check after sign-up |
| ui | no console errors or failed requests on key pages; mobile layouts have no horizontal scroll; keyboard reaches main CTAs |

## Reporting
HTML report, trace on first retry, screenshot and video on failure, `--grep @smoke` subset for quick runs. Results and known failures are recorded in `PRODUCTION_READINESS_REPORT.md`.
