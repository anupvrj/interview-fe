"use client";

import { parseCodingProblemStatement } from "@/lib/coding-problem-statement";
import { cn } from "@/lib/utils";

type StatementVariant = "default" | "dark" | "admin";

const variantClasses: Record<
  StatementVariant,
  { text: string; image: string }
> = {
  default: {
    text: "text-foreground",
    image: "border-border bg-muted/30",
  },
  dark: {
    text: "text-gray-200",
    image: "border-white/10 bg-black/20",
  },
  admin: {
    text: "text-[#d1d5db]",
    image: "border-[#3a3a3a] bg-[#1f1f1f]",
  },
};

interface CodingProblemStatementProps {
  readonly statement: string;
  readonly className?: string;
  readonly variant?: StatementVariant;
}

export function CodingProblemStatement({
  statement,
  className,
  variant = "default",
}: CodingProblemStatementProps) {
  const blocks = parseCodingProblemStatement(statement);
  const styles = variantClasses[variant];

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4 text-sm leading-relaxed", className)}>
      {blocks.map((block, index) => {
        if (block.type === "text") {
          if (!block.content.trim()) return null;
          return (
            <div
              key={`text-${index}`}
              className={cn("whitespace-pre-wrap", styles.text)}
            >
              {block.content}
            </div>
          );
        }

        return (
          <figure
            key={`image-${index}-${block.url}`}
            className="my-2 flex flex-col items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.url}
              alt={block.alt ?? "Problem diagram"}
              loading="lazy"
              className={cn(
                "max-h-72 w-auto max-w-full rounded-lg border object-contain p-2",
                styles.image,
              )}
            />
          </figure>
        );
      })}
    </div>
  );
}
