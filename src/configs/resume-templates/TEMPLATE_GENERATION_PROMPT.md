# Resume Template Generation Skill (Expert Prompt)

> Use this as a ready-to-paste prompt + checklist to generate a **new resume template**
> from a reference image so it renders **identically in live preview and in the
> downloaded PDF**, matches the existing architecture, and **never breaks existing
> templates**. Written for a senior frontend + PDF-generation engineer.

---

## 0. Role & Operating Rules

You are an expert fullstack designer (10+ yrs) specializing in resume layout systems
and Puppeteer/print PDF parity. When given a reference image (or several), reproduce its
**columns, sections, accent color, typography, and section-header style** as faithfully
as possible while keeping the result **ATS-safe** and **PDF-reliable**.

Hard rules:

1. **Never edit core rendering** (`src/components/ResumeRenderer.tsx`) or any existing
   template's files. Only **append** to shared registries. Adding a template must be
   purely additive.
2. **Configuration-first**: reproduce the design using existing config-driven features
   before considering any custom component. The renderer already supports everything in
   §3 — use it.
3. **ATS-safe adaptation**: decorative background blobs/graphics, multi-color gradients,
   and non-text icons are dropped or simplified. Keep layout, color accents, rules, and
   spacing. Real text only — no text baked into images.
4. **PDF parity is mandatory**: every color rule needs `!important` +
   `-webkit-print-color-adjust: exact`, and a `@media print` block must re-assert colors
   and page-break rules. Prefer `flex`/`table` over CSS `grid` for print-critical layout.
5. **Unique kebab-case id** (e.g. `true-blue`, `clean-slate`). The display name is the
   Title-Case version (e.g. `True Blue`).

---

## 1. What a template is (3 files + registration)

Each template lives in `src/configs/resume-templates/{id}/` with exactly three files:

| File | Purpose |
| --- | --- |
| `config.ts` | Metadata + `style` + `rendering` + `defaultSectionOrder`. Drives the renderer. |
| `style.css` | All visual styling via `.{id}-*` classes. Copied to `public/` for preview + PDF. |
| `dummy-content.ts` | Sample resume data used for previews/testing. |

Then register the id in **four** shared places (append only):

1. `src/lib/templateLoader.ts` → add id to `TEMPLATE_MANIFEST` (this is what
   `resumeApi.getTemplates()` lists and what `copy-template-css` does NOT depend on —
   the copy script scans folders, but the manifest controls listing/loading).
2. `src/lib/templateRegistry.ts` → add
   `"{id}": require("@/configs/resume-templates/{id}/config")` to `knownConfigs`
   (synchronous fallback used by `getExtendedTemplate`).
3. `src/configs/resume-templates/templates-catalog.ts` → add a `TemplateCatalogItem`
   (marketing/showcase metadata). Set `new: true`.
4. `public/resume-template-images/{id}-preview.webp` → preview thumbnail referenced by
   `template.preview` in `config.ts`.

CSS is auto-copied from `src/configs/.../{id}/style.css` to
`public/resume-templates/{id}/style.css` by `npm run copy-template-css`
(runs automatically in `npm run dev` and `npm run build`). Both the live preview
(`cssRegistry.loadTemplateCSS`) and the server PDF (`fetchTemplateCssForPdf`) fetch from
that public path, so a single `style.css` guarantees preview == PDF.

> Backend note: `interview-core` returns no templates and the PDF service receives the
> template CSS from the client. **No backend changes are ever needed for a new template.**

---

## 2. Exact file skeletons

### 2.1 `config.ts`

The dynamic loader resolves the default export and/or a named export
`{idWithoutDashes}Config`. Always provide both.

