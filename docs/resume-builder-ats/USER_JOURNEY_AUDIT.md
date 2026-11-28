# User journey audit

Environment: local app (fe :3001, core :5004 on the **QA database**), 2026-11-24. Clicks counted from the first page of the journey.

## Resume Builder: signed out
| Step | What happens | Clicks | Finding |
|---|---|---|---|
| Home → "Build my resume, free" | goes to `/sign-up?redirect_url=/dashboard/resumes/new` | 1 | **Sign-up wall before any value** |
| `/ai-resume-builder` → "Build my resume, free" | same sign-up redirect | 1 | Same wall; "01 · Bring what you have" cards are illustrations only |
| `/ai-resume-builder` nav "Start free" | `/sign-up?redirect_url=/dashboard/interviews/new` | 1 | **Wrong product** (mock interview) on the resume page (B7) |
| After sign-up | `/dashboard/resumes/new`: template → import → JD → processing → editor | 4–6 more | Onboarding redirect is skipped only for the ATS flow, not the builder |

Clicks to a visible resume for a new visitor: sign-up (email + code, ~4 interactions) + 4–6 builder steps ≈ **9–11 interactions** before seeing their resume. The ATS checker shows value in **2** (open dialog, pick file).

## ATS Checker: signed out (verified in earlier work this month, re-checked)
Upload → scan (~25–35 s, live facts from the resume) → report with ~40% of findings locked → "Fix my resume, free" → sign-up (email-first, existing accounts sign in) → claim (~7 s) → editor `?view=ats`. Survives refresh, back, app switch, in-app browser "Open in browser". **2 clicks to a score.**

## Signed in (pending)
Needs a test account on the local app (QA database). To cover: dashboard → new resume → each section → AI enhance → template switch → save/refresh → duplicate → download; ATS dashboard upload → report → improve → rescore → before/after; editor deep links from findings; error cases (session expiry, API failure, slow AI, invalid files).

## Abandonment risks ranked
1. Builder sign-up wall (largest: no value shown first).
2. Builder creation has 4–6 steps before the editor; several are optional but presented as steps.
3. ATS scan wait (~25–35 s) — mitigated by live facts.
4. Download paywall appears only at the end (`resumeDownload` entitlement) — the pattern competitors are criticised for; make the plan clear earlier.

## Guest-first resume builder (added 2026-11-24, T17)
`/resume-builder/start`, public. "Build free" / "Start free" on the resume pages now go here for everyone (signed-in visitors are sent on to `/dashboard/resumes/new`).
1. **Start:** upload a PDF (read by the guest extraction endpoint, rate limited per IP) or start from scratch with name, job title and contact details (the template's example content fills the page; the editor marks every example line).
2. **Preview:** the resume in up to 8 enabled templates, live; light edits to name, title and contact. Saved only in this browser (`ix-guest-resume-draft`, 7 days) on every change, so refresh and the trip to sign-up lose nothing.
3. **Sign up** from "Save and keep editing, free" or "Download PDF or Word". Onboarding is skipped when a draft is waiting.
4. **Claim:** `/dashboard/resumes/new?draft=guest` checks the plan's resume limit, creates the resume (template, content, section order, layout), clears the draft and opens the editor. On the limit, the existing limit dialog shows and the draft stays.

Found and fixed on the way: `StartLink` sent every signed-out visitor to sign-up, so a public tool could never be reached from the marketing CTAs. Links to public tools (`/resume-builder`, `/ats-checker`) now go there directly.
