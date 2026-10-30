"use client";

import { createContext, useContext } from "react";
import { FALLBACK_ROUNDS, type PeerRound } from "./peer-rounds";

const Ctx = createContext<PeerRound[]>(FALLBACK_ROUNDS);

/** Hands the server-fetched round caps to every peer section that shows a price. */
export function PeerRoundsProvider({ rounds, children }: { rounds: PeerRound[]; children: React.ReactNode }) {
  return <Ctx.Provider value={rounds}>{children}</Ctx.Provider>;
}

export const usePeerRounds = () => useContext(Ctx);
