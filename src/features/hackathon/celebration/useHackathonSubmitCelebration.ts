"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SubmitCelebrationPhase = "idle" | "submitting" | "celebrating" | "modalOpen";

export const SUBMIT_CELEBRATION_SUCCESS_DELAY_MS = 650;

export function useHackathonSubmitCelebration() {
  const [phase, setPhase] = useState<SubmitCelebrationPhase>("idle");
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDelay = useCallback(() => {
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
  }, []);

  useEffect(() => () => clearDelay(), [clearDelay]);

  const startSubmit = useCallback(() => {
    clearDelay();
    setPhase("submitting");
  }, [clearDelay]);

  const finishSubmitSuccess = useCallback(() => {
    setPhase("celebrating");
    clearDelay();
    delayRef.current = setTimeout(() => {
      setPhase("modalOpen");
      delayRef.current = null;
    }, SUBMIT_CELEBRATION_SUCCESS_DELAY_MS);
  }, [clearDelay]);

  const finishSubmitError = useCallback(() => {
    clearDelay();
    setPhase("idle");
  }, [clearDelay]);

  const closeModal = useCallback(() => {
    setPhase("idle");
  }, []);

  const showOverlay = phase === "submitting" || phase === "celebrating";
  const modalOpen = phase === "modalOpen";

  return {
    phase,
    showOverlay,
    modalOpen,
    startSubmit,
    finishSubmitSuccess,
    finishSubmitError,
    closeModal,
    setModalOpen: (open: boolean) => {
      if (!open) closeModal();
    },
  };
}
