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
/** Set once the person flips the theme themselves; the hackathon default never overrides that. */
const USER_CHOICE_KEY = "interviewtrix-dashboard-theme-chosen";

function readStoredTheme(): DashboardTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s === "light" || s === "dark" ? s : null;
  } catch {
    return null;
  }
}

function rememberUserChoice(t: DashboardTheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, t);
    localStorage.setItem(USER_CHOICE_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Visiting any hackathon page switches the logged-in app to dark so the resume builder,
 * interviews and dashboard match the hackathon's look — unless the person already picked
 * a theme with the toggle.
 */
export function adoptHackathonDarkTheme(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(USER_CHOICE_KEY) === "1") return;
    // A stored theme from before the "chosen" flag existed was set by the toggle too.
    if (localStorage.getItem(STORAGE_KEY)) return;
    localStorage.setItem(STORAGE_KEY, "dark");
  } catch {
    /* ignore */
  }
}

/** Call from hackathon pages (landing, dashboard, signup). */
export function useAdoptHackathonDarkTheme(): void {
  useEffect(() => {
    adoptHackathonDarkTheme();
  }, []);
}

/**
 * Inline <head>/<body> script for the dashboard layout: applies the saved dark theme
 * before first paint, so there is no flash of the light theme on a full page load.
 */
export const DASHBOARD_THEME_BOOT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})==="dark"){document.documentElement.classList.add("dark")}}catch(e){}`;

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
  // Start "light" to match the server render (no hydration mismatch); the effect below
  // applies the saved theme right after mount, and the boot script avoids a flash on full loads.
  const [storedTheme, setThemeState] = useState<DashboardTheme>("light");
  const theme = forcedTheme ?? storedTheme;

  useEffect(() => {
    if (forcedTheme) return;
    const s = readStoredTheme();
    if (s) setThemeState(s);
  }, [forcedTheme]);

  const setTheme = useCallback((t: DashboardTheme) => {
    setThemeState(t);
    rememberUserChoice(t);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: DashboardTheme = prev === "dark" ? "light" : "dark";
      rememberUserChoice(next);
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
            ? "dark min-h-screen w-full max-w-full overflow-x-hidden supports-[overflow:clip]:overflow-x-clip bg-background text-foreground"
            : "min-h-screen w-full max-w-full overflow-x-hidden supports-[overflow:clip]:overflow-x-clip bg-background text-foreground"
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
