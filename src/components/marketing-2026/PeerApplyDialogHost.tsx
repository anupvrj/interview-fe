"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InterviewerApplyDialog } from "@/components/peer/InterviewerApplyDialog";

/** Every "Apply" on the new page links to `?apply=1`; this opens the existing application dialog, same as the legacy page. */
function Host() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (params.get("apply") === "1") setOpen(true); }, [params]);
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    // drop ?apply=1 on close so the next "Apply" click opens it again
    if (!next && params.get("apply") === "1") router.replace(path, { scroll: false });
  };
  return <InterviewerApplyDialog open={open} onOpenChange={onOpenChange} />;
}

export function PeerApplyDialogHost() {
  return (
    <Suspense fallback={null}>
      <Host />
    </Suspense>
  );
}
