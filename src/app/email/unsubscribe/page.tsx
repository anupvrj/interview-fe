import { Suspense } from "react";
import type { Metadata } from "next";
import { UnsubscribePage } from "@/features/broadcasts/UnsubscribePage";

export const metadata: Metadata = {
  title: "Unsubscribe | InterviewTrix",
  robots: { index: false, follow: false },
};

export default function EmailUnsubscribeRoute() {
  return (
    <Suspense fallback={null}>
      <UnsubscribePage />
    </Suspense>
  );
}
