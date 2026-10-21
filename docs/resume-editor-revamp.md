# Resume editor revamp — on-canvas editing

Goal: replace the "form on the left, preview on the right" editor with editing directly on the
resume page (Enhancv-style UX, our own look), on desktop and mobile.

## Research notes (Enhancv editor, studied Oct 2026)

- **Tech**: React; every field is its own `contenteditable` element (~50 per page). No ProseMirror /
  Slate / Quill. Text decoration (B/I/U, lists) only in descriptions and bullets.
- **Layout**: thin app bar (logo, doc title, save status, account) + a centred tool row:
  *Fix Mistakes (grade badge) · Check & Tailor · Rearrange · Templates · Design & Font* and
  undo/redo + History on the right. A4 page centred on a light canvas with a shadow; a vertical
  icon rail beside the page (preview, download, share link, AI).
- **Focus mode**: clicking an entry dims the page grey and keeps the active entry white with a
  green outline. A floating pill toolbar sits above it: `+ Entry` (primary), move up / down,
  text style, dates, delete, settings (per-field visibility toggles for the section).
- **Between sections**: hovering a gap shows a divider with `New Section` and `+ <Section>` pills.
- **New section**: modal grid of visual previews (~20 types), "Add to Resume" on hover.
- **Panels**: Templates / Design & Font / Fix Mistakes open as a ~280px left panel next to the
  canvas (state in the URL: `activeToolboxPanel=…`). Rearrange is a modal of draggable boxes per
  column.
- Placeholders are shown in-place for empty fields ("Title", "Company Name", "Date period").

## Our design (≈90% that flow, our styling)

| Area | Behaviour |
| --- | --- |
| App bar | back · editable title · save status · undo/redo · **Download** (primary) · more menu |
| Tool row | **ATS score** (chip) · **Tailor to job** · **Improve with AI** · Rearrange · Templates · Design · Add section — horizontally scrollable chips on mobile |
| Canvas | page(s) on a dotted canvas, zoom controls, right icon rail (preview, download, add section) |
| Inline edit | click any text → edits in place; Enter commits single-line fields, Escape reverts |
| Focus mode | page dims, active entry highlighted, floating pill: + Entry · ↑ · ↓ · B/I/U/• (rich fields) · Details · Delete |
| Sections | hover divider: + Section / + Entry; section pill: rename, move, hide, delete |
| Details | "Details" opens the existing full form for that section in a side drawer (dates, photo, extra fields) — nothing is lost from the old editor |
| Mobile | page scaled to width; tap to edit; pill toolbar docks at the bottom; panels open as bottom sheets |

### Toolbar and right rail, mapped one by one

| Enhancv | Ours | Opens |
| --- | --- | --- |
| Fix Mistakes + grade badge (F–A) | **Fix Mistakes** + grade badge from our ATS report | Left panel: grade bar F–A, issue count, issue groups; clicking an issue focuses that field on the page |
| Check & Tailor (ATS) | **Check & Tailor** | Left panel: paste a job description → match score → missing keywords/suggestions (existing tailoring API) |
| Rearrange | **Rearrange** | Modal: drag section cards per column (dnd-kit); header locked; hide/show toggle per card (our addition) |
| Templates | **Templates** | Left panel: template thumbnails, live switch, "Continue editing" |
| Design & Font | **Design & Font** | Left panel: accent colours + custom, font, font size, line height, margins, section spacing |
| Undo / redo | Undo / redo (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z) | — |
| Rail: eye (preview) | **Preview** | Clean full-screen page view, no editing chrome |
| Rail: download | **Download PDF** | Existing download flow (sample-data check included) |
| Rail: link (share) | **Share link** | Copies a link to the resume PDF (new backend endpoint) |
| Rail: robot (AI) | **AI assistant** | Right panel: improve summary, rewrite the focused bullet, suggest skills (existing AI endpoints) |
| — (ours, the 10%) | **Add section** on the rail, a section outline mini-map on wide screens, and sample-data badges on the page | — |

## Architecture

- `ResumeRenderer` stays the single renderer for preview, thumbnails and PDF. Fields are wrapped in
  `EditableText` / `EditableHtml`, which render **plain output unless a `CanvasEditProvider` is
  present** → PDF/thumbnail markup is unchanged.
