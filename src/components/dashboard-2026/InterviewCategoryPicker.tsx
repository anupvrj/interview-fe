"use client";

import { motion, useReducedMotion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Emblem, Mono } from "@/components/marketing-2026/primitives";
import { useDashboardTheme } from "@/components/dashboard-theme";
import { useInterviewCategoriesQuery } from "@/hooks/queries/useInterviewCategoriesQuery";
import { interviewCategoryEmblem, visibleInterviewCategories, type InterviewCategoryId } from "@/lib/interviewCategories";
import { voiceApi } from "@/lib/voiceApi";
import { cn } from "@/lib/utils";
import { EASE, Eyebrow } from "./ui";

/**
 * "PICK A ROUND / What do you want to rehearse?" — the category rounds of the AI
 * interview, laid out like the peer-interview round picker. Renders nothing unless
 * the rounds are enabled for this user.
 */
export function InterviewCategoryPicker({ onPick, disabled }: { onPick: (id: InterviewCategoryId) => void; disabled?: boolean }) {
  const reduce = useReducedMotion();
  const { theme } = useDashboardTheme();
  const { data: catalog } = useInterviewCategoriesQuery();
  const rounds = visibleInterviewCategories(catalog);
  const { data: voices } = useQuery({
    queryKey: ["voice-providers"],
    queryFn: () => voiceApi.listProviders(),
    enabled: rounds.length > 0,
    staleTime: 60_000,
  });
  if (rounds.length === 0) return null;

  const defaultVoice = voices?.providers.find((p) => p.id === voices.defaultProvider) ?? voices?.providers.find((p) => p.enabled);
  const perMinute = defaultVoice?.creditsPerMinute;
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: EASE },
  });

  return (
    <section>
      <div>
        <Eyebrow>PICK A ROUND</Eyebrow>
        <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.035em] text-foreground md:text-[26px]">What do you want to rehearse?</h2>
      </div>
      <div className={cn("mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2", rounds.length % 3 === 0 ? "xl:grid-cols-3" : rounds.length === 5 ? "lg:grid-cols-3 xl:grid-cols-5" : "xl:grid-cols-4")}>
        {rounds.map((r, i) => (
          <motion.div key={r.id} {...rise(0.1 + i * 0.05)}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(r.id)}
              className="group flex h-full w-full flex-col rounded-[18px] border border-border bg-card p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_24px_50px_-30px_rgba(115,103,240,.6)] disabled:pointer-events-none disabled:opacity-60"
            >
              <Emblem kind={interviewCategoryEmblem(r)} tone={theme === "dark" ? "dark" : "light"} />
              <h3 className="mt-4 text-[16px] font-bold tracking-tight text-foreground">{r.name}</h3>
              <p className="mt-1 flex-1 text-[13px] leading-relaxed text-muted-foreground">{r.shortDescription}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <Mono className="text-[11px] text-muted-foreground">
                  {r.defaultDurationMinutes} MIN{perMinute ? ` · ~${perMinute * r.defaultDurationMinutes} CREDITS` : ""}
                </Mono>
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
