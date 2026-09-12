"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BlogFormValues } from "@/components/blog-admin/form-utils";
import { prepareBlogHtmlForDisplay } from "@/lib/blog/html-blocks";
import { normalizeBlogParagraphSpacing } from "@/lib/blog/paragraph-spacing";
import "@/styles/blog-blockquote.css";
import "@/styles/blog-paragraph-spacing.css";

interface BlogPreviewDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly form: BlogFormValues;
}

export function BlogPreviewDialog({
  open,
  onOpenChange,
  form,
}: BlogPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview: {form.title || "Untitled"}</DialogTitle>
        </DialogHeader>
        <article className="space-y-4">
          {form.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.thumbnailUrl}
              alt={form.title}
              className="aspect-video w-full rounded-lg object-cover"
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            {form.categories.map((c) => (
              <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {c}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-bold">{form.title || "Untitled post"}</h1>
          {form.excerpt ? (
            <p className="text-muted-foreground">{form.excerpt}</p>
          ) : null}
          <div
            className="blog-prose prose prose-sm max-w-none dark:prose-invert [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg"
            dangerouslySetInnerHTML={{
              __html:
                normalizeBlogParagraphSpacing(prepareBlogHtmlForDisplay(form.content)) ||
                "<p>No content yet.</p>",
            }}
          />
        </article>
      </DialogContent>
    </Dialog>
  );
}
