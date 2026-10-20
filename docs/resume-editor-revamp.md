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
