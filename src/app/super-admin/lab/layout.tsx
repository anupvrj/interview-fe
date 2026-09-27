import type { ReactNode } from "react";

/** Locks lab to viewport height so panes scroll internally, not the dashboard page. */
export default function LabLayout({ children }: { children: ReactNode }) {
  return <div className="h-full min-h-0">{children}</div>;
}