```ts
import {
  ResumeTemplate,
  ExtendedResumeTemplate,
  TemplateConfig,
} from "../template-types";

export const myTemplate: ResumeTemplate = {
  id: "my-template",
  name: "My Template",
  category: "simple", // "simple" | "modern" | "creative"
  description: "One-line description",
  preview: "/resume-template-images/my-template-preview.webp",
  colors: {
    primary: "#1f2937",
    secondary: "#475569",
    accent: "#2563eb",
    text: "#000000",
    background: "#ffffff",
    // optional: sidebarBackground, sidebarText, headerBackground, sectionHeaderBg
  },
  layout: {
    headerStyle: "left", // "centered" | "left" | "two-column" | "full-width"
    sectionSpacing: 10,
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: { heading: 26, subheading: 15, body: 11 },
  },
  atsOptimized: true,
};

export const myTemplateExtendedConfig: Partial<ExtendedResumeTemplate> = {
  style: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: { heading: 26, subheading: 15, body: 11, small: 10 },
    lineHeight: 1.45,
    colors: { /* same shape as above */ },
    headerStyle: "left",
    sectionSpacing: 10,
    padding: { top: 8, bottom: 8, left: 8, right: 8 }, // mm
    sectionHeader: {
      style: "border-bottom", // "underline"|"border-bottom"|"border-top-bottom"|"background"|"none"
      borderWidth: 1.5,
      borderColor: "#2563eb",
      textAlign: "left",
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: "10px",
      paddingBottom: "4px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    skillsDisplay: { type: "list", showRatings: false }, // see §3.3
    timelineLayout: { type: "vertical", datePosition: "right" }, // see §3.2
    contactDisplay: { type: "icons", layout: "horizontal" },
    // headerLayout?: { type: "with-profile-picture" | "name-title-split" | "standard", titlePosition }
  },
  rendering: {
    pageBreak: { enabled: true, calculateDynamically: true },
    dataStructure: "legacy",
    features: { showPresent: true },
    layout: {
      type: "single", // "single" | "double"
      columnWidths: { left: 100, right: 0 },
      // for double: columnAssignment: { left: [...types], right: [...types] }
    },
  },
  defaultSectionOrder: [
    { id: "personalInfo", type: "personalInfo", title: "Personal Information", visible: true },
    { id: "profileSummary", type: "profileSummary", title: "Summary", visible: true },
    { id: "experience", type: "experience", title: "Professional Experience", visible: true },
    { id: "education", type: "education", title: "Education", visible: true },
    { id: "skills", type: "skills", title: "Skills", visible: true },
    { id: "languages", type: "languages", title: "Languages", visible: false },
    { id: "certificates", type: "certificates", title: "Certificates", visible: false },
    { id: "projects", type: "projects", title: "Projects", visible: false },
  ],
};

export const myTemplateConfig: TemplateConfig = {
  template: myTemplate,
  extended: myTemplateExtendedConfig,
};

export default myTemplateConfig;
```

### 2.2 `style.css`

- Prefix **every** class with the template id: `.{id}-template`, `.{id}-name`,
  `.{id}-job-title`, `.{id}-section-header`, `.{id}-contact`, `.{id}-experience-item`,
  `.{id}-company`, `.{id}-description`, `.{id}-education-item`, `.{id}-degree`,
  `.{id}-institution`, `.{id}-skill-item`, etc. (full list in §3.4).
- Also style the renderer's auto heading: `.{id}-template h2` mirrors `.{id}-section-header`.
- Every color rule: `color: X !important;` + the three `print-color-adjust` lines.
- End with a `@media print { ... }` block that re-asserts accent colors, border colors,
  and `page-break-inside: avoid` on `.{id}-experience-item`, `.{id}-education-item`,
  `.{id}-section`.

### 2.3 `dummy-content.ts`

```ts
export const myTemplateDummyContent = {
  personalInfo: { fullName, email, phone, location, linkedin, portfolio /* = job title */, profilePicture? },
  profileSummary: "…",
  experience: [{ position, company, location, startDate: "YYYY-MM", endDate, current, description: string[] }],
  education: [{ degree, institution, location, startDate, endDate, gpa, description }],
  skills: ["…"],            // array → see §3.3 for how each display type renders it
  projects: [], certificates: [], achievements: [],
  languages: [{ name, level }], // level 1–5 for dotted ratings
  interests: "…",
};
export default myTemplateDummyContent;
```

---

## 3. Renderer capabilities (reproduce designs with these — no custom code)

### 3.1 Header layouts (`style.headerStyle` + `style.headerLayout.type`)
- **`headerStyle: "centered"`** → name/title/contact centered (images with centered names).
- **`headerStyle: "left"`** → left-aligned standard header.
- **`headerLayout.type: "name-title-split"`** + `titlePosition: "right"` → name on the
  left, job title inline on the right (good for "Name — Title" headers).
- **`headerLayout.type: "with-profile-picture"`** → full-width header band: circular
  photo on the left, name/title/contact on the right. Band background = `colors.headerBackground`.
  Use for any photo-in-header single-column design.
