import { DashboardThemeProvider } from "@/components/dashboard-theme";

/**
 * The live interview room is designed dark (navy panels, white text), so its
 * dialogs and popups are pinned to dark too — no white modals on a dark room.
 */
export default function InterviewLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardThemeProvider forcedTheme="dark">{children}</DashboardThemeProvider>;
}
