import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/app/PageHeader";
import { HubHero } from "@/components/app/HubHero";
import { EmptyState } from "@/components/app/EmptyState";
import { FilterBar } from "@/components/app/FilterBar";
import {
  appStatCard,
  appStatIcon,
  instituteFilterBarClass,
  institutePanelClass,
  institutePrimaryClass,
  instituteSecondaryClass,
  instituteTableShellClass,
} from "@/lib/app-theme";

export {
  institutePrimaryClass,
  instituteSecondaryClass,
  institutePanelClass,
  institutePanelMutedClass,
  instituteTableShellClass,
  instituteFilterBarClass,
} from "@/lib/app-theme";

export { FilterBar as InstituteFilterBar };

export function InstitutePageHeader(
  props: React.ComponentProps<typeof PageHeader>,
) {
  return <PageHeader {...props} />;
}

export function InstituteHero(props: React.ComponentProps<typeof HubHero>) {
  return <HubHero {...props} />;
}

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
  layout?: "vertical" | "horizontal";
  href?: string;
}) {
  const ResolvedIcon = Icon ?? Loader2;
  const shellClass = cn(
    appStatCard,
    href
      ? "group cursor-pointer transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      : "",
  );

  if (layout === "horizontal") {
    const content = (
      <>
        <div className={appStatIcon}>
          <ResolvedIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-primary sm:text-sm">{label}</p>
          <div className="text-xl font-semibold tabular-nums leading-tight text-foreground sm:text-2xl">
            {value}
          </div>
          {footer ? (
            <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </div>
      </>
    );
    if (href) {
      return (
        <Link href={href} className={cn(shellClass, "flex items-center gap-4")}>
          {content}
        </Link>
      );
    }
    return <div className={cn(shellClass, "flex items-center gap-4")}>{content}</div>;
  }

  const verticalContent = (
    <>
      <div className="mb-3">
        <div className={appStatIcon}>
          <ResolvedIcon className="h-5 w-5" />
        </div>
      </div>
      <p className="mb-1 text-xs font-medium text-primary sm:text-sm">{label}</p>
      <div className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
        {value}
      </div>
      {footer ? (
        <div className="mt-2 text-xs text-muted-foreground">{footer}</div>
      ) : null}
    </>
  );

  if (href) {
    return <Link href={href} className={cn(shellClass, "block")}>{verticalContent}</Link>;
  }
  return <div className={cn(shellClass, "block")}>{verticalContent}</div>;
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
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
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
  return (
    <div className={cn(instituteTableShellClass, "overflow-x-auto", className)}>
      {children}
    </div>
  );
}

export function InstituteEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

export function InstituteLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[min(60vh,480px)] items-center justify-center px-4">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
