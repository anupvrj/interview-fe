"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StringListEditor } from "@/components/system-design-admin/StringListEditor";
import { SeoScoreCard } from "@/components/blog-admin/SeoScoreCard";
import {
  BlogFormField,
  blogControlClass,
} from "@/components/blog-admin/BlogFormField";
import type { BlogFormValues } from "@/components/blog-admin/form-utils";

interface SeoPanelProps {
  readonly form: BlogFormValues;
  readonly onChange: (patch: Partial<BlogFormValues>) => void;
}

export function SeoPanel({ form, onChange }: SeoPanelProps) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <BlogFormField label="SEO title" htmlFor="blog-seo-title" stacked>
        <Input
          id="blog-seo-title"
          className={blogControlClass}
          value={form.seoTitle}
          onChange={(e) => onChange({ seoTitle: e.target.value })}
          placeholder={form.title || "Page title for search engines"}
          maxLength={70}
        />
        <p className="mt-1.5 text-right text-xs text-muted-foreground">
          {form.seoTitle.length}/70
        </p>
      </BlogFormField>

      <BlogFormField label="Meta description" htmlFor="blog-meta-desc" stacked>
        <Textarea
          id="blog-meta-desc"
          className="min-h-[96px] w-full resize-y text-base sm:text-sm"
          value={form.metaDescription}
          onChange={(e) => onChange({ metaDescription: e.target.value })}
          placeholder="Compelling description for search results"
          maxLength={320}
        />
        <p className="mt-1.5 text-right text-xs text-muted-foreground">
          {form.metaDescription.length}/320
        </p>
      </BlogFormField>

      <BlogFormField label="Focus keyword" htmlFor="blog-focus-kw" stacked>
        <Input
          id="blog-focus-kw"
          className={blogControlClass}
          value={form.focusKeyword}
          onChange={(e) => onChange({ focusKeyword: e.target.value })}
          placeholder="e.g. AI interview preparation"
        />
      </BlogFormField>

      <StringListEditor
        label="Keywords"
        value={form.keywords}
        onChange={(keywords) => onChange({ keywords })}
        placeholder="Add keyword"
        stacked
      />

      <BlogFormField
        label="Canonical URL"
        htmlFor="blog-canonical"
        hint="Optional. Leave blank to use the default blog URL."
        stacked
      >
        <Input
          id="blog-canonical"
          className={blogControlClass}
          value={form.canonicalUrl}
          onChange={(e) => onChange({ canonicalUrl: e.target.value })}
          placeholder="https://interviewtrix.com/blogs/your-slug"
        />
      </BlogFormField>

      <div className="border-t border-border/80 pt-5">
        <SeoScoreCard
          input={{
            title: form.title,
            slug: form.slug,
            excerpt: form.excerpt,
            content: form.content,
            seoTitle: form.seoTitle,
            metaDescription: form.metaDescription,
            focusKeyword: form.focusKeyword,
            thumbnailUrl: form.thumbnailUrl,
          }}
        />
      </div>
    </div>
  );
}
