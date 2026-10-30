import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { Marketing2026Shell } from "@/components/marketing-2026/Marketing2026Shell";
import { Nav } from "@/components/marketing-2026/nav";
import { FinalCta, Footer } from "@/components/marketing-2026/closing";
import { BlogArticle } from "@/components/marketing-2026/blog";
import {
  StructuredData,
  createBreadcrumbSchema,
  createBlogPostingSchema,
} from "@/components/StructuredData";
import { fetchBlogBySlug } from "@/lib/blog/server";
import { defaultOgImage } from "@/lib/seo/default-og-image";
import { getSearchRobots, getSiteUrl } from "@/lib/seo/site-url";
import LegacyBlogPostPage from "./legacy-page";

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
        ? [{ url: post.thumbnailUrl, width: 1200, height: 630, alt: post.title }]
        : [defaultOgImage],
      tags: post.categories,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.thumbnailUrl ? [post.thumbnailUrl] : [defaultOgImage.url],
    },
    robots: getSearchRobots(),
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  if (!isMarketing2026Enabled()) return <LegacyBlogPostPage params={params} />;
  const { slug } = await params;
  const post = await fetchBlogBySlug(slug);
  if (!post) notFound();

  const siteUrl = getSiteUrl();
  const articleUrl = `${siteUrl}/blogs/${post.slug}`;
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
    <Marketing2026Shell>
      <StructuredData id="blog-breadcrumb" data={breadcrumbSchema} />
      <StructuredData id="blog-posting" data={blogPostingSchema} />
      <Nav />
      <main><BlogArticle post={post} /></main>
      <FinalCta />
      <Footer />
    </Marketing2026Shell>
  );
}
