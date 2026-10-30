import { isMarketing2026Enabled } from "@/components/marketing-2026/flag";
import { Marketing2026Shell } from "@/components/marketing-2026/Marketing2026Shell";
import { Nav } from "@/components/marketing-2026/nav";
import { FinalCta, Footer } from "@/components/marketing-2026/closing";
import { BlogCard2026, BlogEmpty, BlogFeatured, BlogHero, BlogPager, BlogTopics } from "@/components/marketing-2026/blog";
import { fetchBlogCategories, fetchPublishedBlogs } from "@/lib/blog/server";
import LegacyBlogsPage from "./legacy-page";

const PAGE_SIZE = 12;

type Props = { searchParams: Promise<{ page?: string; category?: string }> };

export default async function BlogsPage({ searchParams }: Props) {
  if (!isMarketing2026Enabled()) return <LegacyBlogsPage searchParams={searchParams} />;
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const category = params.category?.trim() || undefined;

  const [listRes, categories] = await Promise.all([
    fetchPublishedBlogs({ page, limit: PAGE_SIZE, category }),
    fetchBlogCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(listRes.total / PAGE_SIZE));
  const featured = page === 1 && !category ? listRes.items[0] : undefined;
  const grid = featured ? listRes.items.slice(1) : listRes.items;

  return (
    <Marketing2026Shell>
      <Nav />
      <main>
        <BlogHero total={listRes.total} topics={categories.length} category={category} />
        <BlogTopics categories={categories} active={category} />
        <section className="bg-[#F8F8FB] pb-24 pt-10 md:pt-14">
          <div className="mx-auto max-w-[1180px] space-y-12 px-5">
            {listRes.items.length === 0 ? (
              <BlogEmpty category={category} />
            ) : (
              <>
                {featured && <BlogFeatured post={featured} />}
                {grid.length > 0 && (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {grid.map((post) => <BlogCard2026 key={post.slug} post={post} />)}
                  </div>
                )}
                <BlogPager page={page} totalPages={totalPages} category={category} />
              </>
            )}
          </div>
        </section>
      </main>
      <FinalCta />
      <Footer />
    </Marketing2026Shell>
  );
}
