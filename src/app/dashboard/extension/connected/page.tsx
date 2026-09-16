"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appOutlineButton, appPrimaryButton } from "@/lib/app-theme";
import {
  ensureExtensionSession,
  returnToExtensionJobTab,
} from "@/lib/extension-resume-sync";
import { consumePostSignInReturnUrl } from "@/lib/post-sign-in-redirect";

type ConnectStatus = "working" | "connected" | "error";

const STATUS_ICON = {
  working: <Loader2 className="h-6 w-6 animate-spin" />,
  connected: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
  error: <ShieldCheck className="h-6 w-6" />,
} as const;

const STATUS_TITLE: Record<ConnectStatus, string> = {
  working: "Connecting InterviewTrix…",
  connected: "You're connected",
  error: "Couldn’t finish connecting",
};

function statusCopy(status: ConnectStatus, error: string): string {
  if (status === "working") {
    return "Signing the Chrome extension in with your InterviewTrix account.";
  }
  if (status === "connected") {
    return (
      error ||
      "The extension can now match jobs and load your resumes. Returning you to the tab you came from."
    );
  }
  return error;
}

export default function ExtensionConnectedPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState<ConnectStatus>("working");
  const [error, setError] = useState("");
  const [returning, setReturning] = useState(false);

  const goBack = useCallback(async () => {
    setReturning(true);
    try {
      const result = await returnToExtensionJobTab(2000);
      if (result.ok) return true;
      setError(
        "You can close this tab and return to the page where you opened Connect.",
      );
      return false;
    } catch {
      return false;
    } finally {
      setReturning(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;
    localStorage.setItem("clerk-user-id", user.id);
    let cancelled = false;

    void (async () => {
      let last = await ensureExtensionSession({ timeoutMs: 1500 });
      for (let attempt = 0; attempt < 2 && !last.ok && !cancelled; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        last = await ensureExtensionSession({ timeoutMs: 1500 });
      }
      if (cancelled) return;
      if (last.ok) {
        setStatus("connected");
        consumePostSignInReturnUrl();
        window.setTimeout(() => {
          if (cancelled) return;
          void goBack().then((returned) => {
            if (!returned && !cancelled) {
              router.replace("/dashboard");
            }
          });
        }, 1400);
        return;
      }
      setStatus("error");
      setError(
        last.error === "no_extension"
          ? "Reload the InterviewTrix extension, then refresh this page."
          : last.error || "Could not finish connecting. Try again.",
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [goBack, isLoaded, router, user]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {STATUS_ICON[status]}
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {STATUS_TITLE[status]}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {statusCopy(status, error)}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {status !== "connected" ? (
            <Button
              type="button"
              variant="outline"
              className={`${appOutlineButton} w-full sm:w-auto`}
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          ) : null}
          <Button
            type="button"
            className={`${appPrimaryButton} w-full sm:w-auto`}
            disabled={returning || status === "working"}
            onClick={() => void goBack()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to previous tab
          </Button>
        </div>
      </div>
    </div>
  );
}