- Edits commit on blur (not per keystroke) so pagination re-flows only after an edit, keeping the
  caret stable.
- Toolbars/outlines live in an overlay layer **outside** `.resume-page`, so they never reach the
  server-side PDF (which serialises page HTML).
- Entry/section operations are pure functions over `resume.content` (`canvasOps.ts`, unit tested).
- New entries are seeded with "Sample …" labels so the existing sample-data check flags anything
  the user forgets to replace.
- The old layout stays reachable via "Classic editor" while the new one beds in.

## Round 2 research — features found by building a resume end to end (paid account)

| Enhancv behaviour | Plan for us |
| --- | --- |
| **Fix Mistakes** re-grades live (B → D+ → C-), issue cards: type label, "Did you mean …", original struck through, suggestion chips (1 click applies), Ignore | Our ATS report issues → cards with Apply (rewrite suggestion) / Ignore; grade updates after each fix |
| Issues are **highlighted on the page** (red: spelling/grammar, blue: weak bullet); clicking a card scrolls the page to it | Overlay highlights the issue excerpt on the page; clicking an issue scrolls to it and flashes it |
| "Rewrite bullet" rewrites **in place**, missing numbers as `{XX}` | Same via our AI rewrite (already returns `{X}` placeholders) |
| Recruiter checks (Credibility, Interview Risks, Age Bias, Gaps, Scope, Skill Gaps) + Essentials (Sections, Contact, Links & Dates, ATS parse, Format, Design) with % and expandable items | Already covered by our ATS report categories |
| **Check & Tailor**: paste JD/URL → ATS match %, keyword table (keyword · in resume ✓/✗ · count in ad · exclude), Tailored title, Content (metrics, spelling, repetition), Essential sections (summary, degree, years), contact, ATS essentials | Tailor side panel driven by our job-match API; keyword table with exclude; buttons jump to the related fix |
| Keywords found in the resume are **highlighted green** on the page while tailoring | Same overlay, green |
| **AI suggested edits** land on the page highlighted orange, popover "Original: … Restore / Approve", sticky bar "Reject all / Approve all" | Review mode for AI tailoring: apply, keep the original, highlight changed fields, per-field restore, approve/reject all |
| Preview: toggle **What Recruiters See / What ATS Sees** (plain text, headings underlined with `=====`, bullets ` - `) | Preview dialog with the same toggle; ATS view = text extracted from our real PDF |
| **Version history**: full-screen, versions by day, preview, Restore / Restore as copy | Server-side snapshots on save (throttled), history panel with restore |
| Entry toolbar: **date picker** popover (From/To, year grid, months, Present), **gear** = per-field visibility toggles | Date popover on the canvas toolbar |
| Download dialog: editable file name, PDF, TXT, email | File name + PDF + TXT |
| Share panel: public link toggle, comments from friends | Share link (done) |
| Editor is full-screen (no app sidebar) | Done |

## Built on `feat/resume-editor-revamp` (both repos)

**Editor shell** — full-screen (no app sidebar), top bar (back, title, save status, Classic editor, import, Chrome sync, Download), tool row (Fix Mistakes + grade, Check & Tailor + match %, Rearrange, Templates, Design & Font, undo/redo, History), icon rail (Preview, Download, Share link, AI assistant, Add section). Panels dock beside the page; the page auto-fits. Mobile: fit-width page, chips scroll, toolbar docks at the bottom, panels are bottom sheets.

**On-page editing** — every visible value on all 17 templates is editable in place (audited automatically: 0 dead fields, 0 overlaps, 0 clipped text). Click an entry → focus mode (dim + outline + toolbar: + Entry, move, dates, B/I/U/list, Details, duplicate, delete, section menu). Dates → From/To picker with Present. Skills → tag editor (keeps storage shape). Combined lines open the owning section's panel. Volunteering now renders.

**Fix Mistakes** — grade tile + F–A bar, issue cards (spelling chips, "Use suggestion", Rewrite with AI, Ignore), issues highlighted on the page, click a card to jump to it; full ATS report below.

