"use client";

import { useEffect, useState } from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { HackathonPageLoader } from "@/features/hackathon/components/HackathonPageLoader";
import { peekPostSignInReturnUrl, resolvePostAuthRedirectPath } from "@/lib/post-sign-in-redirect";

/**
 * Google comes back here from the hackathon "Continue with Google" button. Finishes the
 * sign-in — or the sign-up, for a first-time Google user — and goes to the saved page.
 */
export default function SsoCallbackPage() {
  const [destination, setDestination] = useState<string | null>(null);
  useEffect(() => {
    setDestination(resolvePostAuthRedirectPath(peekPostSignInReturnUrl()));
  }, []);

  return (
    <div className="min-h-screen bg-[#040b17]">
      <HackathonPageLoader message="Signing you in…" />
      {destination ? (
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl={destination}
          signUpForceRedirectUrl={destination}
          // Rare extra steps (missing details, 2FA) use the normal screens.
          continueSignUpUrl="/sign-up/continue"
          secondFactorUrl="/sign-in/factor-two"
        />
      ) : null}
    </div>
  );
}
