"use client";

import { createContext, useContext } from "react";
import type { ATSCheckResult, ATSIssue } from "@/types/atsReport";

export interface ATSIssueMagicContextValue {
  enabled: boolean;
  resumeId?: string;
  onApplyFix?: (original: string, improved: string) => boolean;
  onIgnoreIssue?: (
    check: ATSCheckResult,
    issue: ATSIssue,
  ) => void | Promise<void>;
}

const ATSIssueMagicContext = createContext<ATSIssueMagicContextValue>({
  enabled: false,
});

export function ATSIssueMagicProvider({
  children,
  resumeId,
  onApplyFix,
  onIgnoreIssue,
}: {
  children: React.ReactNode;
  resumeId?: string;
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
