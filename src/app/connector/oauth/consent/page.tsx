"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthCardLayout } from "@/components/app/AuthCardLayout";
import { Button } from "@/components/ui/button";
import { connectorApi, setAuthTokenGetter, userApi } from "@/lib/api";
import { appOutlineButton, appPrimaryButton } from "@/lib/app-theme";
import { getSignInUrlWithRedirect } from "@/lib/post-sign-in-redirect";
import { cn } from "@/lib/utils";

export default function ConnectorOAuthConsentPage() {
  return (
    <Suspense
      fallback={
        <AuthCardLayout title="Connect Interview Trix">
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" /> Loading…
          </p>
        </AuthCardLayout>
      }
    >
      <ConsentInner />
    </Suspense>
  );
}

function ConsentInner() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request_id") || "";
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoaded) return;

    const returnPath = requestId
      ? `/connector/oauth/consent?request_id=${encodeURIComponent(requestId)}`
      : "/connector/oauth/consent";

    if (!isSignedIn || !user) {
      window.location.replace(getSignInUrlWithRedirect(returnPath));
      return;
    }

    if (!requestId) {
      setError("Missing OAuth request.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setAuthTokenGetter(() => getToken());
        localStorage.setItem("clerk-user-id", user.id);
        const email = user.primaryEmailAddress?.emailAddress || "";
        if (email) {
          await userApi.createOrGetUser(
            user.id,
            email,
            user.fullName || user.firstName || "User",
          );
        }
        const result = await connectorApi.getOAuthRequest(requestId);
        if (cancelled) return;
        setClientId(result.data.clientId);
        setScopes(result.data.scopes || []);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || "OAuth request not found.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, requestId, user]);

  async function decide(approve: boolean) {
    setSubmitting(true);
    try {
      const result = await connectorApi.consentOAuth(requestId, approve);
      window.location.assign(result.data.redirectTo);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Consent failed.");
      setSubmitting(false);
    }
  }

  return (
    <AuthCardLayout
      title="Connect Interview Trix"
      subtitle="An AI app wants to create resume drafts and mock interviews as you."
      className="max-w-[480px]"
    >
      {loading ? (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" /> Loading request…
        </p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="space-y-6">
          <div className="space-y-1 text-sm">
            <p>
              Client: <span className="font-medium">{clientId || "AI app"}</span>
            </p>
            <p className="text-muted-foreground">
              Scopes: {scopes.join(", ") || "standard connector access"}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className={cn(appPrimaryButton, "h-11 w-full")}
              disabled={submitting}
              onClick={() => void decide(true)}
            >
              Allow
            </Button>
            <Button
              variant="outline"
              className={cn(appOutlineButton, "h-11 w-full")}
              disabled={submitting}
              onClick={() => void decide(false)}
            >
              Deny
            </Button>
          </div>
        </div>
      )}
    </AuthCardLayout>
  );
}
