import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * False on the server and during hydration, true after. Use it for anything that depends on
 * client-only state (Clerk's session, storage): Clerk can finish loading before React hydrates
 * (cached script), and rendering signed-in/out UI on that first pass makes the client HTML differ
 * from the server's, which is a hydration error.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
