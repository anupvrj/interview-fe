"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type DashboardTheme = "light" | "dark";

const STORAGE_KEY = "interviewtrix-dashboard-theme";

type DashboardThemeContextValue = {
  theme: DashboardTheme;
  setTheme: (t: DashboardTheme) => void;
  toggle: () => void;
};

const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(
  null,
);

/**
 * Scopes Tailwind `dark:` styles to the dashboard by wrapping children in a
 * `.dark` container, and mirrors it on `documentElement` only while mounted so
 * portalled dialogs follow the theme (marketing routes keep their own look).
 */
export function DashboardThemeProvider({
  children,
  forcedTheme,
}: Readonly<{
  children: React.ReactNode;
  /** Pin a theme for a route whose own design is one mode (the live interview room is dark). */
  forcedTheme?: DashboardTheme;
}>) {
  const [storedTheme, setThemeState] = useState<DashboardTheme>("light");
  const theme = forcedTheme ?? storedTheme;

  useEffect(() => {
    if (forcedTheme) return;
    try {
      const s = localStorage.getItem(STORAGE_KEY) as DashboardTheme | null;
      if (s === "light" || s === "dark") setThemeState(s);
    } catch {
      /* ignore */
    }
  }, [forcedTheme]);

  const setTheme = useCallback((t: DashboardTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: DashboardTheme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Dialogs, popovers and toasts render in portals under <body>, outside the
  // wrapper below, so they missed the dark variables and stayed light. Mirror
  // the theme on <html> while this provider is mounted; unmounting (e.g. going
  // to a marketing route) removes it, so those pages keep their own look.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    return () => root.classList.remove("dark");
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  );

  return (
    <DashboardThemeContext.Provider value={value}>
      <div
        id="dashboard-theme-root"
        className={
          theme === "dark"
            ? "dark min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground"
            : "min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground"
        }
        suppressHydrationWarning
      >
        {children}
      </div>
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) {
    throw new Error(
      "useDashboardTheme must be used within DashboardThemeProvider",
    );
  }
  return ctx;
}
