# Resume Builder + ATS Checker: Competitive Analysis

Prepared for InterviewTrix (interviewtrix.com). Research date: 2026-11-24. Public sources only (product pages, pricing pages, help docs, third-party reviews).

**How to read this**
- "not confirmed" = no public source we could read confirmed it. It does not mean the feature is missing.
- Prices are as shown on the page on the research date. Several vendors show different prices by region, A/B test, or promo. Check before quoting.
- Some pages could not be fetched (Teal returned 403; Jobscan's pricing app page rendered empty; Zety's pricing page timed out). For those we fall back to search snippets of the official page, or to third-party reviews, and label them.
- Competitor-written reviews (e.g. Teal reviewing Jobscan, Rezi reviewing Teal, Enhancv reviewing Zety) are biased. They are marked "(competitor review)".

---

## 1. Industry patterns (summary)

1. **Two scores, not one.** Mature tools split a generic "resume quality" score from a job-specific "match" score. Resume Worded has Score My Resume plus a separate Relevancy Score in Targeted Resume ([score guide](https://resumeworded.com/score-guide)). Jobscan's Match Rate is always against a pasted JD ([resume-checker](https://www.jobscan.co/resume-checker)). Rezi bakes JD keywords into an "Optimization" category ([Rezi docs](https://www.rezi.ai/rezi-docs/the-rezi-score-explained)).
2. **Score methods are described, never fully published.** Categories and check counts are disclosed (Enhancv 27 checks / 7 categories; Rezi 23 details / 5 categories; Kickresume 20+ checks / 3 categories), but no vendor publishes weights. Resume Worded says only that checks are "weighted by importance" ([help](https://help.resumeworded.com/article/33-how-is-my-score-calculated)).
3. **Honest framing is becoming common.** Enhancv's FAQ says no tool gives an actual ATS score ([Enhancv checker](https://enhancv.com/resources/resume-checker/)). Teal calls its Match Score a guide, not an official ATS score ([Teal help](https://intercom.help/tealhq-9a9274919b13/en/articles/9524864-using-job-matching)). Rezi says there is no universal scoring standard ([Rezi blog](https://www.rezi.ai/posts/ats-score)).
4. **Target thresholds are published and they cluster at 75 to 90.** Jobscan recommends 75% (and says 65% often works) ([jobscan.co](https://www.jobscan.co)). Teal says 80%+. Kickresume says 75%+. Resume Worded's "solid" band starts at 80. Rezi recommends aiming for 90. Novoresume calls 80 to 100 "Good Foundation" ([Novoresume checker](https://novoresume.com/ats-resume-checker)).
5. **Keyword gaps are the core paid hook.** Free tiers show a few missing keywords. The full list plus AI rewrites to insert them is paid. Teal free shows 5 keywords per job ([search summary of Teal help](https://intercom.help/tealhq-9a9274919b13/en/articles/9524864-using-job-matching)). Rezi free has "Limited" AI Keyword Targeting ([Rezi pricing](https://www.rezi.ai/pricing)). Jobscan's AI Optimize is Premium ([jobscan resume-builder](https://jobscan.co/resume-builder)).
6. **Two monetisation families.**
   - (a) **"Build free, pay to download"** (Zety, Resume.io, Resume Genius, LiveCareer-style). The free download is TXT only, PDF/DOCX needs a low-price 14-day trial that auto-renews every 4 weeks.
   - (b) **Freemium SaaS** (Jobscan, Teal, Rezi, Resume Worded, Careerflow, Novoresume). Downloads are free or capped, and AI, scans, or full reports are paid.
7. **One-column, standard-heading templates are the default ATS claim.** Jobscan says "Every template uses one column and standard headings" ([jobscan resume-builder](https://jobscan.co/resume-builder)). Kickresume's checker penalises photos, graphics and two-column layouts ([Kickresume ATS checker](https://www.kickresume.com/en/ats-resume-checker/)). Vendor claims of "tested against major ATS" (Enhancv) or "100% compliant" (Resume.io) are not backed by any published test method.
8. **Import is table stakes.** PDF/DOCX upload and LinkedIn import are offered by nearly all of them. Some gate it: Kickresume puts LinkedIn and PDF import on Premium ([Kickresume pricing](https://www.kickresume.com/en/pricing/)).
9. **AI is metered by credits or uses.** Examples: Novoresume 2 per month free vs 40 on Pro ([pricing](https://novoresume.com/pricing)); Teal 2 free summaries and 1 free cover letter ([competitor review](https://www.rezi.ai/posts/teal-review)); Kickresume "limited number of AI uses" free ([AI writer](https://www.kickresume.com/en/ai-resume-writer/)).
10. **Suggest-then-accept beats auto-rewrite.** Enhancv's tailoring highlights every change "but not applied automatically" ([enhancv.com](https://enhancv.com/)). Jobscan lets users accept or reject each suggestion with one click ([AI Optimize](https://www.jobscan.co/one-click-optimize)).

---

## 2. Comparison matrix

Legend: F = free tier, P = paid tier, NC = not confirmed. Short cells only; details and sources are in section 3.

### 2a. Creation, AI, import, export

| Platform | Creation flow | AI generation | AI enhance existing | Import/parse | Export formats | Templates (ATS claim) |
|---|---|---|---|---|---|---|
| Jobscan | 5-step builder; start fresh / convert / LinkedIn | Resume Coach Q&A to bullets (P); summary (F) | AI Optimize, bullet gen (P) | Upload + LinkedIn (F) | PDF + DOCX (F) | 9, one-column, standard headings |
| Rezi | Build / upload, then target JD | AI Resume Writer (F, limited) | AI editor, bullet gen | Upload (F) | PDF (3 free); DOCX + GDrive (P) | 5 formats; "ATS-compliant" |
| Teal | Builder + job tracker + Chrome ext | Bullets / summary / skills (2 free summaries) | Unlimited AI (P) | NC | PDF (third-party; DOCX NC) | 11 free templates (competitor review) |
| Enhancv | Upload or job title, then template | NC tier | Bullet rewrite, "Improve Text" | Upload + LinkedIn URL | PDF, TXT (no DOCX) | All templates on F; "tested against ATS" |
| Kickresume | Name + job title, then AI full draft | Full draft (F limited, P unlimited) | Per-section AI writer | LinkedIn + PDF import (P) | NC on pricing page | 4 F / 40 P |
| Resume.io | Builder; paste job link to "Tailor" | Phrase library, voice | Tailor to JD | DOC/DOCX/PDF up to 10MB | TXT (F); PDF (P); Word mentioned | ~38; "100% compliant" |
| Resume Worded | Scorer-first (not a builder) | AI writer (P, table) | Line-by-line suggestions (P) | Upload | n/a (feedback tool) | ATS templates listed in Pro table |
| Indeed | Step-by-step builder on profile | Career Scout keyword hints (app) | NC | Upload doc/docx/pdf/txt/rtf; LinkedIn PDF | PDF (F) | 8 (TechRadar); fixed profile layout |
| Novoresume | Builder | AI 2 uses/mo (F), 40 (P) | Same credits | NC | PDF with text layer (F) | 8 F / all P; "ATS-tested" |
| Zety | Builder, phrase suggestions by title | Pre-written phrases (generic per reviews) | NC | Upload existing (official) | TXT (F); PDF/DOCX (P) | NC count |
| Skillroads | Job title + 5-min questionnaire, then "AI Robo" | Yes | NC | Upload (checker) | NC | NC |
| Standard Resume | LinkedIn import, template, share | NC | AI resume review (P) | LinkedIn (F); PDF NC | Web + PDF (tier conflicting) | 12; no ATS claim |
| Resume Genius | Builder | GPT-4 summary (all tiers) | Skills gen, AI parser (tier NC) | Upload (mostly reliable per review) | TXT (F); PDF + Word (P) | NC |
| Careerflow | Scratch / LinkedIn / upload | Write with AI (P) | One-Click Optimizer (P) | LinkedIn + upload (F, 1 resume) | NC | NC |

### 2b. Scoring, JD match, journey, pricing

| Platform | ATS score method / transparency | JD match | Missing/matched keywords | Sign-up wall | Free tier | Paid price (as seen) |
|---|---|---|---|---|---|---|
| Jobscan | Match Rate 0 to 100; priority order published (hard skills first), weights not | Core feature | Hard/soft skills lists | Scan links to signup; initial Match Rate free | 5 scans/mo, builder, PDF/DOCX | ~$49.95/mo; ~$89.95/qtr (third-party) |
| Rezi | 23 details, 5 categories; weights NC; target 90 | "Paste a JD... pulls every keyword you're missing" | Yes (full list P) | NC; no card | 1 resume, 3 PDFs, limited score | $29/mo; $149 lifetime |
| Teal | Keyword-count based; 0 to 100%, target 80% | Job Matcher | Matched/missing; 5 visible on F | NC (403) | Unlimited resumes (reviews), limited AI | $13/wk, $29/mo, $79/qtr (reviews) |
| Enhancv | 27 checks / 7 categories; parsed content + issues | 4 "job tailoring" checks | NC | NC | 7 days, 12 items, branding | NC (page showed "€NaN") |
| Kickresume | 20+ weighted checks vs DB of CVs; 3 categories | Not in checker (separate tools) | Keyword check (no JD input confirmed) | Login for AI writer | 4 templates, unlimited downloads | $9/mo, $18/3mo, $48/yr |
| Resume.io | "ATS Scorer" linked; method NC | "Tailor my resume" from job link | NC | Build first, pay at download (Trustpilot) | 1 resume, TXT only | ₹249/wk, ₹1,999/yr (INR seen) |
| Resume Worded | Weighted checks (impact, brevity, style); bands published | Targeted Resume Relevancy Score | Yes (full report P) | Free account | Partial reports | $49/mo, $99/qtr, $229/yr |
| Indeed | None | No | No | Indeed account | Fully free builder | Paid human review (TechRadar) |
| Novoresume | 0 to 100; 5 categories; 3 bands | JD pasted into checker | Keyword issues | No sign-up to see score | 1 page, 2 docs, 8 templates | NC (regional) |
| Zety | Proprietary checker score (P) | Not JD-based (competitor review) | NC | Pay at download | TXT only | $1.95 14-day trial, then $25.95 every 4 wks |
| Skillroads | Checker score; method NC | NC | Keyword scan | Password account | Free maker + review | NC |
| Standard Resume | None | No | No | NC | LinkedIn import, web resume | $19/mo |
| Resume Genius | Scanner exists; method NC | NC | NC | Build first | TXT only | $2.95 trial, then $23.95 every 4 wks; $95.40/yr |
| Careerflow | "Basic ATS and keyword scores" on F | Skill Matching | Basic (F), deeper (P) | NC | 1 resume, 10 tracked jobs | Promo, varies ($14.41 to $23.99/mo seen) |

---

## 3. Per-platform details

### 3.1 Jobscan (jobscan.co)
- **Creation flow.** Five steps: start fresh, convert an existing resume, or import LinkedIn; pick a template with live preview; write sections with guided tips; reorder sections "until each ATS badge is green"; download ([resume-builder](https://jobscan.co/resume-builder)).
- **AI.**
  - Resume Coach asks one question at a time and turns answers into quantified bullets (Premium).
  - The summary generator is free.
  - AI Optimize (One-Click Optimize) tailors the resume to a JD, with accept/reject per suggestion ([one-click-optimize](https://www.jobscan.co/one-click-optimize)).
  - Clicking a missing keyword generates three bullet options ([AI rewriter](https://www.jobscan.co/ai-resume-rewriter)).
  - Power Edit is the real-time editor that suggests skills to add (Premium) ([power-edit](https://www.jobscan.co/power-edit)).
- **ATS scoring.**
  - Match Rate is 0 to 100 against a selected JD.
  - The homepage gives the priority order: hard skills, education (only if the JD asks for an advanced degree), job title, soft skills, other keywords. Word count and measurable results are not counted; predicted skills don't affect the score ([jobscan.co](https://www.jobscan.co)).
  - The checker page lists five scored categories: ATS Readability, Keywords & Skills, Content Strength, Job Match, Formatting ([resume-checker](https://www.jobscan.co/resume-checker)).
  - Exact weights are not published. Recommended target: 75%.
  - ATS-specific tips appear if a company or job URL is given.
- **Keywords.** Hard and soft skill lists from the JD, plus searchability of contact info, education and dates ([match report video page](https://www.jobscan.co/video-resume-match-report)).
- **Templates.** Nine, all one-column with standard headings. Each section shows a live ATS badge. No named ATS testing.
- **Export.** PDF ("text-selectable") and DOCX, both free. "Your free resume and downloads stay free whether or not you upgrade" ([resume-builder](https://jobscan.co/resume-builder)).
- **Free vs paid.**
  - Free: builder, unlimited resumes, summary generator, job tracker, Chrome extension, 5 scans/month.
  - Premium: unlimited scans, AI Optimize, bullet generator, cover letter, LinkedIn Optimizer ([resume-builder](https://jobscan.co/resume-builder)).
  - Price: not confirmed from the official page (the app page rendered empty). Third-party sources: $49.95/mo, $89.95/quarter with a 7-day trial ([pitchmeai](https://pitchmeai.com/blog/jobscan-pricing-plans), [jobright](https://jobright.ai/blog/jobscan-review-2026-walkthrough-features-and-alternatives/)).
- **Friction.** Scan buttons link to signup, though the initial Match Rate is "completely free" ([resume-checker](https://www.jobscan.co/resume-checker)).
- **Criticism (competitor review).** Power Edit suggests irrelevant keywords and can distort formatting; parsing errors ([Teal vs Jobscan](https://tealhq.com/post/teal-vs-jobscan)).
- **Differentiator.** The most explicit published priority order for a match score; ATS-specific tips per detected ATS.

### 3.2 Rezi (rezi.ai)
- **Flow.** "Build, improve, and tailor your resume with AI". Upload or drop a resume to start. Target: "Paste a job description and Rezi pulls every keyword you're missing" ([rezi.ai](https://www.rezi.ai/)).
- **AI.** AI Resume Writer and AI Resume Editor are on the Free card. There is a bullet writer and a "Generate bullet" option in the editor ([pricing](https://www.rezi.ai/pricing)).
- **ATS score.**
  - Rezi Score is 1 to 100, built from "23 important details".
  - Five categories: Content, Format, Optimization (JD keywords), Best Practices, Application Ready.
  - Example checks: font size 8.5 to 11pt, date format, visible email. Recommended target: 90.
  - Weights not published ([Rezi docs](https://www.rezi.ai/rezi-docs/the-rezi-score-explained), [help](https://intercom.help/rezihelp/en/articles/8383527-using-the-rezi-score)).
- **Templates.** Standard, Compact, Alternative, Bold, Modern. Free gets Standard only. Claimed "ATS-compliant".
- **Export.** Free: 3 PDF downloads. Pro/Lifetime: unlimited PDF plus DOCX and Google Drive. The comparison table is ambiguous for Free DOCX ([pricing](https://www.rezi.ai/pricing)).
- **Pricing.**
  - Free: 1 resume, 1 AI interview, 3 PDFs, limited Rezi Score / keyword targeting.
  - Pro $29/mo. Lifetime $149 one-time (no monthly expert review).
  - 30-day refund. Enterprise $99/mo per 200 users ([pricing](https://www.rezi.ai/pricing)).
- **Differentiator.** Lifetime plan; score includes an "Application Ready" category; expert reviews from $8.

### 3.3 Teal (tealhq.com)
Official pricing and help pages returned 403. Facts below come from search snippets of Teal help and from reviews.
- **Flow.** Resume builder tied to a job tracker and a Chrome extension that captures postings ([competitor review](https://www.rezi.ai/posts/teal-review)).
- **AI.** Bullet, summary, skills and cover letter generators, plus interview practice. Free: 2 AI summaries and 1 AI cover letter ([competitor review](https://www.rezi.ai/posts/teal-review)).
- **Match score.**
  - Based on how many JD keywords appear in the resume. 0 to 100%, target 80%+.
  - Teal describes it as a guide to alignment, not an ATS score ([Teal help](https://intercom.help/tealhq-9a9274919b13/en/articles/9524864-using-job-matching), [JD match tool](https://tealhq.com/tool/resume-job-description-match)).
  - Free shows 5 keywords per job. The full list and custom keywords are Teal+.
  - The Analyzer scores 3 categories: structure, measurable results, keywords.
- **Suggestion quality.** One G2 reviewer liked that the score updates live as they edit; another found the number of edits needed for a high score excessive ([G2](https://www.g2.com/products/teal-resume-builder/reviews)). A competitor review says many keywords are filler and the score can push users to add skills they lack ([Rezi](https://www.rezi.ai/posts/teal-review)).
- **Export.** Free PDF, no editable Word, per a third-party review ([cloudcolleague](https://cloudcolleague.com/blogs/resume-tips/teal-resume-builder-review/)). DOCX on Teal+: not confirmed.
- **Pricing.** Teal+ $13/wk, $29/mo, $79/quarter (reviews; not confirmed on the official page) ([bestjobsearchapps](https://bestjobsearchapps.com/articles/en/is-teal-worth-it-in-2026-real-fees-and-user-experience)).
- **Differentiator.** Job tracker plus resume in one workspace; a weekly plan for short searches.

### 3.4 Enhancv (enhancv.com)
- **Flow.** "Upload your old resume or enter your job title to pick a template". You can also paste a public LinkedIn URL to build a draft ([enhancv.com](https://enhancv.com/)).
- **AI.** Rewrites weak bullets. "Improve Text" suggests stronger wording while typing. JD tailoring shows "every change highlighted but not applied automatically".
- **Checker.**
  - Input: PDF/DOCX up to 2MB. 27 checks in 7 categories: ATS essentials 6, sections 3, content 5, job tailoring 4, recruiter red flags 4, bias & discrimination 2, seniority & impact 3.
  - Score = parsed content + issues found. The FAQ says no tool gives an actual ATS score, and above 80 means mostly good.
  - Pro adds a human-reader layer: age bias, gaps, career progression ([checker](https://enhancv.com/resources/resume-checker/)).
- **Templates.** All templates on Free. Enhancv says it tests every template against major ATS (no method published).
- **Export.** PDF or TXT. No DOCX ([pricing FAQ](https://enhancv.com/pricing/)).
- **Pricing.**
  - Free for 7 days, Enhancv branding, max 12 section items.
  - Pro (quarterly): ATS check, real-time suggestions, no branding, unlimited items. The price rendered as "€NaN", so it is not confirmed ([pricing](https://enhancv.com/pricing/)).
- **Differentiator.** Bias/red-flag checks; explicit "no real ATS score" honesty; time-limited free plan.

### 3.5 Kickresume (kickresume.com)
- **Flow.** My Documents, then "New resume with AI". Enter name and last job title, choose a design, and AI writes a full first draft. Any section can be regenerated ([AI writer](https://www.kickresume.com/en/ai-resume-writer/)).
- **Checker.**
  - Three stages: scan (can an ATS read it), analysis (20+ checks compared against successful CVs in their database), and a weighted score. 75%+ is good.
  - Categories: Design (penalises photos, graphics, two-column layouts), Structure, Content.
  - JD paste into the checker: not confirmed ([ATS checker](https://www.kickresume.com/en/ats-resume-checker/)).
- **Pricing.**
  - Free: 4 templates, 2 fonts, 20,000 pre-written phrases, unlimited downloads.
  - Premium unlocks AI Writer, ATS Checker, LinkedIn & PDF import, and 40 templates.
  - $9 for 1 month; $18 for 3 months; $48 for a year. 14-day money-back. Free for verified students and teachers ([pricing](https://www.kickresume.com/en/pricing/)).
  - The AI writer page says "from $8/month", which is inconsistent with the pricing page.
- **Export formats.** Not listed on the pricing page (not confirmed).
- **Differentiator.** One-shot full-draft AI from just a job title; student/teacher free Premium; cheap one-time plans.

### 3.6 Resume.io
- **Flow / AI.** Upload DOC/DOCX/PDF (max 10MB). Pre-written phrases. Voice input ("Speak into the mic and the AI fixes mistakes"). "Paste any job link" and "Tailor my resume" pre-build a matched version ([resume.io](https://resume.io/)).
- **Templates.** About 38. Claims "100% compliant". The "ATS Scorer" is linked but its method is not described.
- **Pricing and export.**
  - When fetched on 2026-11-24 the page served INR prices: Weekly ₹249, Yearly ₹1,999, both described as one-time.
  - Free: 1 resume plus 1 cover letter, TXT downloads only. Paid: unlimited PDF.
  - The FAQ also describes a 7-day trial that auto-subscribes to a monthly plan whose price is not stated. 7-day money-back ([pricing](https://resume.io/pricing)).
- **Friction evidence.**
  - Trustpilot reviewers say they built a resume believing it was free, then hit a paywall at download.
  - Others report trial auto-renewals and difficulty cancelling ([Trustpilot](https://www.trustpilot.com/review/resume.io?page=6)).
- **Differentiator.** Localised INR pricing; job-link tailoring.

### 3.7 Resume Worded (resumeworded.com)
- **Product shape.** A feedback platform first: Score My Resume, Targeted Resume (JD Relevancy Score), and LinkedIn Review ([score guide](https://resumeworded.com/score-guide)).
- **Scoring.**
  - Weighted checks, "not a simple average". Weights are informed by hiring-manager insights and adapt to seniority.
  - Categories include impact, brevity, style, soft skills and word choice ([help](https://help.resumeworded.com/article/33-how-is-my-score-calculated)).
  - Published bands: under 80 has room to grow, 80 to 84 solid, 85 to 89 strong, 90 to 100 exceptional.
- **Free vs Pro.**
  - Free gives a score and some issues.
  - Pro gives the full reports, Line-by-Line analysis, AI writer, recruiter insights, ATS templates, and "real resume lines from top candidates". Per-tier checkmarks did not render on the page.
  - Pro: $49/mo, $99/quarter, $229/year ([get-pro](https://resumeworded.com/get-pro.php)).
  - Third-party reports say first-time Pro purchases are generally not refunded (not confirmed officially) ([toolsforhumans](https://www.toolsforhumans.ai/ai-tools/resume-worded)).
- **Differentiator.** Line-level feedback and published score bands; a LinkedIn profile score.

### 3.8 Indeed
- **Flow.** Resume tab with "Upload a resume" or "Build a resume" (step-by-step, steps can be skipped). LinkedIn import works by uploading a LinkedIn PDF (English profiles only) ([help](https://www.indeed.com/help/job-seekers/articles/4408783727629-uploading-a-resume-file-to-your-profile)).
- **AI.** Career Scout (mobile app) suggests keywords and skills for target roles ([Indeed guide](https://www.indeed.com/career-advice/resumes-cover-letters/how-to-upload-resume-to-indeed)).
- **Upload formats.** doc/docx/pdf/txt/rtf. One page says PDFs are converted. Uploaded files can't be edited; only resumes built on Indeed can ([FAQ](https://support.indeed.com/hc/en-us/articles/11314976176141-FAQs-Creating-Uploading-and-Managing-a-Resume-File)).
- **Export.** PDF from the Resume options menu. The profile resume has one fixed layout.
- **Pricing.** "Completely free", with 8 templates and few layout options. Human resume reviews cost extra ([TechRadar](https://www.techradar.com/best/best-resume-builder)).
- **ATS score / JD match.** None found (not confirmed).
- **Differentiator.** The resume lives where the jobs are (one-click apply); zero price.

### 3.9 Novorésumé (novoresume.com)
- **Checker.**
  - Accepts PDF/DOCX, including non-Novoresume resumes. "No sign-up required to see your score"; email is asked only to send the full report.
  - The user pastes the JD plus background. Score 0 to 100 across format, job match, content quality, section organisation, technical elements.
  - Bands: 80 to 100 "Good Foundation", 50 to 79 "Weak Alignment", 0 to 49 "Significant Gaps". Free ([checker](https://novoresume.com/ats-resume-checker)).
- **Pricing.**
  - Basic (free, no expiry): 1 page, 2 docs, 8 templates, 2 AI credits/mo, ATS checker, PDF with real text layer.
  - Pro Subscription: 25 pages, 144 docs, 40 AI credits/mo. Pro Pass: one-time payment for 1 month.
  - Prices are regional, shown at checkout only (not confirmed). 14-day refund on first upgrade ([pricing](https://novoresume.com/pricing)).
- **Paywall mitigation.** On Basic, the user can swap a Pro feature for a free one to restore downloads ([pricing](https://novoresume.com/pricing)).
- **Criticism.** Some users felt misled into investing effort in a resume they then couldn't use ([LiveCareer review](https://www.livecareer.com/resources/product-reviews/novoresume-reviews), competitor).
- **Differentiator.** The best no-signup checker journey found; text-layer PDFs stated explicitly.

### 3.10 Zety (zety.com)
- **Flow / AI.** Builder with job-title-based pre-written phrases; an existing resume can be uploaded ([Zety, via search](https://zety.com/blog/is-zety-resume-free)). A competitor review calls the AI "generic copy suggestions... based purely on the job title" ([Teal](https://www.tealhq.com/post/zety-review)).
- **Checker.** Paid. Gives a proprietary score that is not JD-based (competitor reviews) ([Resume Genius FAQ](https://resumegenius.com/faq/is-zety-free)).
- **Export.** Free = plain text (.txt). PDF/DOCX are paid ([Enhancv review](https://enhancv.com/blog/zety-review/), competitor).
- **Pricing.** Official page snippet: 14-day trial $1.95, then $25.95 every 4 weeks; annual $5.95/mo ($71.40). Third parties cite $2.70 / $23.70 to $24.70 (older or regional) ([zety.com/pricing via search](https://zety.com/pricing)).
- **Friction.** Trustpilot reviews mention recurring charges, unclear pricing and refund difficulty ([Trustpilot](https://ca.trustpilot.com/review/zety.com?page=10)).

### 3.11 Skillroads (skillroads.com)
- **Flow.** Enter a job title, then a "5 min" questionnaire. NLP extracts strengths, then "Let Skillroads' AI Robo make a resume for you!" ([skillroads.com](https://skillroads.com/)).
- **Checker.** Upload; AI scans keywords, sections and outline and gives a score and an ATS pass/fail verdict. Method not confirmed.
- **Human services.** "US-based accredited writers", 3 free revisions within 14 days, money-back guarantee.
- **Pricing / export.** Not confirmed (not shown on the homepage). Claims such as a "96.4% success rate" have no stated method.

### 3.12 Standard Resume (standardresume.co)
- **Flow.** Import from LinkedIn, pick from 12 templates, share as a web resume or PDF ([homepage](https://standardresume.co/)).
- **Pricing.**
  - Basic $0: LinkedIn import, editing, web resume, PDF downloads.
  - Pro $19/mo: AI resume review, view tracking, no branding, custom URL ([pricing](https://standardresume.co/pricing)).
  - The homepage puts "PDF resume downloads" under the $19 plan, so whether PDF is free is conflicting.
- **ATS.** No ATS claim or score ("Built in best practices" only).
- **Differentiator.** Tech-focused, minimal, web resume with view analytics.

### 3.13 Resume Genius (added)
- **Pricing.**
  - Free: resume download TXT only.
  - 14-day trial $2.95, then $23.95 every 4 weeks. Annual $95.40.
  - 14-day money-back. Credit card only ([pricing](https://resumegenius.com/pricing)).
- **AI.** GPT-4 summary generator on all tiers. Skills generator, AI parser and spellchecker are listed, but their tier is not stated.
- **Import.** A hands-on review says upload/parsing is mostly reliable but missed sections of a two-column, 2-page resume; no drag-to-reorder ([Enhancv review](https://enhancv.com/blog/resume-genius-review/), competitor).
- **Friction.** Complaints say it "claims its free before starting then charges at the end" (Trustpilot-style, via search).

### 3.14 Careerflow (added)
- **Free.** 1 resume (scratch, LinkedIn or upload), basic ATS and keyword scores, job tracker capped at 10, limited Chrome extension ([help](https://help.careerflow.ai/en/articles/10605570-free-vs-premium-access)).
- **Premium.** Unlimited resumes, One-Click Optimizer, Write with AI, deeper keyword insights, cover letters, LinkedIn generators. Premium Plus adds Mock Interview.
- **Pricing.** Promotional and varies by page: a struck-through $45 list price, with $14.41/mo, $23.99/mo and $19.99/wk seen ([pricing page](https://www.careerflow.ai/pricing-page), [premium](https://careerflow.ai/premium)). Not confirmed.
- **Relevance.** The closest bundle to InterviewTrix (resume plus LinkedIn plus mock interview).

---

## 4. Best practices worth adopting

| # | Practice | Evidence |
|---|---|---|
| 1 | **Show a score with no sign-up**; ask for email only to deliver the full report | Novoresume: "no sign-up required to see your score" ([link](https://novoresume.com/ats-resume-checker)) |
| 2 | **Keep core downloads free, and say so in writing** | Jobscan: PDF + DOCX free; "Your free resume and downloads stay free whether or not you upgrade" ([link](https://jobscan.co/resume-builder)) |
| 3 | **Separate the quality score from the JD match score** | Resume Worded overall score vs Relevancy Score ([link](https://resumeworded.com/score-guide)); Jobscan Match Rate |
| 4 | **Publish categories, check counts, priority order and score bands** | Enhancv 27 checks / 7 categories; Jobscan priority order; Resume Worded and Novoresume bands |
| 5 | **Be honest that it is not a real ATS score** | Enhancv FAQ; Teal help "guide alignment" ([link](https://intercom.help/tealhq-9a9274919b13/en/articles/9524864-using-job-matching)) |
| 6 | **Say what is *not* scored** (e.g. word count, predicted skills) | Jobscan homepage ([link](https://www.jobscan.co)) |
| 7 | **Suggest, highlight, let the user accept**; never silently rewrite | Enhancv "highlighted but not applied automatically"; Jobscan accept/reject per suggestion |
| 8 | **Click a missing keyword to get bullet options** | Jobscan: three bullet options per keyword ([link](https://www.jobscan.co/ai-resume-rewriter)) |
| 9 | **Live ATS badge per section** in the editor | Jobscan "until each ATS badge is green" |
| 10 | **One-column, standard headings, text-layer PDF** as the ATS-safe default, and say so concretely | Jobscan template rule; Novoresume "PDF with real text layer" |
| 11 | **Recover from a blocked download without paying** | Novoresume: swap Pro features for free ones to restore downloads |
| 12 | **Regional pricing / short passes** | Resume.io INR weekly ₹249; Novoresume one-time Pro Pass; Teal weekly plan |
| 13 | **Fast first draft from minimal input** | Kickresume: name + job title gives a full draft; Skillroads 5-min questionnaire |
| 14 | **Human-reader checks beyond keywords** (gaps, bias, seniority, quantified impact) | Enhancv Pro checks ([link](https://enhancv.com/resources/resume-checker/)) |
| 15 | **Student/teacher free access** | Kickresume free Premium for verified students and teachers ([link](https://www.kickresume.com/en/pricing/)) |

## 5. Patterns to avoid

| # | Anti-pattern | Evidence |
|---|---|---|
| 1 | **Paywall at download after a "free" build** | Resume.io Trustpilot complaints ([link](https://www.trustpilot.com/review/resume.io?page=6)); Resume Genius "free before starting then charges at the end"; Novoresume users "misled" (LiveCareer) |
| 2 | **TXT-only free export** (effectively unusable) | Resume.io, Zety, Resume Genius free tiers are TXT only |
| 3 | **Low-price trial that auto-renews every 4 weeks at 8 to 13x** | Zety $1.95 then $25.95 every 4 wks; Resume Genius $2.95 then $23.95; billing and refund complaints on Trustpilot |
| 4 | **Hard-to-cancel flows** | Resume.io reviewer: cancel only by logging in via LinkedIn; charges "despite multiple attempts to cancel" |
| 5 | **Contradictory pricing copy** | Resume.io "one-time" plans vs FAQ auto-subscribe; Kickresume $8 vs $9; Standard Resume PDF tier conflict; Enhancv "€NaN" price render |
| 6 | **Opaque, unexplained score** (no categories, no method) | Zety checker (proprietary, not JD-based per competitor review); Resume.io "ATS Scorer" with no method; Skillroads "passes ATS" verdict |
| 7 | **Unverifiable ATS guarantees** ("100% compliant", "tested against major ATS") | Resume.io, Enhancv: no test method published |
| 8 | **Scores that reward keyword stuffing** or pressure users to claim skills they lack | Teal critiques (G2: excessive edits; Rezi review: filler keywords); Jobscan Power Edit "irrelevant keywords" (Teal review) |
| 9 | **Gating import** (makes first value slow) | Kickresume LinkedIn and PDF import are Premium only |
| 10 | **Unexplained metrics** | Skillroads "96.4% success rate" with no method |
| 11 | **Time-bombed free plans that aren't obvious** | Enhancv free plan valid for 7 days |
| 12 | **Uploads that can't be edited** | Indeed: only resumes built on Indeed are editable |

---

## 6. Implications for InterviewTrix (short)
- The clearest gap is a combination no competitor offers: **free score without signup, free text-layer PDF/DOCX, transparent categories, and a JD match score**. Novoresume and Jobscan each cover part of it.
- Indian pricing: Resume.io already shows ₹249/week and ₹1,999/year. That is the local reference point for a short-term pass.
- Careerflow's bundle (resume, LinkedIn, mock interview) is the closest direct analogue to InterviewTrix's resume plus interview offering.
