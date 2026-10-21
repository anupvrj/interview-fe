# ATS + editor test plan

Resume under test: `res_BtVr9AjwwmnGJqQS` (test resume), Chrome profile signed in to both
InterviewTrix and the reference product. Backup taken before each run; restored after.

## A. Feature gaps found vs the reference product (to build)

| # | Reference behaviour | Ours before | Plan |
|---|---|---|---|
| G1 | Job keyword table: keyword · count in resume · count in job ad · include/exclude | Chips (missing / on resume), no counts | Keyword table with live counts from resume text and job text, include/exclude, add-to-skills |
| G2 | Job checklist: title, quantify, spelling, repetition, summary, education, experience years, contact, with "view" links into the fix list | Only strengths / gaps text | "Job checklist" from the report's job-fit + content checks, each with status and a "Show" link that opens the ATS panel on that finding |
| G3 | "Tailor summary" (AI) from the job panel | Only via AI Coach after clicking into the summary | "Tailor summary to this job" → 3 options → put one in |
| G4 | Settings: turn suggestion types on/off | None | Panel settings: spelling, clarity, impact tips, blanks; remembered per browser |
| G5 | Typos marked on the page with the panel closed | Done (previous round) | — |
| G6 | Recruiter checks as score rows, expected-skill chips, done/ignore | Done (previous round) | — |

## B. Test cases

Legend: ✅ pass · ❌ fail (bug filed below) · ⏭ not applicable

### B1. Templates (repeat B2–B6 on: Atlantic Blue, Clean Slate, Classic, Ember Timeline, Saffron Line)
| ID | Steps | Expected |
|---|---|---|
| T1 | Apply template from Designs | Page re-renders in the new design, content intact, saved |
| T2 | Edit a job title, company, bullet, skill on the page | Saved; text shows in new design |
| T3 (neg) | Clear a company then select the entry | Empty "Company" slot appears; nothing printed when unselected |

### B2. ATS run
| ID | Steps | Expected |
|---|---|---|
| A1 | Run check again | Busy state; finishes; no "didn't finish" banner; ring = panel = DB score |
| A2 | Recompute score from the stored report (weights × category scores) | Equals the shown score exactly |
| A3 (neg) | Run with the backend stopped | Error message, previous report kept, no crash |

### B3. Highlights
| ID | Steps | Expected |
|---|---|---|
| H1 | Open ATS panel | Every quoted finding has a red box on the page |
| H2 | Click a quoted finding | Scrolls to the line, thicker red border |
| H3 | Click a section-level finding (skills, contact) | Scrolls to the section, outlines it |
| H4 (neg) | Edit the quoted text, then look at the panel | Card disappears (text no longer there), box gone |
| H5 | Close panel with a typo present | Typo stays marked |

### B4. Fixes
| ID | Steps | Expected |
|---|---|---|
| F1 | Word chip on a typo | Only that word changes (whole word), bullets intact |
| F2 | Ask AI Coach → put an option in | Only that bullet replaced; list formatting kept; card gone |
| F3 | Undo after F2 | Bullet back, card back |
| F4 | Dismiss | Only that check changes; score never drops; ring/panel/DB agree |
| F5 | Mark done | Card hidden until next check; score unchanged |
| F6 (neg) | Dismiss "Analysis incomplete" | Not offered |
| F7 (neg) | Apply a fix whose text changed | Clear "couldn't find" message, nothing changed |

### B5. Score recalculation
| ID | Steps | Expected |
|---|---|---|
| S1 | Fix a real issue (e.g. fill {XX%}, lengthen a short bullet), run check | Related check improves; overall moves by weight × delta (recomputed by formula) |
| S2 (neg) | Make it worse (delete skills), run check | Score drops; formula still matches |
| S3 | Same resume, two runs | Rule checks identical; AI checks within a few points |

