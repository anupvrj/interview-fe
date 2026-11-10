"use client";

import { useState } from "react";

/** "3 set aside · Show them": nothing they ignored is gone for good. */
export function SetAsideLink({ count, onRestore }: { count: number; onRestore: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (count <= 0) return null;
  return (
    <p className="text-xs text-muted-foreground">
      {count} finding{count === 1 ? "" : "s"} set aside ·{" "}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setFailed(false);
          try {
            await onRestore();
          } catch {
            setFailed(true);
          } finally {
            setBusy(false);
          }
        }}
        className="font-semibold text-primary hover:underline disabled:opacity-60"
      >
        {busy ? "Bringing them back…" : "Show them"}
      </button>
      {failed ? <span className="ml-1 text-destructive">Couldn&apos;t do that. Try again.</span> : null}
    </p>
  );
}
