import type {
  JobBoardEmploymentFilter,
  JobBoardWorkMode,
  JobListing,
  JobBoardStateEngagements,
} from "./api";

/** Preference fields used to filter the explore catalog (must match server JobBoardService). */
export type ExplorePrefs = {
  location: string;
  workModes: JobBoardWorkMode[];
  minCtcInr: number;
  employmentType: JobBoardEmploymentFilter;
};

function matchesEmployment(
  jobEmp: "full_time" | "part_time",
  filter: JobBoardEmploymentFilter,
): boolean {
  if (filter === "any") return true;
  return jobEmp === filter;
}

function explorePrefsMatch(job: JobListing, prefs: ExplorePrefs): boolean {
  const loc = (prefs.location || "").trim().toLowerCase();
  if (loc.length > 0) {
    const inText =
      job.location.toLowerCase().includes(loc) ||
      job.company.toLowerCase().includes(loc) ||
      job.title.toLowerCase().includes(loc);
    if (!inText) return false;
  }
  if (job.ctcMaxInr < prefs.minCtcInr) return false;
  if (!prefs.workModes.includes(job.workMode)) return false;
  if (!matchesEmployment(job.employmentType, prefs.employmentType)) return false;
  return true;
}

function scoreForYou(job: JobListing, prefs: { location: string }): number {
  let s = 0;
  const loc = (prefs.location || "").trim().toLowerCase();
  if (loc && job.location.toLowerCase().includes(loc)) s += 3;
  if (job.earlyApplicant) s += 1;
  if (job.isPremium) s += 0.5;
  return s;
}

/**
 * Build the visible list for For you vs Search from a shared catalog (search-tab API order),
 * mirroring interview-core `JobBoardService.filterJobsForTab`.
 */
export function deriveExploreJobsForTab(
  catalog: JobListing[],
  displayTab: "for_you" | "search",
  prefs: ExplorePrefs,
  engagements: JobBoardStateEngagements,
): JobListing[] {
  const list: JobListing[] = [];
  for (const job of catalog) {
    const e = engagements[job.id];
    if (e?.dismissed) continue;
    if (!explorePrefsMatch(job, prefs)) continue;
    list.push(job);
  }
  if (displayTab === "for_you") {
    list.sort(
      (a, b) =>
        scoreForYou(b, prefs) - scoreForYou(a, prefs) || b.ctcMaxInr - a.ctcMaxInr,
    );
  }
  return list;
}

export function mergeExploreCatalogById(
  prev: JobListing[],
  more: JobListing[],
): JobListing[] {
  const seen = new Set(prev.map((j) => j.id));
  const out = [...prev];
  for (const j of more) {
    if (!seen.has(j.id)) {
      seen.add(j.id);
      out.push(j);
    }
  }
  return out;
}
