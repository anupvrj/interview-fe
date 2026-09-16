"use client";

import { useEffect } from "react";
import { returnToExtensionJobTab } from "@/lib/extension-resume-sync";

export const EXTENSION_CONNECTED_RETURN_KEY =
  "interviewtrix.extensionConnectedReturn";

/**
 * After Connect + OAuth, the handshake tab does a full load of /dashboard so
 * Clerk remounts the header as signed-in. Then switch back to the job tab
 * without closing this one.
 */
export function ExtensionConnectReturn() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(EXTENSION_CONNECTED_RETURN_KEY) !== "1") {
        return;
      }
      sessionStorage.removeItem(EXTENSION_CONNECTED_RETURN_KEY);
    } catch {
      return;
    }

    const timer = window.setTimeout(() => {
      void returnToExtensionJobTab(2500);
    }, 900);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
