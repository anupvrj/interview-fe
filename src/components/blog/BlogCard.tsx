import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Newspaper } from "lucide-react";
import type { PublicBlogListItem } from "@/lib/api";
import { getBlogCardTheme } from "@/lib/blog/card-themes";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  readonly post: PublicBlogListItem;
  readonly index: number;
}

export function BlogCard({ post, index }: BlogCardProps) {
  const theme = getBlogCardTheme(index);
  const published = new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/blogs/${post.slug}`}
      className={cn(
        "group relative isolate flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-gradient-to-br shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl",
        theme.shell,
        theme.border,
        theme.hoverBorder,
        theme.glow,
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <CardThumbnailPlaceholder themeIndex={index} />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {post.categories.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", theme.badge)}
            >
              {cat}
            </span>
          ))}
        </div>

        <h2 className="line-clamp-2 break-words text-lg font-semibold leading-snug text-foreground sm:text-xl">
          {post.title}
        </h2>

        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <time dateTime={post.publishedAt}>{published}</time>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {post.readingTimeMinutes} min
          </span>
        </div>

        <span
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-sm font-medium",
            theme.cta,
          )}
        >
          Read article
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function CardThumbnailPlaceholder({ themeIndex }: Readonly<{ themeIndex: number }>) {
  const accents = [
    "from-emerald-500/20 to-emerald-950/5",
    "from-sky-500/20 to-sky-950/5",
    "from-violet-500/20 to-violet-950/5",
    "from-amber-500/20 to-amber-950/5",
    "from-rose-500/20 to-rose-950/5",
  ];
  const accent = accents[themeIndex % accents.length];

  return (
    <div
      className={cn(
        "flex h-full min-h-[160px] flex-col items-center justify-center gap-2 bg-gradient-to-br",
        accent,
      )}
    >
      <Newspaper className="h-8 w-8 text-muted-foreground/70" aria-hidden />
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
        Interview Trix
      </span>
    </div>
  );
}
