import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogCategoryNav } from "@/components/blog/BlogCategoryNav";
import { BlogFeaturedCard } from "@/components/blog/BlogFeaturedCard";
import { BlogPageHero } from "@/components/blog/BlogPageHero";
import { BlogPagination } from "@/components/blog/BlogPagination";
import {
  fetchBlogCategories,
  fetchPublishedBlogs,
} from "@/lib/blog/server";
import { appMarketingSectionAlt } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const category = params.category?.trim() || undefined;

  const [listRes, categories] = await Promise.all([
    fetchPublishedBlogs({ page, limit: PAGE_SIZE, category }),
    fetchBlogCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(listRes.total / PAGE_SIZE));
  const showFeatured = page === 1 && !category && listRes.items.length > 0;
  const featuredPost = showFeatured ? listRes.items[0] : null;
  const gridPosts = showFeatured ? listRes.items.slice(1) : listRes.items;

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <SiteHeader />

      <div className="pt-16 sm:pt-[4.25rem]">
        <BlogPageHero
          totalPosts={listRes.total}
          topicCount={categories.length}
          activeCategory={category}
        />

        <BlogCategoryNav categories={categories} activeCategory={category} />

        <main
          className={cn(
            appMarketingSectionAlt,
            "px-4 py-10 sm:px-6 sm:py-12 lg:py-14",
          )}
        >
          <div className="container mx-auto max-w-6xl">
            {listRes.items.length === 0 ? (
              <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm">
                <p className="text-lg font-semibold text-foreground">
                  No articles yet
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {category
                    ? `Nothing published under “${category}” yet. Try another topic or check back soon.`
                    : "We are publishing new guides on resumes, job search, and interview prep. Check back soon."}
                </p>
                {category ? (
                  <Link
                    href="/blogs"
                    className="mt-6 inline-flex rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50"
                  >
                    View all topics
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="space-y-10 lg:space-y-12">
                {featuredPost ? (
                  <section aria-labelledby="featured-heading">
                    <h2
                      id="featured-heading"
                      className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Featured
                    </h2>
                    <BlogFeaturedCard post={featuredPost} />
                  </section>
                ) : null}

                {gridPosts.length > 0 ? (
                  <section aria-labelledby="latest-heading">
                    <div className="mb-6 flex items-end justify-between gap-4">
                      <div>
                        <h2
                          id="latest-heading"
                          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                        >
                          {category ? `More in ${category}` : "Latest articles"}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {category
                            ? `${gridPosts.length} article${gridPosts.length === 1 ? "" : "s"} in this topic`
                            : "Fresh guides on interviews, resumes, and career growth"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {gridPosts.map((post, i) => (
                        <BlogCard
                          key={post.slug}
                          post={post}
                          index={showFeatured ? i + 1 : i}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                <BlogPagination
                  page={page}
                  totalPages={totalPages}
                  category={category}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      <MarketingFooter as="footer" />
    </div>
  );
}
