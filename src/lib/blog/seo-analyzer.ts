export type SeoCheckStatus = "good" | "warning" | "bad";

export type SeoCheck = {
  id: string;
  label: string;
  status: SeoCheckStatus;
  message: string;
};

export type SeoAnalysisInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  thumbnailUrl: string;
};

export type SeoAnalysisResult = {
  score: number;
  checks: SeoCheck[];
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function keywordDensity(text: string, keyword: string): number {
  if (!keyword.trim() || !text.trim()) return 0;
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const kw = keyword.toLowerCase().trim();
  const matches = words.filter((w) => w.includes(kw) || kw.includes(w)).length;
  return words.length ? (matches / words.length) * 100 : 0;
}

function check(
  id: string,
  label: string,
  status: SeoCheckStatus,
  message: string,
): SeoCheck {
  return { id, label, status, message };
}

export function analyzeSeo(input: SeoAnalysisInput): SeoAnalysisResult {
  const checks: SeoCheck[] = [];
  const plainContent = stripHtml(input.content);
  const first100Words = plainContent.split(/\s+/).slice(0, 100).join(" ");
  const kw = input.focusKeyword.trim().toLowerCase();

  const seoTitleLen = input.seoTitle.length;
  if (seoTitleLen >= 50 && seoTitleLen <= 60) {
    checks.push(check("seo-title-len", "SEO title length", "good", `${seoTitleLen} chars (ideal 50–60)`));
  } else if (seoTitleLen >= 30 && seoTitleLen <= 70) {
    checks.push(check("seo-title-len", "SEO title length", "warning", `${seoTitleLen} chars (ideal 50–60)`));
  } else {
    checks.push(check("seo-title-len", "SEO title length", "bad", `${seoTitleLen || 0} chars (ideal 50–60)`));
  }

  const metaLen = input.metaDescription.length;
  if (metaLen >= 150 && metaLen <= 160) {
    checks.push(check("meta-len", "Meta description length", "good", `${metaLen} chars (ideal 150–160)`));
  } else if (metaLen >= 120 && metaLen <= 320) {
    checks.push(check("meta-len", "Meta description length", "warning", `${metaLen} chars (ideal 150–160)`));
  } else {
    checks.push(check("meta-len", "Meta description length", "bad", `${metaLen || 0} chars (ideal 150–160)`));
  }

  const excerptLen = input.excerpt.length;
  if (excerptLen >= 120 && excerptLen <= 160) {
    checks.push(check("excerpt-len", "Excerpt length", "good", `${excerptLen} chars (ideal 120–160)`));
  } else if (excerptLen >= 80) {
    checks.push(check("excerpt-len", "Excerpt length", "warning", `${excerptLen} chars (ideal 120–160)`));
  } else {
    checks.push(check("excerpt-len", "Excerpt length", "bad", `${excerptLen || 0} chars — add a card excerpt`));
  }

  if (kw) {
    const inTitle = input.seoTitle.toLowerCase().includes(kw);
    checks.push(
      check(
        "kw-title",
        "Focus keyword in SEO title",
        inTitle ? "good" : "bad",
        inTitle ? `"${input.focusKeyword}" found in title` : `"${input.focusKeyword}" not in SEO title`,
      ),
    );

    const inIntro = first100Words.toLowerCase().includes(kw);
    checks.push(
      check(
        "kw-intro",
        "Focus keyword in introduction",
        inIntro ? "good" : "warning",
        inIntro ? "Keyword appears in first 100 words" : "Add keyword to the opening paragraph",
      ),
    );

    const headingMatch = /<h[23][^>]*>[\s\S]*?<\/h[23]>/gi.test(input.content) &&
      input.content.toLowerCase().includes(kw);
    checks.push(
      check(
        "kw-heading",
        "Focus keyword in subheading",
        headingMatch ? "good" : "warning",
        headingMatch ? "Keyword found in H2/H3" : "Use keyword in at least one H2 or H3",
      ),
    );

    const density = keywordDensity(plainContent, kw);
    if (density >= 0.5 && density <= 2.5) {
      checks.push(check("kw-density", "Keyword density", "good", `${density.toFixed(1)}% (ideal 0.5–2.5%)`));
    } else if (density > 0) {
      checks.push(check("kw-density", "Keyword density", "warning", `${density.toFixed(1)}% (ideal 0.5–2.5%)`));
    } else {
      checks.push(check("kw-density", "Keyword density", "bad", "Keyword not found in content"));
    }

    const slugHasKw = input.slug.toLowerCase().includes(kw.replace(/\s+/g, "-"));
    checks.push(
      check(
        "kw-slug",
        "Keyword in URL slug",
        slugHasKw ? "good" : "warning",
        slugHasKw ? "Slug contains focus keyword" : "Consider adding keyword to slug",
      ),
    );
  } else {
    checks.push(check("kw-set", "Focus keyword", "warning", "Set a focus keyword for analysis"));
  }

  const wordCount = countWords(plainContent);
  if (wordCount >= 300) {
    checks.push(check("word-count", "Content length", "good", `${wordCount} words`));
  } else if (wordCount >= 150) {
    checks.push(check("word-count", "Content length", "warning", `${wordCount} words (aim for 300+)`));
  } else {
    checks.push(check("word-count", "Content length", "bad", `${wordCount} words (aim for 300+)`));
  }

  const imgTags = input.content.match(/<img[^>]*>/gi) ?? [];
  const imgsWithoutAlt = imgTags.filter((tag) => !/\balt\s*=\s*["'][^"']+["']/i.test(tag));
  if (imgTags.length === 0) {
    checks.push(check("img-alt", "Image alt text", "warning", "No images in content"));
  } else if (imgsWithoutAlt.length === 0) {
    checks.push(check("img-alt", "Image alt text", "good", "All images have alt text"));
  } else {
    checks.push(
      check("img-alt", "Image alt text", "bad", `${imgsWithoutAlt.length} image(s) missing alt text`),
    );
  }

  const hasInternalLink = /href\s*=\s*["'][^"']*interviewtrix[^"']*["']/i.test(input.content);
  checks.push(
    check(
      "internal-links",
      "Internal links",
      hasInternalLink ? "good" : "warning",
      hasInternalLink ? "Contains link to Interview Trix" : "Add at least one internal link",
    ),
  );

  if (input.thumbnailUrl.trim()) {
    checks.push(check("thumbnail", "Featured image", "good", "Thumbnail set for cards & OG"));
  } else {
    checks.push(check("thumbnail", "Featured image", "bad", "Add a thumbnail for social sharing"));
  }

  const weights: Record<SeoCheckStatus, number> = { good: 1, warning: 0.5, bad: 0 };
  const score = Math.round(
    (checks.reduce((sum, c) => sum + weights[c.status], 0) / checks.length) * 100,
  );

  return { score, checks };
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 bg-emerald-500/12";
  if (score >= 50) return "text-amber-600 bg-amber-500/12";
  return "text-rose-600 bg-rose-500/12";
}

export function statusIconColor(status: SeoCheckStatus): string {
  if (status === "good") return "text-emerald-600";
  if (status === "warning") return "text-amber-600";
  return "text-rose-600";
}
