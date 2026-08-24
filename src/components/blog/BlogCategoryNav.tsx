import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BlogCategoryNavProps = {
  readonly categories: string[];
  readonly activeCategory?: string;
};

export function BlogCategoryNav({
  categories,
  activeCategory,
}: BlogCategoryNavProps) {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Blog categories"
      className="border-b border-border/80 bg-background/80 py-4 backdrop-blur-md lg:sticky lg:top-[4.25rem] lg:z-30"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryPill href="/blogs" active={!activeCategory}>
            All topics
          </CategoryPill>
          {categories.map((cat) => (
            <CategoryPill
              key={cat}
              href={`/blogs?category=${encodeURIComponent(cat)}`}
              active={activeCategory === cat}
            >
              {cat}
            </CategoryPill>
          ))}
        </div>
      </div>
    </nav>
  );
}

function CategoryPill({
  href,
  active,
  children,
}: Readonly<{
  href: string;
  active: boolean;
  children: ReactNode;
}>) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
