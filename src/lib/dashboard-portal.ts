"use client";

import { useLayoutEffect, useState } from "react";

export const DASHBOARD_THEME_ROOT_ID = "dashboard-theme-root";

export function getDashboardPortalContainer(): HTMLElement | undefined {
  if (typeof document === "undefined") return undefined;
  return document.getElementById(DASHBOARD_THEME_ROOT_ID) ?? undefined;
}

export function isDashboardDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.getElementById(DASHBOARD_THEME_ROOT_ID)?.classList.contains("dark") ?? false;
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

/** Apply on portaled UI (dialogs, selects) so CSS variables match dashboard dark mode. */
export function useDashboardDarkClass(): "" | "dark" {
  const [darkClass, setDarkClass] = useState<"" | "dark">(() =>
    isDashboardDarkMode() ? "dark" : "",
  );

  useLayoutEffect(() => {
    const root = document.getElementById(DASHBOARD_THEME_ROOT_ID);
    if (!root) {
      setDarkClass("");
      return;
    }

    const sync = () => {
      setDarkClass(root.classList.contains("dark") ? "dark" : "");
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return darkClass;
}
