"use client";

import { createContext, useContext } from "react";
import type { ATSCheckResult, ATSIssue } from "@/types/atsReport";

export interface ATSIssueMagicContextValue {
  enabled: boolean;
  /** AI rewrites need somewhere to apply them; the report page only sets findings aside. */
  rewriteEnabled: boolean;
  resumeId?: string;
  onApplyFix?: (original: string, improved: string) => boolean;
  onIgnoreIssue?: (
    check: ATSCheckResult,
    issue: ATSIssue,
  ) => void | Promise<void>;
}

const ATSIssueMagicContext = createContext<ATSIssueMagicContextValue>({
  enabled: false,
  rewriteEnabled: false,
});

export function ATSIssueMagicProvider({
  children,
  resumeId,
  rewriteEnabled = true,
  onApplyFix,
  onIgnoreIssue,
}: {
  children: React.ReactNode;
  resumeId?: string;
  rewriteEnabled?: boolean;
  onApplyFix?: (original: string, improved: string) => boolean;
  onIgnoreIssue?: (
    check: ATSCheckResult,
    issue: ATSIssue,
  ) => void | Promise<void>;
}) {
  return (
    <ATSIssueMagicContext.Provider
      value={{
        enabled: !!resumeId,
        rewriteEnabled: !!resumeId && rewriteEnabled,
        resumeId,
        onApplyFix,
        onIgnoreIssue,
      }}
    >
      {children}
    </ATSIssueMagicContext.Provider>
  );
}

export function useATSIssueMagic() {
  return useContext(ATSIssueMagicContext);
}
