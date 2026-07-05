"use client";

import { Toaster } from "sonner";
import { useDashboardTheme } from "@/components/dashboard-theme";

export function DashboardToaster() {
  const { theme } = useDashboardTheme();
  const isDark = theme === "dark";

  return (
    <Toaster
      position="top-right"
      theme={isDark ? "dark" : "light"}
      toastOptions={{
        classNames: {
          toast:
            "group toast border-border bg-card text-foreground shadow-header",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      richColors
    />
  );
}
