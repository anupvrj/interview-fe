"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveSuperAdminPage } from "@/lib/super-admin-nav";
import { cn } from "@/lib/utils";

export function SuperAdminPageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
  hideBack = false,
}: Readonly<{
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string | null;
  backLabel?: string;
  hideBack?: boolean;
}>) {
  const pathname = usePathname();
  const page = resolveSuperAdminPage(pathname);
  const Icon = page.icon;
  const resolvedTitle = title ?? page.title;
  const resolvedDescription = description ?? page.description;
  let resolvedBackHref: string | undefined;
  if (!hideBack) {
    resolvedBackHref = backHref === null ? undefined : (backHref ?? page.backHref);
  }
  const resolvedBackLabel = backLabel ?? page.backLabel ?? "Back";

  return (
    <section className="relative overflow-hidden rounded-xl border border-[#7367F0]/12 bg-[#7367F0]/[0.04] px-4 py-4 sm:px-5">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-[#7367F0]"
      />
      <div className="relative flex min-w-0 flex-col gap-4 pl-1">
        {resolvedBackHref ? (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 h-8 w-fit gap-1 px-2 text-muted-foreground hover:text-foreground"
          >
            <Link href={resolvedBackHref}>
              <ArrowLeft className="h-4 w-4" />
              {resolvedBackLabel}
            </Link>
          </Button>
        ) : null}

        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11",
                page.accent.iconBg,
                page.accent.iconText,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7367F0]">
                {page.group}
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {resolvedTitle}
              </h1>
              {resolvedDescription ? (
                <div className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {typeof resolvedDescription === "string" ? (
                    <p>{resolvedDescription}</p>
                  ) : (
                    resolvedDescription
                  )}
                </div>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
