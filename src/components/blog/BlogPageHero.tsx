import { BookOpen, Sparkles } from "lucide-react";
import { appMarketingSectionLight } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

type BlogPageHeroProps = {
  readonly totalPosts: number;
  readonly topicCount: number;
  readonly activeCategory?: string;
};

export function BlogPageHero({
  totalPosts,
  topicCount,
  activeCategory,
}: BlogPageHeroProps) {
  return (
    <section
      className={cn(
        appMarketingSectionLight,
        "relative overflow-x-clip px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:pb-14 lg:pt-12",
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/3 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-12 h-64 w-64 translate-x-1/4 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-48 w-[min(100%,42rem)] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.07) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Interview Trix Blog
          </span>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            {activeCategory ? (
              <>
                Guides on{" "}
                <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                  {activeCategory}
                </span>
              </>
            ) : (
              <>
                Smarter prep for the{" "}
                <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                  AI hiring era
                </span>
              </>
            )}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {activeCategory
              ? `Articles, playbooks, and practical tips on ${activeCategory.toLowerCase()}—written for candidates navigating ATS filters, AI screeners, and real interviews in 2026.`
              : "Resume strategy, job search tactics, coding and system design prep, and career advice—so you can land interviews and perform when it counts."}
          </p>

          <dl className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm shadow-sm backdrop-blur-sm">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden />
              <dt className="sr-only">Published articles</dt>
              <dd className="font-medium text-foreground">
                {totalPosts} {totalPosts === 1 ? "article" : "articles"}
              </dd>
            </div>
            {topicCount > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm shadow-sm backdrop-blur-sm">
                <dt className="sr-only">Topics</dt>
                <dd className="text-muted-foreground">
                  <span className="font-medium text-foreground">{topicCount}</span>{" "}
                  {topicCount === 1 ? "topic" : "topics"}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </section>
  );
}
