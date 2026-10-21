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
