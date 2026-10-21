"use client";

import { useEffect, useState } from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-[#040b17] text-[#9eb2ca]">
      <Loader2 className="mr-2 size-5 animate-spin" aria-hidden /> Signing you in…
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
