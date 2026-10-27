"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { HackathonLaunchEventModal } from "./HackathonLaunchEventModal";

type LaunchEventContextValue = {
  openLaunchRegister: () => void;
};

const LaunchEventContext = createContext<LaunchEventContextValue | null>(null);

function launchUrlWantsModal() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("launch") === "1" || params.get("launch") === "true") return true;
  const hash = window.location.hash;
  return hash === "#launch" || hash === "#launch-form";
}

function scrollToLaunchSection() {
  document.getElementById("launch")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function HackathonLaunchEventProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openLaunchRegister = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    const openFromUrl = () => {
      if (!launchUrlWantsModal()) return;
      scrollToLaunchSection();
      setOpen(true);
    };
    const openFromNav = () => {
      scrollToLaunchSection();
      setOpen(true);
    };
    openFromUrl();
    window.addEventListener("hashchange", openFromUrl);
    window.addEventListener("hackathon-open-launch-modal", openFromNav);
    return () => {
      window.removeEventListener("hashchange", openFromUrl);
      window.removeEventListener("hackathon-open-launch-modal", openFromNav);
    };
  }, []);

  const value = useMemo(() => ({ openLaunchRegister }), [openLaunchRegister]);

  return (
    <LaunchEventContext.Provider value={value}>
      {children}
      <HackathonLaunchEventModal open={open} onOpenChange={setOpen} />
    </LaunchEventContext.Provider>
  );
}

export function useHackathonLaunchEvent() {
  const ctx = useContext(LaunchEventContext);
  if (!ctx) {
    throw new Error("useHackathonLaunchEvent must be used within HackathonLaunchEventProvider");
  }
  return ctx;
}

/** Safe when provider is optional (e.g. marketing home strip). */
export function useHackathonLaunchEventOptional() {
  return useContext(LaunchEventContext);
}
