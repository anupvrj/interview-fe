export type BlogCardTheme = {
  shell: string;
  border: string;
  hoverBorder: string;
  badge: string;
  cta: string;
  glow: string;
};

export const BLOG_CARD_THEMES: BlogCardTheme[] = [
  {
    shell:
      "from-emerald-500/[0.12] via-card to-emerald-400/[0.04] dark:from-emerald-500/20 dark:via-card dark:to-emerald-950/30",
    border: "border-emerald-500/25",
    hoverBorder: "hover:border-emerald-400/55",
    badge: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    cta: "text-emerald-600 group-hover:text-emerald-700 dark:text-emerald-400",
    glow: "hover:shadow-emerald-500/20",
  },
  {
    shell:
      "from-sky-500/[0.12] via-card to-sky-400/[0.04] dark:from-sky-500/20 dark:via-card dark:to-sky-950/30",
    border: "border-sky-500/25",
    hoverBorder: "hover:border-sky-400/55",
    badge: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
    cta: "text-sky-600 group-hover:text-sky-700 dark:text-sky-400",
    glow: "hover:shadow-sky-500/20",
  },
  {
    shell:
      "from-violet-500/[0.12] via-card to-violet-400/[0.04] dark:from-violet-500/20 dark:via-card dark:to-violet-950/30",
    border: "border-violet-500/25",
    hoverBorder: "hover:border-violet-400/55",
    badge: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
    cta: "text-violet-600 group-hover:text-violet-700 dark:text-violet-400",
    glow: "hover:shadow-violet-500/20",
  },
  {
    shell:
      "from-amber-500/[0.12] via-card to-amber-400/[0.04] dark:from-amber-500/20 dark:via-card dark:to-amber-950/30",
    border: "border-amber-500/25",
    hoverBorder: "hover:border-amber-400/55",
    badge: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    cta: "text-amber-600 group-hover:text-amber-700 dark:text-amber-400",
    glow: "hover:shadow-amber-500/20",
  },
  {
    shell:
      "from-rose-500/[0.12] via-card to-rose-400/[0.04] dark:from-rose-500/20 dark:via-card dark:to-rose-950/30",
    border: "border-rose-500/25",
    hoverBorder: "hover:border-rose-400/55",
    badge: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
    cta: "text-rose-600 group-hover:text-rose-700 dark:text-rose-400",
    glow: "hover:shadow-rose-500/20",
  },
];

export function getBlogCardTheme(index: number): BlogCardTheme {
  return BLOG_CARD_THEMES[index % BLOG_CARD_THEMES.length];
}
