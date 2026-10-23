"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { HackathonMe } from "./api";
import { useHackathonMe, useRegisterForHackathon } from "./hooks";
import type { HackathonRegistrationModalPhase } from "./components/HackathonRegistrationModal";
import { HK_EVENTS, classifyError, trackHackathon, trackRegistrationSuccessOnce } from "./analytics";

type GateOptions = {
  /** Passed to the register API (analytics). */
  source: string;
  /** When false, never POST /register (e.g. hackathon dashboard — use profile signup only). */
  autoRegister?: boolean;
  /** Called when the user taps Go to Challenge after a successful registration modal. */
  onRegistrationComplete?: () => void;
};

export function useHackathonRegistrationGate({
  source,
  autoRegister = false,
  onRegistrationComplete,
}: GateOptions) {
  const { userId } = useAuth();
  const meQuery = useHackathonMe();
  const register = useRegisterForHackathon();
  const registerAttempted = useRef(false);
  const onCompleteRef = useRef(onRegistrationComplete);
  onCompleteRef.current = onRegistrationComplete;
  const [modalPhase, setModalPhase] = useState<HackathonRegistrationModalPhase | null>(null);

  const me = meQuery.data;

  useEffect(() => {
    if (!autoRegister) return;
    if (!me || me.registered || registerAttempted.current) return;
    if (me.hackathon.phase === "ended" || me.hackathon.isFull) return;

    registerAttempted.current = true;
    const showModal = me.profile.complete;
    if (showModal) setModalPhase("registering");

    register.mutate(source, {
      onSuccess: (data: HackathonMe) => {
        if (!data.registered) return;
        // Confirmed by the API; deduped per account so retries/reloads never double count.
        trackRegistrationSuccessOnce({
          userKey: userId,
          source,
          userType: data.profile.userType,
          eventId: data.conversion?.eventId,
          serverGa4: data.conversion?.serverGa4,
        });
        if (showModal) {
          setModalPhase("success");
          return;
        }
        onCompleteRef.current?.();
      },
      onError: (err: unknown) => {
        trackHackathon(HK_EVENTS.signupError, { form_step: "registration", error_type: classifyError(err) });
        registerAttempted.current = false;
        if (showModal) setModalPhase(null);
      },
    });
  }, [autoRegister, me, register, source, userId]);

  const completeRegistrationFlow = useCallback(() => {
    // Keep success modal mounted until navigation unmounts this page (avoids onboarding flash).
    onCompleteRef.current?.();
  }, []);

  const registrationBusy =
    modalPhase === "registering" ||
    (Boolean(me && !me.registered) && register.isPending);

  const successModalOpen = modalPhase === "success";

  return {
    me,
    meQuery,
    register,
    registerAttempted,
    modalPhase,
    registrationBusy,
    successModalOpen,
    completeRegistrationFlow,
  };
}
