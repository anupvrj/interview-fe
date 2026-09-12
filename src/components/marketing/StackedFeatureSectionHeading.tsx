"use client";

import { cn } from "@/lib/utils";

type StackedFeatureSectionHeadingProps = {
  title: string;
  variant?: "sticky" | "static";
};

function renderDisplayTitle(title: string) {
  const match = /^(.*?)(\bWeek\b)(.*)$/i.exec(title);
  if (!match) return title;

  const [, before, week, after] = match;
  const beforeTrimmed = before.trimEnd();

  return (
    <>
      {beforeTrimmed}{" "}
      <span className="stacked-feature-heading-emphasis">{week}</span>
      {after}
    </>
  );
}

export function StackedFeatureSectionHeading({
  title,
  variant = "sticky",
}: StackedFeatureSectionHeadingProps) {
  return (
    <header
      className={cn(
        "stacked-feature-heading",
        variant === "static" && "stacked-feature-heading--static",
      )}
    >
      <h2 id="get-hired-week-heading" className="stacked-feature-heading-title">
        {renderDisplayTitle(title)}
      </h2>
    </header>
  );
}
