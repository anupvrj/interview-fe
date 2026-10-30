import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock } from "lucide-react";
import type { PublicBlogDetail, PublicBlogListItem } from "@/lib/api";
import { BlogContent } from "@/components/blog/BlogContent";
import { cn } from "@/lib/utils";
import { GridRunners } from "./graphics";
import { Mono } from "./primitives";

/**
 * The blog list and article pages in the 2026 design. Server components: posts come from the same API calls as
 * before, only the layout and styling are new.
 */

// same values as landing-kit's HL/INK; copied because a server component can't read constants from a client module
const HL = "bg-gradient-to-r from-[#8E83F5] to-[#5AA8FF] bg-clip-text pr-[0.06em] text-transparent";
const INK = "text-[#2E3656]";

const date = (iso: string, month: "short" | "long" = "short") =>
  new Date(iso).toLocaleDateString("en-US", { month, day: "numeric", year: "numeric" });

const topicHref = (cat?: string) => (cat ? `/blogs?category=${encodeURIComponent(cat)}` : "/blogs");

/** A thumbnail, or a branded tile for posts without one. */
function Cover({ post, sizes, priority, className }: { post: PublicBlogListItem; sizes: string; priority?: boolean; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-[#F1F0FB]", className)}>
      {post.thumbnailUrl ? (
        <Image src={post.thumbnailUrl} alt={post.title} fill sizes={sizes} priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(60%_70%_at_30%_20%,rgba(142,131,245,.35),transparent_70%),linear-gradient(135deg,#F4F2FF,#E8F1FF)]">
          <Mono className="text-[11px] text-primary/70">INTERVIEW TRIX · BLOG</Mono>
        </div>
      )}
    </div>
  );
}

function Meta({ post, long }: { post: PublicBlogListItem; long?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-muted-foreground">
      <time dateTime={post.publishedAt}>{date(post.publishedAt, long ? "long" : "short")}</time>
      <span aria-hidden className="size-1 rounded-full bg-[#C9CBDD]" />
      <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden />{post.readingTimeMinutes} min read</span>
    </span>
  );
}

export function BlogHero({ total, topics, category }: { total: number; topics: number; category?: string }) {
  return (
    <section className="relative overflow-clip pb-10 pt-28 md:pb-14 md:pt-40">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_75%_25%,rgba(115,103,240,.16),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_85%)]" />
      <GridRunners />
      <div className="relative mx-auto max-w-[1180px] px-5">
        <Mono className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-3 py-1.5 text-[11px] text-primary shadow-sm backdrop-blur">
          <span className="relative flex size-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-primary/60" /><span className="relative size-1.5 rounded-full bg-primary" /></span>
          INTERVIEW TRIX BLOG
        </Mono>
        <h1 className={cn("mt-6 max-w-[15ch] text-[40px] font-black leading-[0.98] tracking-[-0.055em] sm:text-[56px] md:text-[68px]", INK)}>
          {category ? <>{category}<span className={HL}>.</span></> : <>Smarter prep for the <span className={HL}>AI hiring era.</span></>}
        </h1>
        <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed text-[#4B5275]">
          Guides on resumes, job search, interview prep and the AI tools that help.
        </p>
        <div className="mt-7 flex flex-wrap gap-2.5">
          {[[total, total === 1 ? "article" : "articles"], [topics, topics === 1 ? "topic" : "topics"]].map(([n, l]) => (
            <span key={String(l)} className="inline-flex items-baseline gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 shadow-[0_8px_20px_-16px_rgba(30,20,80,.5)]">
              <span className={cn("text-[18px] font-extrabold tracking-[-0.02em]", INK)}>{n}</span>
              <span className="text-[13px] text-muted-foreground">{l}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Topic chips: wraps on desktop, one swipeable row on phones; sticks under the nav while you scroll. */
export function BlogTopics({ categories, active }: { categories: string[]; active?: string }) {
  if (categories.length === 0) return null;
  const chip = (on: boolean) =>
    cn("shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13.5px] font-medium transition-colors",
      on ? "border-primary bg-primary text-white shadow-[0_8px_20px_-10px_rgba(115,103,240,.8)]" : "border-border bg-white text-[#2E3656] hover:border-primary/40 hover:text-primary");
  return (
    <nav aria-label="Blog topics" className="sticky top-[76px] z-20 border-y border-[#E7E6F2] bg-[#F8F8FB]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1180px] gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link href={topicHref()} className={chip(!active)} aria-current={!active ? "page" : undefined}>All topics</Link>
        {categories.map((c) => (
          <Link key={c} href={topicHref(c)} className={chip(active === c)} aria-current={active === c ? "page" : undefined}>{c}</Link>
        ))}
      </div>
    </nav>
  );
}

export function BlogFeatured({ post }: { post: PublicBlogListItem }) {
  return (
    <Link href={`/blogs/${post.slug}`}
      className="group relative grid overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_30px_60px_-40px_rgba(30,20,80,.55)] transition-shadow hover:shadow-[0_36px_70px_-36px_rgba(75,63,208,.5)] lg:grid-cols-[1.1fr_1fr]">
      <Cover post={post} priority sizes="(max-width: 1024px) 100vw, 620px" className="aspect-[16/10] lg:aspect-auto lg:min-h-[380px]" />
      <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-11">
        <Mono className="text-[11px] text-primary">FEATURED{post.categories[0] ? ` · ${post.categories[0].toUpperCase()}` : ""}</Mono>
        <h2 className={cn("mt-3 text-[26px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[34px]", INK)}>{post.title}</h2>
        <p className="mt-4 line-clamp-3 text-[15.5px] leading-relaxed text-[#4B5275]">{post.excerpt}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Meta post={post} long />
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(115,103,240,.9)]">
            Read article <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function BlogCard2026({ post }: { post: PublicBlogListItem }) {
  return (
    <Link href={`/blogs/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-border bg-white shadow-[0_20px_44px_-36px_rgba(30,20,80,.6)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_28px_54px_-30px_rgba(75,63,208,.45)]">
      <Cover post={post} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px" className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {post.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.categories.slice(0, 2).map((c) => (
              <span key={c} className="rounded-full bg-primary/[0.08] px-2.5 py-0.5 text-[11.5px] font-medium text-primary">{c}</span>
            ))}
          </div>
        )}
        <h3 className={cn("mt-3 line-clamp-2 text-[18.5px] font-bold leading-snug tracking-[-0.02em]", INK)}>{post.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-[14px] leading-relaxed text-muted-foreground">{post.excerpt}</p>
        <div className="mt-5 flex items-center justify-between border-t border-[#EEEDF5] pt-4">
          <Meta post={post} />
          <ArrowUpRight className="size-4 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </div>
      </div>
    </Link>
  );
}

export function BlogEmpty({ category }: { category?: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-[24px] border border-dashed border-[#D9D7EA] bg-white px-6 py-16 text-center">
      <p className={cn("text-[19px] font-bold", INK)}>No articles yet</p>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
        {category
          ? `Nothing published under “${category}” yet. Try another topic or check back soon.`
          : "We are publishing new guides on resumes, job search, and interview prep. Check back soon."}
      </p>
      {category && (
        <Link href="/blogs" className="mt-6 inline-flex rounded-xl border border-border bg-white px-4 py-2 text-[14px] font-medium text-[#2E3656] hover:border-primary/40">View all topics</Link>
      )}
    </div>
  );
}

export function BlogPager({ page, totalPages, category }: { page: number; totalPages: number; category?: string }) {
  if (totalPages <= 1) return null;
  const qs = category ? `&category=${encodeURIComponent(category)}` : "";
  const btn = "inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-white px-4 text-[14px] font-medium text-[#2E3656] transition-colors hover:border-primary/40 hover:text-primary";
  return (
    <nav aria-label="Blog pages" className="flex items-center justify-center gap-3">
      {page > 1 ? <Link href={`/blogs?page=${page - 1}${qs}`} className={btn}><ArrowLeft className="size-4" />Newer</Link> : <span className={cn(btn, "pointer-events-none opacity-40")}><ArrowLeft className="size-4" />Newer</span>}
      <Mono className="px-2 text-[12px] text-muted-foreground">{String(page).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}</Mono>
      {page < totalPages ? <Link href={`/blogs?page=${page + 1}${qs}`} className={btn}>Older<ArrowRight className="size-4" /></Link> : <span className={cn(btn, "pointer-events-none opacity-40")}>Older<ArrowRight className="size-4" /></span>}
    </nav>
  );
}

/** Article header + body. The HTML goes through the same BlogContent renderer as before. */
export function BlogArticle({ post }: { post: PublicBlogDetail }) {
  return (
    <article>
      <header className="relative overflow-clip pb-10 pt-28 md:pb-14 md:pt-36">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_75%_20%,rgba(115,103,240,.14),transparent_70%),linear-gradient(180deg,#FFFFFF_0%,#F8F8FB_90%)]" />
        <GridRunners />
        <div className="relative mx-auto max-w-[860px] px-5">
          <Link href="/blogs" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="size-4" />Back to blog
          </Link>
          {post.categories.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.categories.map((c) => (
                <Link key={c} href={topicHref(c)} className="rounded-full border border-primary/20 bg-white px-3 py-1 text-[12px] font-medium text-primary hover:border-primary/50">{c}</Link>
              ))}
            </div>
          )}
          <h1 className={cn("mt-5 text-[32px] font-black leading-[1.04] tracking-[-0.045em] sm:text-[44px] md:text-[52px]", INK)}>{post.title}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#8E83F5] to-[#5AA8FF] text-[13px] font-bold text-white">
              {post.authorName.trim().charAt(0).toUpperCase() || "I"}
            </span>
            <span className="leading-tight">
              <span className={cn("block text-[14px] font-semibold", INK)}>{post.authorName}</span>
              <Meta post={post} long />
            </span>
          </div>
        </div>
      </header>

      <div className="relative bg-[#F8F8FB] pb-20">
        <div className="mx-auto max-w-[960px] px-3 sm:px-5">
          {post.thumbnailUrl && (
            <div className="relative -mt-2 aspect-[16/9] overflow-hidden rounded-[24px] border border-border shadow-[0_30px_60px_-40px_rgba(30,20,80,.6)]">
              <Image src={post.thumbnailUrl} alt={post.title} fill priority sizes="(max-width: 960px) 100vw, 960px" className="object-cover" />
            </div>
          )}
          <div className="mx-auto mt-8 max-w-[860px] rounded-[28px] border border-border bg-white px-5 py-8 shadow-[0_30px_60px_-44px_rgba(30,20,80,.5)] sm:px-10 sm:py-12">
            {post.excerpt && <p className="mb-8 border-l-2 border-primary pl-4 text-[18px] leading-relaxed text-[#4B5275]">{post.excerpt}</p>}
            <BlogContent html={post.content} />
          </div>
        </div>
      </div>
    </article>
  );
}
