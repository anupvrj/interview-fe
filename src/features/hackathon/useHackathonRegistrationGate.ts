"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HackathonMe } from "./api";
import { useHackathonMe, useRegisterForHackathon } from "./hooks";
import type { HackathonRegistrationModalPhase } from "./components/HackathonRegistrationModal";

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
        if (showModal) {
          setModalPhase("success");
          return;
        }
        onCompleteRef.current?.();
      },
      onError: () => {
        registerAttempted.current = false;
        if (showModal) setModalPhase(null);
      },
    });
  }, [autoRegister, me, register, source]);

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
