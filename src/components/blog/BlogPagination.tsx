import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type BlogPaginationProps = {
  readonly page: number;
  readonly totalPages: number;
  readonly category?: string;
};

export function BlogPagination({
  page,
  totalPages,
  category,
}: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  const categoryQs = category ? `&category=${encodeURIComponent(category)}` : "";

  return (
    <nav
      aria-label="Blog pagination"
      className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
      </p>

      <div className="flex items-center gap-2">
        {page > 1 ? (
          <PaginationLink href={`/blogs?page=${page - 1}${categoryQs}`}>
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
            Previous
          </PaginationLink>
        ) : (
          <span className="inline-flex h-10 items-center rounded-lg border border-transparent px-4 text-sm text-muted-foreground/50">
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
            Previous
          </span>
        )}

        {page < totalPages ? (
          <PaginationLink href={`/blogs?page=${page + 1}${categoryQs}`}>
            Next
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </PaginationLink>
        ) : (
          <span className="inline-flex h-10 items-center rounded-lg border border-transparent px-4 text-sm text-muted-foreground/50">
            Next
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}

function PaginationLink({
  href,
  children,
}: Readonly<{ href: string; children: ReactNode }>) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm",
        "transition-colors hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      {children}
    </Link>
  );
}
