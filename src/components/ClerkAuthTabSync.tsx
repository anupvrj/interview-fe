"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

const CHANNEL = "interviewtrix-clerk-session";
const BROADCAST_KEY = "interviewtrix.authBroadcast";

/**
 * When one tab finishes OAuth (extension Connect), other open InterviewTrix
 * tabs still show the signed-out header until they reload.
 */
export function ClerkAuthTabSync() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const signedInRef = useRef(isSignedIn);

  useEffect(() => {
    signedInRef.current = isSignedIn;
  }, [isSignedIn]);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event: MessageEvent) => {
      if (event.data?.type !== "signed-in") return;
      if (signedInRef.current) return;
      window.location.reload();
    };
    return () => channel.close();
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    try {
      if (sessionStorage.getItem(BROADCAST_KEY) === userId) return;
      sessionStorage.setItem(BROADCAST_KEY, userId);
    } catch {
      /* private mode */
    }
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage({ type: "signed-in" });
    channel.close();
  }, [isLoaded, isSignedIn, userId]);

  return null;
}