### B6. Job tailoring
| ID | Steps | Expected |
|---|---|---|
| J1 | Keyword table counts | Counts match occurrences in resume / job text |
| J2 | Add a missing keyword from the table | Goes to Skills; row flips to found |
| J3 | Exclude a keyword | Struck out, not counted in "x of y covered" |
| J4 | Job checklist "Show" | Opens ATS panel on that finding |
| J5 | Tailor summary → put in | Summary replaced; undo restores |

## C. Results log

(filled in during the run — see bottom of file)

### Run 1 — Clean Slate (2026-10-21)

| ID | Result | Notes |
|---|---|---|
| T1 | ✅ | Applied from Designs; DB `templateId=clean-slate`, content intact |
| T2 | ✅ | Title edit saved; "Kubernetes, PostgreSQL" pasted → two skills |
| T3 | ✅ | Cleared company: nothing printed; "Company" slot on select; typed back, saved |
| A1 | ✅ | Busy state, finished, ring = panel = DB = 86 |
| A2 | ✅ | Recomputed 86/85/87/88 on four runs — always equal, no category mismatch |
| H1 | ✅ | Red boxes on every quoted finding (after B1/B3) |
| H2 | ✅ | Click → scrolls, thicker border |
| H3 | ✅ | Must-have finding outlines Skills |
| H4 | ✅ | Edited quoted bullet → card and box gone; no scroll jump on save |
| H5 | ✅ (after B9) | Typo "experiance" marked with panel closed |
| F1 | ✅ (after B9) | Chip "experience" replaced only that word; HTML intact |
| F2 | ✅ (after B5) | AI options ≥ 10 words for "too short"; only that `<li>` replaced |
| F3 | ✅ | Undo restored bullet, card and box |
| F4 | ✅ | Dismiss changed only `bulletsConsistency` (5→4 issues, score held) |
| F5 | ✅ | Mark done: 18 → 17 things, score unchanged |
| F6 | ⏭ | No incomplete check this run (verified previous round) |
| F7 | ⏭ | Covered previous round (stale insert → "couldn't find") |
| S1 | ✅ | Filled {XX%}: credibility 28→46, bullets 74→79, must-have 43→57 (Grafana); overall by formula |
| S2 | ✅ | Removed 3 skills: must-have 57→29, **Job match 73→59**; ATS score is separate by design |
| S3 | ✅ | Rule checks identical; AI checks moved ≤ 10 (careerProgression change was the B7 fix) |
| J1 | ✅ | Yours/Job counts equal an independent count; "x of y" correct |
| J2 | ✅ | + Kafka → Skills, row found, 4→5 of 12 |
| J3 | ✅ | Exclude Java → struck, 5 of 11 |
| J4 | ✅ (after B10) | "Show" opens ATS panel scrolled to the card, Skills outlined |
| J5 | ✅ (after B11) | Tailored summary put in, undo restores exactly |

#### Bugs found and fixed in this run

| # | Bug | Fix |
|---|---|---|
| B1 | Sample text from new entries ("Sample Project", "Sample Language") not listed as "Fill in"; shown as "too short"/"unclear impact" instead | `placeholderIssues` lists sample lines; other cards quoting them are dropped |
| B2 | `checkPlaceholders` doc comment sat above `createShareLink` | Moved back |
| B3 | Job-fit findings quote the **job ad**; panel treated them as stale resume text, hid the card and said "you've since changed" | `FixItem.quote` is empty for job-fit checks; card shows "From the job ad" |
| B4 | Must-have card listed missing skills with no way to add them | "+ skill" chips (each "A or B" form), live-filtered |
| B5 | AI rewrite for "Bullet too short" returned bullets that were still too short | Rewrite gets the finding as `goal` and a `minWords` floor |
| B6 | — | Misplaced boxes were stale screenshot frames, not a bug (DOM positions correct) |
| B7 | AI quoted our prompt layout ("### Lead Engineer at"), giving a false "incomplete title" and an unfindable quote | Serializer omits " at " with no company; normaliser `cleanExcerpt` strips layout |
| B8 | Skill ✕ couldn't be clicked: hover revealed move arrows that shifted ✕ away | Arrows keep their space (fade in), ✕ never moves |
| B9 | Typos quoted as a phrase ("over 7 years of experiance") weren't marked with panel closed and had no word chip | `typoWord` narrows to the changed word; apply uses `item.quote` |
| B10 | Job checklist "Show" opened the ATS panel but not at the card | Active card scrolls into view |
| B11 | "Tailor summary" claimed job skills the resume lacks (REST APIs) | Missing keywords sent as `avoidTerms`; prompt forbids, server drops |
| B12 | Keyword table/underlines left out partial requirements (Kafka, Docker) | `partialJobKeywords` from the must-have check |

