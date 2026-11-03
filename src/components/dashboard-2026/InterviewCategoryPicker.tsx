"use client";

import { motion, useReducedMotion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Emblem, Mono, type EmblemKind } from "@/components/marketing-2026/primitives";
import { useDashboardTheme } from "@/components/dashboard-theme";
import { useInterviewCategoriesQuery } from "@/hooks/queries/useInterviewCategoriesQuery";
import { interviewCategoryEmblem, visibleInterviewCategories, type InterviewCategoryId } from "@/lib/interviewCategories";
import { voiceApi } from "@/lib/voiceApi";
import { cn } from "@/lib/utils";
import { EASE, Eyebrow } from "./ui";

/**
 * Rows of three wide cards, like the peer-interview grid; a short last row stretches to fill
 * the width instead of leaving an empty slot.
 */
function cardSpan(index: number, count: number): string {
  const rest = count % 3;
  const inLastRow = index >= count - rest;
  const xl = !inLastRow || rest === 0 ? "xl:col-span-2" : rest === 2 ? "xl:col-span-3" : "xl:col-span-6";
  return cn(xl, count % 2 === 1 && index === count - 1 && "sm:col-span-2");
}

/** Another interview format shown as a card in the same grid (the dashboard lists every format). */
export interface ExtraRoundCard {
  key: string;
  emblem: EmblemKind;
  title: string;
  description: string;
  /** Mono footer, e.g. "60 MIN". */
  meta: string;
  onClick: () => void;
  /** Before the AI rounds instead of after them. */
  first?: boolean;
}

type Card = { key: string; emblem: EmblemKind; title: string; description: string; meta: string; onClick: () => void };

/**
 * "PICK A ROUND / What do you want to rehearse?" — the category rounds of the AI interview,
 * laid out like the peer-interview round picker (or rows of four with other formats added, on
 * the dashboard). Renders nothing when there is no card to show.
 */
export function InterviewCategoryPicker({
  onPick,
  disabled,
  id,
  className,
  hideHeading,
  extraRounds = [],
  layout = "rows-of-3",
  showAiRounds = true,
}: {
  onPick: (id: InterviewCategoryId) => void;
  disabled?: boolean;
  /** Anchor for buttons that scroll here ("Start an interview" when the all-in-one round is off). */
  id?: string;
  className?: string;
  /** The page already asks the question (the setup page's header). */
  hideHeading?: boolean;
  extraRounds?: ExtraRoundCard[];
  /** "rows-of-4": four per row on desktop, one on phones (the dashboard). */
  layout?: "rows-of-3" | "rows-of-4";
  /** False when AI interviews are switched off: only the extra formats show. */
  showAiRounds?: boolean;
}) {
  const reduce = useReducedMotion();
  const { theme } = useDashboardTheme();
  const { data: catalog } = useInterviewCategoriesQuery();
  const rounds = showAiRounds ? visibleInterviewCategories(catalog) : [];
  const { data: voices } = useQuery({
    queryKey: ["voice-providers"],
    queryFn: () => voiceApi.listProviders(),
    enabled: rounds.length > 0,
    staleTime: 60_000,
  });
  const defaultVoice = voices?.providers.find((p) => p.id === voices.defaultProvider) ?? voices?.providers.find((p) => p.enabled);
  const perMinute = defaultVoice?.creditsPerMinute;
  const cards: Card[] = [
    ...extraRounds.filter((c) => c.first),
    ...rounds.map((r) => ({
      key: r.id,
      emblem: interviewCategoryEmblem(r),
      title: r.name,
      description: r.shortDescription,
      meta: `${r.defaultDurationMinutes} MIN${perMinute ? ` · ~${perMinute * r.defaultDurationMinutes} CREDITS` : ""}`,
      onClick: () => onPick(r.id),
    })),
    ...extraRounds.filter((c) => !c.first),
  ];
  if (cards.length === 0) return null;

  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: EASE },
  });
  const rowsOf4 = layout === "rows-of-4";

  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      {hideHeading ? null : (
        <div>
          <Eyebrow>PICK A ROUND</Eyebrow>
          <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.035em] text-foreground md:text-[26px]">What do you want to rehearse?</h2>
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", rowsOf4 ? "xl:grid-cols-4" : "xl:grid-cols-6", !hideHeading && "mt-4")}>
        {cards.map((c, i) => (
          <motion.div key={c.key} {...rise(0.1 + i * 0.05)} className={rowsOf4 ? undefined : cardSpan(i, cards.length)}>
            <button
              type="button"
              disabled={disabled}
              onClick={c.onClick}
              className="group flex h-full w-full flex-col rounded-[18px] border border-border bg-card p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_24px_50px_-30px_rgba(115,103,240,.6)] disabled:pointer-events-none disabled:opacity-60"
            >
              <Emblem kind={c.emblem} tone={theme === "dark" ? "dark" : "light"} />
              <h3 className="mt-4 text-[16px] font-bold tracking-tight text-foreground">{c.title}</h3>
              <p className="mt-1 flex-1 text-[13px] leading-relaxed text-muted-foreground">{c.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <Mono className="text-[11px] text-muted-foreground">{c.meta}</Mono>
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
