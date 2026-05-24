import type { ReactNode } from "react";
import Link from "next/link";
import { InterviewTrixLogo } from "@/components/InterviewTrixLogo";
import { cn } from "@/lib/utils";

export function AuthCardLayout({
  children,
  title,
  subtitle,
  footer,
  className,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-[12%] h-48 w-48 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[10%] right-[10%] h-56 w-56 rounded-full bg-primary/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[20%] top-[18%] h-24 w-24 rotate-12 rounded-2xl bg-primary/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[22%] left-[15%] h-16 w-16 -rotate-6 rounded-xl bg-primary/10"
      />

      <div className={cn("relative w-full max-w-[440px]", className)}>
        <div className="mb-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex transition-opacity hover:opacity-80"
          >
            <InterviewTrixLogo
              variant="onLightBg"
              className="h-9 w-auto sm:h-10"
              priority
            />
          </Link>
        </div>

        <div className="overflow-visible rounded-xl border border-border bg-card px-6 py-8 shadow-header sm:px-10 sm:py-10">
          {(title || subtitle) && (
            <div className="mb-8 space-y-2 text-center">
              {title ? (
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {subtitle}
                </p>
              ) : null}
            </div>
          )}

          <div className="auth-clerk-root overflow-visible">{children}</div>
        </div>

        {footer ? (
          <div className="mt-8 space-y-1 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