**Check & Tailor** — paste a job → match %, keyword table (✓/✗, exclude, "I have this" → Skills), fits/gaps, matched keywords highlighted green. **Tailor with AI** edits land in orange with Approve all / Reject all.

**Preview** — What recruiters see / What ATS sees (plain text in reading order).

**History** — snapshots every 10 min while editing (50 kept), list by day, preview, restore or restore as copy (current state always kept first).

**Download** — file name, PDF or TXT. **Share** — 7-day link to the PDF.

**Backend** — `POST /resumes/:id/share-link`, `POST /resumes/ai-rewrite` (no invented numbers, refuses sample text), version history (`GET/POST /resumes/:id/versions…`, `ResumeVersion` model, deleted with the resume/account), tailoring fact guard (no job-ad tools the resume never mentions; unknown numbers → `{X}`).

**Safety** — PDF/thumbnail are captured with editing switched off (verified: no `contenteditable`/`data-rx-*` in the PDF HTML). React 19 innerHTML resets are prevented with stable props, so text being typed is never wiped.

## Own UI pass (`feat/resume-editor-own-ui`)

Goal: same jobs-to-be-done, clearly our own product. Functional ideas (edit on the page, score, job
match, versions) are not protectable; the specific look, layout, names and flows are. So we change
structure, interaction, visuals and wording — not just colours. No Enhancv assets, icons, copy or
code were ever used. (Not legal advice — have counsel review before a commercial launch.)

| Area | Enhancv pattern | Ours |
| --- | --- | --- |
| Layout | Centered horizontal tool row under the app bar + right icon rail + slide-in left panel | **Left "Studio" sidebar** (vertical icon + label) with panels opening beside it; actions (Preview, Share, Versions, Export) live in the top bar; no right rail. Mobile: bottom tab bar |
| Feature names | Fix Mistakes · Check & Tailor · Rearrange · Templates · Design & Font · History | **Score · Job match · Reorder · Designs · Style · Versions**, plus **Outline** and **AI Coach** |
| Score | Letter grade F–A badge + F–A bar | **Numeric score ring (0–100) + band** (Needs work / Getting there / Strong) |
| Issue groups / copy | Spellcheck & Grammar, Quantified Impact, Wording & Readability; "Did you mean …?" | **Typos · Impact · Clarity · Polish**; "Possible typo — replace with:" |
| On-page issue marks | Filled colour highlights | **Underlines** (wavy for typos, dotted for impact, solid for keywords, dashed for AI edits) |
| Selecting an entry | Page dims grey, green outline, pill toolbar above with "+ Entry" | **No dimming**: a soft accent bar on the left of the entry and a **gutter handle** (⋮⋮ + ＋) beside it; actions in a handle menu; text formatting appears only when text is selected |
| Between sections | Divider with "New Section" / "+ Entry" pills | **＋ in the left gutter** of each section heading → Insert section |
| Adding a section | Modal grid of visual previews, "Add to Resume", "Show used sections" | **Searchable command list** ("Insert section…") with icons and one-line hints, keyboard-first |
| Dates | Popover with From/To tabs and a year grid | **Inline Start / End month + year selects** with a "Currently here" switch |
| Job keywords | Table: Keyword · In Resume · In Job Ad | **Chip cloud**: "On your resume" ✓ chips and "Missing" chips with + / hide |
| AI edits review | Orange highlights, "AI suggested edits — Reject All / Approve All" bar | **Indigo dashed underline**, a "Changes" list in the side panel, **Keep all / Undo all** |
| Preview | "What Recruiters See / What ATS Sees" | **"Designed" / "Plain text"** toggle |
| History | Full-screen view, versions list on the left, "Restore This Version / Restore As A Copy" | **Right-side drawer timeline**, "Use this version" / "Open as a new resume" |
| Placeholders | "Date period", "LinkedIn/Portfolio" | "Add dates", "Profile link" |
| Extras only we have | — | Outline navigator (jump/hide sections), keyboard shortcuts (Alt+↑/↓ move, Ctrl/⌘+Enter add item), What-ATS-sees TXT export, share link, AI Coach that never invents facts |
