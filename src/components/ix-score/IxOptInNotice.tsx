"use client";

import { useEffect, useState } from "react";
import { ixScoreApi, type IxScoreSnapshot } from "@/lib/api";
import { IxOptInBanner } from "@/components/ix-score/IxOptInBanner";
import { hasAllInterviewOptIns } from "@/lib/ix-score-constants";

type IxOptInNoticeProps = {
  className?: string;
  onSnapshotUpdated?: (snapshot: IxScoreSnapshot) => void;
};

/** Fetches iX snapshot and shows opt-in upsell when not all interview types are selected. */
export function IxOptInNotice({
  className,
  onSnapshotUpdated,
}: IxOptInNoticeProps) {
  const [snapshot, setSnapshot] = useState<IxScoreSnapshot | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void ixScoreApi
      .getSnapshot()
      .then(setSnapshot)
      .catch(() => setSnapshot(null))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || !snapshot || hasAllInterviewOptIns(snapshot.optIns)) {
    return null;
  }

  return (
    <IxOptInBanner
      optIns={snapshot.optIns}
      onSaved={(next) => {
        setSnapshot(next);
        onSnapshotUpdated?.(next);
      }}
      className={className}
    />
  );
}