### Runs 2–5 — Classic, Ember Timeline, Saffron Line, Atlantic Blue (2026-10-21)

| ID | Classic | Ember Timeline | Saffron Line | Atlantic Blue |
|---|---|---|---|---|
| T1 apply, content intact | ✅ | ✅ | ✅ | ✅ |
| T3 clear company → nothing printed → slot → retype | ✅ | ✅ | ✅ | (Clean Slate/Classic path same code) |
| H1 every box on resume text, none misplaced | ✅ | ✅ (after B14) | ✅ | ✅ |
| H2 click → scroll + thick border | ✅ | — | — | — |
| F2 AI rewrite → only that bullet | ✅ | — | — | — |
| A1/A2 run → ring = panel = DB = formula | ✅ 87 | ✅ 86 | ✅ 88 | ✅ 87 |

Notes
- Saffron Line puts Education/Skills in its sidebar, so the stored section order has Education before Experience and the rule check `sectionOrder` warns (82). Atlantic Blue's order passes again. Real, template-driven.
- AI checks vary run to run by up to ~20 points on a single check (e.g. hardSkillsMatch 50–70); the overall moved ±1–2 across seven runs (85–88).
- Two backend suites fail independently of this work: `hackathon/importBoundary` and `couponCheckoutService`.

#### More bugs found and fixed

| # | Bug | Fix |
|---|---|---|
| B13 | Thumbnail rejected as "blank" on Classic (centred header ⇒ empty top-left 200 px sample) | Sample a grid over the whole page |
| B14 | AI quoted "Skills: Python, Go…" (layout label); card hidden as stale, no box. On Ember (skills as blocks) a quoted list never matched | Strip layout labels (server + panel); punctuation-insensitive stale check; a quoted list boxes each item, in the section most items share |
| B15 | — | Saffron "no Company slot" was a mis-click (layout moved); slot works |
| B16 | AI check scored 70 with no findings: row said "about text you've since changed" and the user lost points with nothing to fix | Row says "No specific line was flagged"; normaliser floors a check with no negative findings at the pass line (80) and stops counting praise against the score |

### Follow-up — placeholders in the score, automatic re-score (2026-10-21)

- **Why the resume scored 86 with sample text:** "Fill in" was computed in the browser only; the
  backend score had no placeholder check. Now `placeholderValues` (content category) is a scored rule
  check — `{XX%}` blanks, the editor's "Sample …" lines, placeholder headings/contact details — at
  34 points per placeholder, and the overall score is capped at 79 (below "Strong") while any remain.
  Test resume: 86–87 → **79 "Getting there"** (uncapped 81).
- **Fixed items now drop automatically:** after each save the editor calls `POST /resumes/:id/ats-rescore`
  (no AI): content rule checks re-run, AI findings whose quoted text was on the resume at check time
  and is gone now are removed (a check never scores lower for it), and the score is recomputed by the
  formula. Verified in Chrome: filling two blanks → placeholders 8 → 7 → 6, things to improve
  23 → 22 → 20, no "Run check again". Same resume ⇒ same score (unit-tested).
- Bugs hit while building it: placeholder walk recursed forever on a Mongoose document (500 on full
  check; regression test added); one placeholder counted twice ("languages"); "Fill in" showed 4 while
  the score counted 6 (now merged with the server's list); re-score skipped when a thumbnail upload
  landed at the same moment (condition now revision + report identity, plus one retry).
- Not reproduced: the editor tab froze once while that full check returned a 500; a fresh tab with the
  fixed server stayed responsive through several checks.