- **`headerStyle: "two-column"`** → photo + identity + contact are placed at the top of
  the **left sidebar** automatically; the sidebar background = `colors.sidebarBackground`,
  text = `colors.sidebarText`. This is the generic two-column path (Atlantic Blue is the
  reference). Sidebar is 40% / main 60% by default.

### 3.2 Timeline (`style.timelineLayout`)
- `type: "vertical"`, `datePosition: "right"` → dates right-aligned next to the role.
- `type: "grid"`, `datePosition: "left"`, `dateWidth: 140` → date column on the left,
  content on the right (date-on-left timeline look).

### 3.3 Skills (`style.skillsDisplay.type`) — IMPORTANT
- **`"bullets"`** → renders each skill as a stylable `.{id}-skill-item` element laid out
  in `columns` columns (default 3). **Use this whenever you want boxed tags, pipe/dot
  separators, or a multi-column skill grid**, then style `.{id}-skill-item` in CSS
  (e.g. bordered boxes, or `::after { content: " | " }`). Set `columns` 1–4.
- **`"list"` (and any other non-executive type)** → renders the skills array as a single
  comma-joined text block. Simple and ATS-clean; not individually stylable.
- **`"dots"` with ratings** → only the Executive (sections-array) data path draws dots.
  For normal templates, prefer `bullets` + CSS for any visual treatment.
- Languages with `level` can show dot ratings via `languageDisplay`.

### 3.4 Class names emitted by the renderer (target these in CSS)
`.{id}-template` (root), `.{id}-header`, `.{id}-header-section`, `.{id}-header-content`,
`.{id}-name`, `.{id}-job-title`, `.{id}-profile-picture`, `.{id}-contact`,
`.{id}-contact-item`, `.{id}-section`, `.{id}-section-header`, `.{id}-experience-item`,
`.{id}-job-header`, `.{id}-job-title-exp`, `.{id}-company`, `.{id}-job-date`,
`.{id}-job-location`, `.{id}-date-location-column`, `.{id}-date`, `.{id}-job-content`,
`.{id}-description`, `.{id}-education-item`, `.{id}-degree`, `.{id}-institution`,
`.{id}-education-date`, `.{id}-skills-container`, `.{id}-skill-item`, `.{id}-award-item`.

> Note: the renderer also applies some inline styles. CSS with `!important` wins for
> colors/borders/spacing; layout structure (flex direction, columns) comes from config.

---

## 4. Step-by-step procedure

1. **Read the reference image.** Note: column count, which sections go in which column,
   header style (centered/left/split/photo), accent color(s), section-header treatment
   (rule under text? full-width rule? uppercase?), date position, and skills treatment.
2. **Pick the closest existing template** as a base (single-column ATS → `true-blue` /
   `clean-slate` / `classic`; date-on-left → `executive`; two-column w/ photo →
   `atlantic-blue`; photo header band → `with-profile-picture`).
3. **Write `config.ts`** choosing the §3 features that reproduce the layout.
4. **Write `style.css`** with `.{id}-*` classes, accent colors (+`!important`+print-adjust),
   and a `@media print` block.
5. **Write `dummy-content.ts`** with realistic content matching the image's domain.
6. **Register** in the four places (§1). Add a preview image.
7. **Build & verify** (§5).

---

## 5. Verification checklist (must pass)

- [ ] `npm run copy-template-css` copies `{id}/style.css` to `public/resume-templates/{id}/`.
- [ ] `npm run type-check` (tsc) passes — config matches `template-types.ts`.
- [ ] `npm run lint` passes for the new files.
- [ ] Template appears in the selector (it's in `TEMPLATE_MANIFEST`).
- [ ] Live preview matches the image: columns, sections, accent, header, dates, skills.
- [ ] Server PDF download is **pixel-equivalent** to the preview (colors preserved, no
      black fills, no clipped content, sane page breaks).
- [ ] Existing templates still render unchanged (only additive edits were made).

---

## 6. Naming convention

Two-word, evocative, kebab-case ids that hint at the accent/feel — matching existing
ones (`true-blue`, `clean-slate`, `atlantic-blue`, `mercury`). Examples used in this repo:
`confident-grid`, `saffron-line`, `condensed-rule`, `royal-indigo`, `meridian`,
`amber-edge`, `navy-frame`, `cobalt-stream`, `ember-timeline`.
