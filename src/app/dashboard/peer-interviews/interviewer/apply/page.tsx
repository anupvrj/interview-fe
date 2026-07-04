"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { InterviewerApplyIntro } from "@/components/peer/InterviewerApplyIntro";
import { peerApi, type PeerInterviewType } from "@/lib/api";

export default function InterviewerApplyPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;
    void Promise.all([
      peerApi.getMyInterviewerProfile(),
      peerApi.listInterviewTypes(),
    ])
      .then(([profile, interviewTypes]) => {
        if (profile) {
          router.replace("/dashboard/peer-interviews/interviewer");
          return;
        }
        setTypes(interviewTypes);
      })
      .finally(() => setChecking(false));
  }, [isLoaded, user, router]);

  if (!isLoaded || checking) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  return (
    <InterviewerApplyIntro types={types} initialName={user?.fullName || undefined} />
  );
}
