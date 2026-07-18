import type { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function FormSection({
  icon: Icon,
  title,
  description,
  children,
  className,
}: Readonly<{
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7367F0]/10 text-[#7367F0]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function StepBlock({
  title,
  description,
  children,
  className,
}: Readonly<{
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function FormField({
  label,
  htmlFor,
  hint,
  optional,
  className,
  children,
}: Readonly<{
  label: string;
  htmlFor?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}>) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-muted-foreground/80">(optional)</span>
        ) : null}
      </Label>
      {children}
      {hint ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export const onboardingControlClass =
  "h-11 w-full rounded-[0.625rem] border-border/60 bg-card text-sm shadow-sm sm:h-12";
