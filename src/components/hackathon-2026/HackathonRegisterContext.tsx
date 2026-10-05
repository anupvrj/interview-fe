"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type HackathonRegisterContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openRegister: () => void;
};

const HackathonRegisterContext =
  createContext<HackathonRegisterContextValue | null>(null);

export function HackathonRegisterProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openRegister = useCallback(() => setOpen(true), []);
  const value = useMemo(
    () => ({ open, setOpen, openRegister }),
    [open, openRegister],
  );

  return (
    <HackathonRegisterContext.Provider value={value}>
      {children}
    </HackathonRegisterContext.Provider>
  );
}

export function useHackathonRegister() {
  const ctx = useContext(HackathonRegisterContext);
  if (!ctx) {
    throw new Error("useHackathonRegister must be used within HackathonRegisterProvider");
  }
  return ctx;
}
