# Resume Pagination Approach (interview-fe)

## How it works

The preview renders the **intact** `ResumeRenderer` once in a hidden off-screen container for measurement, then renders the **whole** renderer again per visible page inside an `overflow: hidden` box translated by `-page.offsetY` (`PaginatedPreview.tsx`). Because the renderer is whole on every page, container-spanning CSS — timeline rails (`ember-timeline` `::before`), skills/languages CSS grids, `confident-grid` header selectors, Atlantic Blue sidebar background — is preserved **by construction**. The only job of the pagination engine is to decide **where the cut falls**: on whole atomic-unit boundaries, never mid-line.

### Single-column: unit-boundary packing

1. **Measure** (`buildMeasuredUnits.ts`): walk the hidden render and emit a flat, non-overlapping `MeasuredUnit[]` from the markers the renderer already emits:
   - `[data-section-header]` → header unit, `keepWithNext` (glued to the next unit).
   - `[data-item-id="X-header"]` + `[data-item-id="X-body"]` → item header (`keepWithNext`) + body unit; the bare wrapper `[data-item-id="X"]` is dropped to avoid overlap.
   - `[data-item-id]` without sub-markers → leaf item unit (skills/languages/awards/...).
   - `[data-pagination-atomic-if-fits]` → atomic-if-fits unit (project cards).
   - `[data-section="personalInfo"]` → the page-1 header region; measured for `firstPageHeightPx`, excluded from packing.
2. **Pack** (`packUnitsIntoPages.ts`): greedy bin-pack whole units into fixed-height A4 pages **in Y-space** — the page's clip window is `[firstTop, lastBottom]` in the renderer's absolute coordinates, so the packer checks the **Y-span** (`lastBottom - pageStartY`), not the sum of unit heights. This is the critical fix: the sum-of-heights model ignored the inter-unit gaps (section spacing, margins), so a page whose summed heights fit could still have a Y-span larger than the A4 content area and clip the bottom. `keepWithNext` glue chains (a header plus its first body unit) are placed atomically; an oversized chain is placed alone on a fresh page via the `isOnEmptyPage` escape hatch. Page 1's budget is `headerHeightPx + firstPageHeightPx` (the full A4 content area, since page 1 also carries the header). Output is `{ pageNumber, offsetY, height }` — the same `PageData` shape the preview and PDF serializer already consume.
3. **Display** (`PaginatedPreview.tsx`): each page renders the **intact** `ResumeRenderer` (no clip, no translate) inside an A4 box with `overflow: hidden` only as a safety net for oversized units. A `useLayoutEffect` walks the page's DOM and sets `display: none` on every unit node (`[data-item-id]`, `[data-section-id]`, `[data-section="personalInfo"]`) whose id is a known unit but not in that page's visible set. Hidden units collapse out of flow, so the remaining (visible) units re-flow to the top — no clipped lines, no split items, no gaps — and every container (timeline rail, grid, sidebar background) is present because the renderer is whole on every page. Because a page's units are a contiguous run from the original render, the re-flowed height equals the packed Y-span, which the packer already guaranteed fits the A4 content area.

### Two-column: per-column packing (unified with single-column)

Two-column templates (e.g. Atlantic Blue) split sections into left/right columns. The hook packs each column's units independently with the same `packUnitsIntoPages` (each column measured against its own content width, which the renderer already lays out), then zips the two column page-lists by page index. Page N shows the left column's Nth unit set and the right column's Nth unit set; a page may have content in one column and an empty slot in the other (the sidebar typically fits on page 1, pages 2+ show the sidebar background via the page background gradient plus continued main content). The display:none rendering handles this naturally — both columns are laid out side-by-side by the intact renderer, and per-page hiding is applied across both columns from the unified visible set. This unifies single and two-column under one engine (no separate band-slice path).

## Why the previous "decompose the renderer" attempt was abandoned

The earlier plan extracted `renderResumeUnit`/`renderResumeHeader` per-unit renderers and packed bare units. That broke across the 18 templates because:

- **Container-spanning CSS dropped** when units were rendered outside their real wrapper chain (timeline rail, grids, `confident-grid` `h2[data-section-header]`, `[data-section="personalInfo"] + [data-section]` sibling combinators, sidebar backgrounds).
- **Measurement diverged from render** (the reference's §4.1/4.2/4.3 bugs): a separate per-unit measurement portal did not reproduce the exact wrapper chain, so measured heights ≠ rendered heights and the canvas mis-rendered.
- **A 5.8k-line, 18-template refactor done as one big-bang patch** surfaced as "many templates failed" with no isolated cause.

This approach keeps the renderer byte-identical (no per-unit render path, no second measurement tree) and only changes cut logic — so measure == render by construction and container CSS is automatic.

## Verification checklist (per template, single + two-column)

1. No clipped lines; no split items; every cut falls in an inter-unit gap.
2. Container CSS present on every page: `ember-timeline` rail re-drawn per page; skills/languages grids intact; `confident-grid` headers styled; Atlantic Blue sidebar background reaches the page bottom.
3. `getComputedStyle` diff on section-header / item / skills nodes between the hidden measure render and the visible page — byte-identical (guaranteed by construction; verify anyway).
4. Page 1 accounts for the resume header (header not re-rendered on page 2+).
5. PDF export matches the preview page-for-page with no reflow.

## Follow-ups (deferred)

- **`data-item-body-block` markers in `ResumeRenderer`**: splitting item bodies at paragraph/`<li>` boundaries so long bullet lists flow across pages instead of being moved whole. Requires splitting the body HTML render (a structural renderer change), so it was deferred to keep the initial ship renderer-untouched. Without it, an item body taller than a full page is placed alone via `isOnEmptyPage` and clipped by the page box's `overflow: hidden` safety net (same overflow behavior as today).
- **Retire the old band engine**: `resume-pagination-engine.ts`, `snap-resume-page-breaks.ts`, `resolve-pagination-straddle-column.ts`, and their tests are no longer used by the hook (single and two-column now both use the unit packer + display:none). They can be deleted once the new engine is verified across all 18 templates.
