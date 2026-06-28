"use client";

import { useLayoutEffect, useState } from "react";

export const DASHBOARD_THEME_ROOT_ID = "dashboard-theme-root";

export function getDashboardPortalContainer(): HTMLElement | undefined {
  if (typeof document === "undefined") return undefined;
  return document.getElementById(DASHBOARD_THEME_ROOT_ID) ?? undefined;
}

/** Portal target inside the dashboard theme wrapper so menus inherit light/dark tokens. */
export function useDashboardPortalContainer(): HTMLElement | undefined {
  const [container, setContainer] = useState<HTMLElement | undefined>(() =>
    getDashboardPortalContainer(),
  );

  useLayoutEffect(() => {
    setContainer(getDashboardPortalContainer());
  }, []);

  return container;
}
