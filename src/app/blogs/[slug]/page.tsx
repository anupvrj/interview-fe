import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { BlogContent } from "@/components/blog/BlogContent";
import {
  StructuredData,
  createBreadcrumbSchema,
  createBlogPostingSchema,
} from "@/components/StructuredData";
import { fetchBlogBySlug } from "@/lib/blog/server";
import { getSiteUrl } from "@/lib/seo/site-url";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogBySlug(slug);
  if (!post) return { title: "Blog post not found" };

  const siteUrl = getSiteUrl();
  const canonical =
    post.canonicalUrl || `${siteUrl}/blogs/${post.slug}`;
  const keywords = [post.focusKeyword, ...post.keywords]
    .filter(Boolean)
    .join(", ");

  return {
    title: post.seoTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: `${siteUrl}/blogs/${post.slug}`,
      title: post.seoTitle || post.title,
      description: post.metaDescription || post.excerpt,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      images: post.thumbnailUrl
        ? [{ url: post.thumbnailUrl, width: 1200, height: 630 }]
        : undefined,
      tags: post.categories,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.thumbnailUrl ? [post.thumbnailUrl] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchBlogBySlug(slug);
  if (!post) notFound();

  const siteUrl = getSiteUrl();
  const articleUrl = `${siteUrl}/blogs/${post.slug}`;
  const published = new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "Blog", url: `${siteUrl}/blogs` },
    { name: post.title, url: articleUrl },
  ]);

  const blogPostingSchema = createBlogPostingSchema({
    title: post.title,
    description: post.metaDescription || post.excerpt,
    url: articleUrl,
    image: post.thumbnailUrl,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    authorName: post.authorName,
    keywords: [post.focusKeyword, ...post.keywords].filter(Boolean),
  });

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <StructuredData id="blog-breadcrumb" data={breadcrumbSchema} />
      <StructuredData id="blog-posting" data={blogPostingSchema} />
      <SiteHeader />
      <main className="container mx-auto px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/blogs"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to blog
          </Link>

          <div className="mb-4 flex flex-wrap gap-2">
            {post.categories.map((cat) => (
              <Link
                key={cat}
                href={`/blogs?category=${encodeURIComponent(cat)}`}
                className="rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {cat}
              </Link>
            ))}
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>By {post.authorName}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.publishedAt}>{published}</time>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readingTimeMinutes} min read
            </span>
          </div>

          {post.thumbnailUrl ? (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl">
              <Image
                src={post.thumbnailUrl}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          ) : null}

          {post.excerpt ? (
            <p className="mt-8 text-lg text-muted-foreground">{post.excerpt}</p>
          ) : null}

          <div className="mt-10">
            <BlogContent html={post.content} />
          </div>
        </article>
      </main>
      <MarketingFooter as="footer" />
    </div>
  );
}
