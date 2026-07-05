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
 * `.dark` container (does not set `class="dark"` on `documentElement`, so
 * marketing routes keep their own backgrounds).
 */
export function DashboardThemeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, setThemeState] = useState<DashboardTheme>("light");

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY) as DashboardTheme | null;
      if (s === "light" || s === "dark") setThemeState(s);
    } catch {
      /* ignore */
    }
  }, []);

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
