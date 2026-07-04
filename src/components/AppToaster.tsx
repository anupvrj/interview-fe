"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";

/** Root toasts for marketing/public routes; dashboard uses DashboardToaster instead. */
export function AppToaster() {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: "sonner-toast",
      }}
      richColors
    />
  );
}
