"use client";

import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  analyzeSeo,
  scoreColor,
  statusIconColor,
  type SeoAnalysisInput,
} from "@/lib/blog/seo-analyzer";
import { getSiteUrl } from "@/lib/seo/site-url";

interface SeoScoreCardProps {
  readonly input: SeoAnalysisInput;
}

function StatusIcon({ status }: { status: "good" | "warning" | "bad" }) {
  const cls = cn("h-4 w-4 shrink-0", statusIconColor(status));
  if (status === "good") return <CheckCircle2 className={cls} />;
  if (status === "warning") return <AlertCircle className={cls} />;
  return <XCircle className={cls} />;
}

export function SeoScoreCard({ input }: SeoScoreCardProps) {
  const { score, checks } = analyzeSeo(input);
  const siteUrl = getSiteUrl();
  const slug = input.slug || "your-post-slug";
  const serpTitle = input.seoTitle || input.title || "SEO Title Preview";
  const serpDesc = input.metaDescription || input.excerpt || "Meta description preview will appear here.";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">SEO Score</h3>
        <span className={cn("rounded-full px-3 py-1 text-sm font-bold", scoreColor(score))}>
          {score}/100
        </span>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="mb-1 text-xs text-muted-foreground">Google preview</p>
        <p className="truncate text-lg text-[#1a0dab]">{serpTitle}</p>
        <p className="truncate text-sm text-[#006621]">
          {siteUrl}/blogs/{slug}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{serpDesc}</p>
      </div>

      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm">
            <StatusIcon status={c.status} />
            <div>
              <p className="font-medium">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
