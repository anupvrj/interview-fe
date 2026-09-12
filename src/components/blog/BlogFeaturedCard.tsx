import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import type { PublicBlogListItem } from "@/lib/api";
import { cn } from "@/lib/utils";

type BlogFeaturedCardProps = {
  readonly post: PublicBlogListItem;
};

export function BlogFeaturedCard({ post }: BlogFeaturedCardProps) {
  const published = new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="group relative isolate flex flex-col overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-indigo-500/[0.06] shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/10 lg:min-w-0 lg:flex-row"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted lg:aspect-auto lg:min-h-[280px] lg:w-[46%]">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 540px"
            priority
          />
        ) : (
          <FeaturedPlaceholder />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
          Featured
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center p-6 sm:p-8 lg:p-10">
        <div className="mb-3 flex flex-wrap gap-2">
          {post.categories.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {cat}
            </span>
          ))}
        </div>

        <h2 className="break-words text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl">
          {post.title}
        </h2>

        <p className="mt-3 line-clamp-3 text-base leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <time dateTime={post.publishedAt}>{published}</time>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" aria-hidden />
            {post.readingTimeMinutes} min read
          </span>
        </div>

        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          Read featured article
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function FeaturedPlaceholder() {
  return (
    <div
      className={cn(
        "flex h-full min-h-[220px] flex-col items-center justify-center gap-2",
        "bg-gradient-to-br from-primary/15 via-muted to-indigo-500/10",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <span className="text-lg font-bold">IT</span>
      </div>
      <span className="text-sm font-medium text-muted-foreground">
        Interview Trix
      </span>
    </div>
  );
}
