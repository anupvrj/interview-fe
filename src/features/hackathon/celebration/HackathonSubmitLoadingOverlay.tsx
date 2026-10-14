"use client";

import { Loader2 } from "lucide-react";
import { HACKATHON_CHALLENGE_SUCCESS_COPY } from "./celebrationCopy";

export function HackathonSubmitLoadingOverlay({
  message = HACKATHON_CHALLENGE_SUCCESS_COPY.loadingMessage,
}: Readonly<{ message?: string }>) {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#040b17]/85 px-4 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="size-10 animate-spin text-[#6fc0ff]" aria-hidden />
      <p className="text-center text-sm font-medium text-[#dbe9f8] sm:text-base">{message}</p>
    </div>
  );
}
