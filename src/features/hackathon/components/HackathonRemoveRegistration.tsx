"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { HackathonMe } from "../api";
import { toHackathonError } from "../api";
import { hackathonKeys, useWithdrawFromHackathon } from "../hooks";
import { HackathonWithdrawConfirmModal } from "./HackathonWithdrawConfirmModal";
import { hkSecondaryButton } from "./ResumeChallenge";

type HackathonRemoveRegistrationProps = Readonly<{
  me: HackathonMe;
  /** Fired before cache updates so the dashboard can hide challenge UI during redirect. */
  onLeavingHackathon?: () => void;
}>;

export function HackathonRemoveRegistration({ me, onLeavingHackathon }: HackathonRemoveRegistrationProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const withdraw = useWithdrawFromHackathon();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const slug = me.hackathon.slug;

  if (!me.registered || me.hackathon.phase === "ended" || me.participant?.suspended) {
    return null;
  }

  const onConfirmRemove = () => {
    withdraw.mutate(undefined, {
      onSuccess: (data) => {
        onLeavingHackathon?.();
        queryClient.setQueryData(hackathonKeys.me(slug), data);
        void queryClient.refetchQueries({ queryKey: hackathonKeys.me(slug), type: "active" });
        void queryClient.invalidateQueries({ queryKey: hackathonKeys.published });
        toast.success("You’ve left the hackathon. You can register again anytime.");
        router.replace("/dashboard");
      },
      onError: (error) => {
        toast.error(toHackathonError(error).message || "Could not remove your registration.");
      },
    });
  };

  return (
    <>
      <HackathonWithdrawConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={onConfirmRemove}
        pending={withdraw.isPending}
      />
      <p className="text-center text-sm text-[#7189a6]">
        <button
          type="button"
          className={`${hkSecondaryButton} mx-auto inline-flex min-h-10 border-[#5a3040]/60 text-[#ff9ab8] hover:border-[#ff6f9f]/50 hover:text-[#ffb8d0]`}
          disabled={withdraw.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {withdraw.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Removing…
            </>
          ) : (
            "Remove from Hackathon"
          )}
        </button>
      </p>
    </>
  );
}
