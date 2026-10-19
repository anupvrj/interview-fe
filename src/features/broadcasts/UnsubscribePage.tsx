"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MailX } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { unsubscribeApi } from "./api";

type State =
  | { kind: "loading" }
  | { kind: "ready"; email: string; test: boolean; already: boolean }
  | { kind: "done"; email: string }
  | { kind: "error"; message: string };

/** Footer "Unsubscribe" link target. Asks once, so link scanners can't unsubscribe people. */
export function UnsubscribePage() {
  const token = useSearchParams()?.get("token")?.trim() ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({ kind: "error", message: "This unsubscribe link is incomplete." });
      return;
    }
    let cancelled = false;
    unsubscribeApi
      .describe(token)
      .then((info) => !cancelled && setState({ kind: "ready", email: info.email, test: info.test, already: info.unsubscribed }))
      .catch((error: unknown) => !cancelled && setState({ kind: "error", message: getApiErrorMessage(error, "This link is no longer valid.") }));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const confirm = async () => {
    if (state.kind !== "ready") return;
    setBusy(true);
    try {
      await unsubscribeApi.confirm(token);
      setState({ kind: "done", email: state.email });
    } catch (error: unknown) {
      setState({ kind: "error", message: getApiErrorMessage(error, "Couldn't unsubscribe. Please try again.") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#040b17] px-4 py-16 text-[#dbe6f3]">
      <div className="w-full max-w-md rounded-[20px] border border-[#24508a] bg-gradient-to-b from-[#0f2a52] to-[#0a1b36] p-8 text-center shadow-[0_18px_50px_rgba(0,15,45,0.45)]">
        {state.kind === "loading" ? <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#6fc0ff]" /> : null}

        {state.kind === "ready" ? (
          <>
            <MailX className="mx-auto h-9 w-9 text-[#6fc0ff]" />
            <h1 className="mt-4 text-xl font-bold text-white">
              {state.test ? "This was a test email" : state.already ? "You're already unsubscribed" : "Unsubscribe from updates?"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#9eb2ca]">
              {state.test
                ? "Real emails carry a working link here."
                : state.already
                  ? `${state.email} won't get update emails or hackathon reminders from InterviewTrix.`
                  : `${state.email} will stop getting update emails and hackathon reminders. Account emails like receipts still arrive.`}
            </p>
            {!state.test && !state.already ? (
              <button
                type="button"
                onClick={() => void confirm()}
                disabled={busy}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1677ff] px-6 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Unsubscribe
              </button>
            ) : null}
          </>
        ) : null}

        {state.kind === "done" ? (
          <>
            <CheckCircle2 className="mx-auto h-9 w-9 text-[#29d6a0]" />
            <h1 className="mt-4 text-xl font-bold text-white">You're unsubscribed</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#9eb2ca]">{state.email} won't get update emails or hackathon reminders from us.</p>
          </>
        ) : null}

        {state.kind === "error" ? (
          <>
            <MailX className="mx-auto h-9 w-9 text-[#ff6f9f]" />
            <h1 className="mt-4 text-xl font-bold text-white">Link not valid</h1>
            <p className="mt-2 text-sm text-[#9eb2ca]">{state.message}</p>
          </>
        ) : null}

        <Link href="/" className="mt-8 inline-block text-sm text-[#4fb8ff] hover:underline">
          Go to InterviewTrix
        </Link>
      </div>
    </main>
  );
}
