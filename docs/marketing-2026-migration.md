# Marketing 2026 migration

Port of `website-redesign-2026/prototype` into `interview-fe` under `src/components/marketing-2026/`. Assets are copied byte-for-byte to `public/marketing-2026/{video,shots,templates,logos}`. No video or image is re-rendered.

Rollback: set `NEXT_PUBLIC_MARKETING_2026=0` to restore each route's `legacy-page.tsx` / `legacy-home-page.tsx`.

## Inventory

| Live URL | New page | Legacy |
|---|---|---|
| `/` | `marketing-2026/pages/HomePage` | `src/app/legacy-home-page.tsx` |
| `/ai-interview-coach` | `pages/MockInterviewPage` | `ai-interview-coach/legacy-page.tsx` |
| `/ai-resume-builder` | `pages/ResumeBuilderPage` | `ai-resume-builder/legacy-page.tsx` |
| `/ai-coding-practice` | `pages/CodingRoundPage` (prototype `/ai-coding-round`) | `ai-coding-practice/legacy-page.tsx` |
| `/ai-system-design` | `pages/SystemDesignPage` | `ai-system-design/legacy-page.tsx` |

Not migrated: `/ats-checker`, `/about-us`, `/pricing`, `/blogs`, `/contact`, recruiter, interviewer. Those keep `SiteHeader` / `MarketingFooter`.

## Dependencies

Added `motion@^11.11.17` and `@radix-ui/react-accordion@^1.2.1`. Fonts: Geist, Geist Mono, Caveat via `next/font`, scoped to `.mk26`.

## Tokens

Additive CSS in `globals.css`: `--ix-navy*`, `--ix-blue`, `.bg-blueprint*`, `.bg-dots`, `.mask-fade`, `.mask-x`, `.grain`, `.ix-panel`, `.ix-sheet`, keyframes `marquee`, `mem-travel`, `thread-shine`, `run-x`, `run-y`, `grid-drift`. Reduced-motion kill-switch is scoped to `.mk26` so the app is unchanged.

## CTAs

Logged-in → product flow. Logged-out → `/sign-up?redirect_url=…`.

- Interview `/dashboard/interviews/new`
- Resume `/dashboard/resumes/new`
- Coding `/dashboard/coding-interviews/new`
- System design `/dashboard/system-design`
- ATS `/ats-checker`

"Hear the interviewer" / "Watch a round" scroll to the in-page demo. No standalone audio sample exists.

## Changelog

- 2026-10-25: Foundation + all five pages switched behind the flag. Home keeps `HomeHackathonPromoStrip` so the campaign is not dropped. Prototype titles left in `layout.tsx` (live SEO unchanged). Cleanup of unused old landing components is still pending.
- 2026-10-25: Fixed production build — `next/image` uses `mk26Path()` (no query string); videos/posters use `mk26Asset()` with `?v=`. Added Vitest for `typedAt`, focus camera, FAQ JSON-LD. `npm run build` green.

## Verify locally

```bash
cd interview-fe
npm run dev   # http://localhost:3001
# Roll back any page: NEXT_PUBLIC_MARKETING_2026=0 npm run dev
```

Pages: `/`, `/ai-interview-coach`, `/ai-resume-builder`, `/ai-coding-practice`, `/ai-system-design`.
