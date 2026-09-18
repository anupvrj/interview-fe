import { prepareBlogHtmlForDisplay } from "@/lib/blog/html-blocks";
import { normalizeBlogParagraphSpacing } from "@/lib/blog/paragraph-spacing";
import "@/styles/blog-blockquote.css";
import "@/styles/blog-paragraph-spacing.css";

interface BlogContentProps {
  readonly html: string;
}

export function BlogContent({ html }: BlogContentProps) {
  const displayHtml = normalizeBlogParagraphSpacing(prepareBlogHtmlForDisplay(html));

  return (
    <div
      className="blog-prose prose prose-lg max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-primary prose-img:my-6 prose-img:rounded-lg prose-img:shadow-md [&_img]:max-w-full [&_img]:h-auto"
      dangerouslySetInnerHTML={{ __html: displayHtml }}
    />
  );
}
