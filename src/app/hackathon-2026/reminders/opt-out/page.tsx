"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { API_URL } from "@/lib/api";
import { HACKATHON_LANDING_PATH } from "@/features/hackathon/config";

function OptOutResult() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"working" | "stopped" | "invalid">("working");

  useEffect(() => {
    if (token.length < 8) {
      setState("invalid");
      return;
    }
    const url = `${API_URL}/hackathons/reminders/opt-out?token=${encodeURIComponent(token)}`;
    void fetch(url)
      .then(async (response) => {
        const body = (await response.json()) as { data?: { optedOut?: boolean } };
        setState(body.data?.optedOut ? "stopped" : "invalid");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  return (
    <main className="flex min-h-screen flex-col justify-center bg-[#040b17] px-6 py-24 text-[#dbe6f3]">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-3xl font-semibold text-white">
          {state === "stopped" ? "Reminders stopped" : state === "invalid" ? "Link not recognized" : "Stopping reminders…"}
        </h1>
        <p className="mt-4 text-base leading-7">
          {state === "stopped"
            ? "You will not get more daily emails about finishing the hackathon. You can turn them back on from your hackathon dashboard."
            : state === "invalid"
              ? "This opt-out link is invalid."
              : "One moment."}
        </p>
        <Link href={HACKATHON_LANDING_PATH} className="mt-8 inline-block font-semibold text-[#6fc0ff]">
          Back to the hackathon
        </Link>
      </div>
    </main>
  );
}

export default function HackathonReminderOptOutPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center bg-[#040b17] px-6 py-24 text-white">Stopping reminders…</main>}>
      <OptOutResult />
    </Suspense>
  );
}
