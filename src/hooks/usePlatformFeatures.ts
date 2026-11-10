import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { configApi } from "@/lib/api";
import {
  isFeatureHrefVisible,
  matchFeatureForPath,
  type PlatformFeature,
} from "@/lib/platform-features";

export const PLATFORM_FEATURES_QUERY_KEY = ["platform-features"] as const;

export function usePlatformFeatures() {
  const query = useQuery({
    queryKey: PLATFORM_FEATURES_QUERY_KEY,
    queryFn: configApi.getFeatures,
    staleTime: 30_000,
  });

  // The server never has the flags, so the first browser render must not use cached ones either.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const data = hydrated ? query.data : undefined;
  const features = data ?? [];
  const byKey = useMemo(() => {
    const map = new Map<string, PlatformFeature>();
    for (const feature of features) map.set(feature.key, feature);
    return map;
  }, [features]);

  const isVisible = (key: string) => {
    if (!data) return true;
    return byKey.get(key)?.visible !== false;
  };

  const isAccessible = (key: string) => {
    if (!data) return true;
    return byKey.get(key)?.accessible !== false;
  };

  const isNavHrefVisible = (href: string, featureKey?: string) => {
    if (!data) return true;
    return isFeatureHrefVisible(features, href, featureKey);
  };

  const matchPath = (pathname: string | null): PlatformFeature | null => {
    if (!pathname) return null;
    return matchFeatureForPath(features, pathname);
  };

  return {
    features,
    byKey,
    isLoading: query.isLoading,
    isVisible,
    isAccessible,
    isNavHrefVisible,
    matchPath,
  };
}
