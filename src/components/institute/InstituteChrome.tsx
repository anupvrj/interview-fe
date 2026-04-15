import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Primary CTA — matches interviews / DashboardLayout */
export const institutePrimaryClass =
  "!bg-[rgb(37,99,235)] hover:!bg-[rgb(17,24,39)] text-white shadow-md hover:shadow-lg transition-all";

export const instituteSecondaryClass =
  "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900 shadow-sm";

export const institutePanelClass =
  "rounded-xl border border-blue-200/50 bg-white shadow-lg shadow-blue-500/10 backdrop-blur-sm";

export const institutePanelMutedClass =
  "rounded-xl border border-slate-200/90 bg-white shadow-sm";

export const instituteTableShellClass =
  "overflow-hidden rounded-xl border border-blue-200/40 bg-white shadow-md shadow-blue-500/5";

export const instituteFilterBarClass =
  "rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/90 to-white p-4 shadow-sm";

export function InstitutePageHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: string;
  description?: ReactNode;
  badge?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        {badge ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-[rgb(37,99,235)]">
            {badge}
          </span>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function InstituteHero({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-blue-100/90 bg-gradient-to-br from-blue-50 via-white to-slate-50/90 p-6 shadow-sm sm:p-8",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-400/10 blur-3xl" />
      <div className="relative">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgb(37,99,235)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}

const instituteStatCardShellClass =
  "rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg shadow-blue-500/10 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/15";

const instituteStatCardIconWrapClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(37,99,235)] to-blue-600 shadow-lg shadow-blue-500/25 ring-2 ring-blue-200/50";

export function InstituteStatCard({
  icon: Icon,
  label,
  value,
  footer,
  layout = "vertical",
  href,
}: {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  footer?: ReactNode;
  /** `horizontal`: icon left, label/value/footer right — shorter on the page */
  layout?: "vertical" | "horizontal";
  href?: string;
}) {
  const ResolvedIcon = Icon ?? Loader2;
  const shellClass = cn(
    instituteStatCardShellClass,
    href
      ? "group cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      : "",
  );

  if (layout === "horizontal") {
    const content = (
      <>
        <div className={instituteStatCardIconWrapClass}>
          <ResolvedIcon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[rgb(37,99,235)] sm:text-sm">{label}</p>
          <div className="text-xl font-bold tabular-nums leading-tight text-slate-900 sm:text-2xl">
            {value}
          </div>
          {footer ? <div className="mt-0.5 text-xs leading-snug text-slate-600">{footer}</div> : null}
        </div>
      </>
    );

    if (href) {
      return (
        <Link href={href} className={cn(shellClass, "flex items-center gap-4 p-4")}>
          {content}
        </Link>
      );
    }

    return (
      <div className={cn(shellClass, "flex items-center gap-4 p-4")}>
        {content}
      </div>
    );
  }

  const verticalContent = (
    <>
      <div className="mb-3 flex items-start justify-between">
        <div className={instituteStatCardIconWrapClass}>
          <ResolvedIcon className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className="mb-1 text-xs font-bold text-[rgb(37,99,235)] sm:text-sm">{label}</p>
      <div className="text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">{value}</div>
      {footer ? <div className="mt-2 text-xs text-slate-600">{footer}</div> : null}
    </>
  );

  if (href) {
    return <Link href={href} className={cn(shellClass, "block p-5")}>{verticalContent}</Link>;
  }

  return (
    <div className={cn(shellClass, "p-5")}>
      {verticalContent}
    </div>
  );
}

export function InstituteSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function InstituteTableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(instituteTableShellClass, "overflow-x-auto", className)}>{children}</div>;
}

export function InstituteEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        institutePanelClass,
        "flex flex-col items-center justify-center px-6 py-14 text-center"
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-inner">
        <Icon className="h-8 w-8 text-[rgb(37,99,235)]" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function InstituteLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[min(60vh,480px)] items-center justify-center px-4">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-[rgb(37,99,235)]" />
        <p className="mt-3 text-sm text-slate-600">{label}</p>
      </div>
    </div>
  );
}
