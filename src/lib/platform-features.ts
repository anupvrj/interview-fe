export type PlatformFeatureStatus = "disabled" | "enabled" | "live" | "beta";
export type PlatformFeatureCategory = "product" | "voice";

export type PlatformFeature = {
  key: string;
  name: string;
  description: string;
  category: PlatformFeatureCategory;
  status: PlatformFeatureStatus;
  unavailableTitle: string;
  unavailableMessage: string;
  sortOrder: number;
  routePrefixes: string[];
  navHrefs: string[];
  marketingHrefs: string[];
  visible: boolean;
  accessible: boolean;
  builtIn?: boolean;
  credentialReady?: boolean;
  creditsPerMinute?: number;
  isDefaultVoice?: boolean;
  highlightTag?: string;
  highlightStyle?: "popular" | "trending" | "flash" | "new" | "hot";
  allowedDurations?: number[];
  decisionHint?: string;
  updatedAt?: string;
  updatedBy?: string;
};

export type PlatformFeaturePatch = {
  status?: PlatformFeatureStatus;
  name?: string;
  description?: string;
  unavailableTitle?: string;
  unavailableMessage?: string;
  routePrefixes?: string[] | string;
  navHrefs?: string[] | string;
  marketingHrefs?: string[] | string;
  creditsPerMinute?: number;
  isDefaultVoice?: boolean;
  highlightTag?: string;
  highlightStyle?: string;
  allowedDurations?: number[];
  decisionHint?: string;
};

export type CreatePlatformFeatureInput = {
  key?: string;
  name: string;
  description?: string;
  status?: PlatformFeatureStatus;
  unavailableTitle?: string;
  unavailableMessage?: string;
  routePrefixes?: string[] | string;
  navHrefs?: string[] | string;
  marketingHrefs?: string[] | string;
};

/** Stable slug for a feature key, e.g. "Job Board" → "job_board". */
export function slugifyFeatureKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

export function parseFeaturePathText(value: string): string[] {
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const item of value.split(/[\n,]/)) {
    const trimmed = item.trim();
    if (!trimmed.startsWith("/")) continue;
    const path = trimmed.length > 1 ? trimmed.replace(/\/+$/, "") : trimmed;
    if (seen.has(path)) continue;
    seen.add(path);
    paths.push(path);
  }
  return paths;
}

export function uniqueFeaturePaths(feature: PlatformFeature): string[] {
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const path of [
    ...feature.routePrefixes,
    ...feature.navHrefs,
    ...feature.marketingHrefs,
  ]) {
    if (!path || seen.has(path)) continue;
    seen.add(path);
    paths.push(path);
  }
  return paths;
}

export function splitFeatureControlPaths(paths: string[]): {
  routePrefixes: string[];
  navHrefs: string[];
  marketingHrefs: string[];
} {
  return {
    routePrefixes: paths,
    navHrefs: paths.filter((path) => path.startsWith("/dashboard")),
    marketingHrefs: paths.filter((path) => !path.startsWith("/dashboard")),
  };
}

export function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function matchFeatureForPath(
  features: PlatformFeature[],
  pathname: string,
): PlatformFeature | null {
  let best: { feature: PlatformFeature; len: number } | null = null;
  for (const feature of features) {
    const prefixes = [
      ...feature.routePrefixes,
      ...feature.navHrefs,
      ...feature.marketingHrefs,
    ];
    for (const prefix of prefixes) {
      if (!prefix) continue;
      if (pathMatchesPrefix(pathname, prefix)) {
        if (!best || prefix.length > best.len) {
          best = { feature, len: prefix.length };
        }
      }
    }
  }
  return best?.feature ?? null;
}

export function isFeatureHrefVisible(
  features: PlatformFeature[] | undefined,
  href: string,
  featureKey?: string,
): boolean {
  if (!features) return true;
  const matched = matchFeatureForPath(features, href);
  if (matched) return matched.visible !== false;
  if (featureKey) {
    const byKey = features.find((feature) => feature.key === featureKey);
    if (byKey) return byKey.visible !== false;
  }
  return true;
}

export function isFeatureVisibleForActiveRole(
  status: PlatformFeatureStatus,
  category: PlatformFeatureCategory,
  activeRole: string | null | undefined,
): boolean {
  if (!activeRole || activeRole === "super_admin") return true;
  if (status === "disabled") return false;
  if (activeRole === "institution_admin") {
    return status === "enabled" || status === "live" || status === "beta";
  }
  if (category === "voice") return status === "live" || status === "beta";
  return status === "live";
}

export function isFeatureAccessibleForActiveRole(
  status: PlatformFeatureStatus,
  category: PlatformFeatureCategory,
  activeRole: string | null | undefined,
): boolean {
  if (!activeRole || activeRole === "super_admin") return true;
  if (status === "disabled") return false;
  if (activeRole === "institution_admin") {
    return status === "enabled" || status === "live" || status === "beta";
  }
  return status === "live" || status === "beta";
}
