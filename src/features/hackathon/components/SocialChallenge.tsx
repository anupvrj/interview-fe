"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ExternalLink, Instagram, Linkedin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toHackathonError, type HackathonMe } from "../api";
import { useSubmitHackathonSocial } from "../hooks";
import { buildLinkedInShareComposeUrlFromFullText } from "../social-links";
import { HackathonChallengeSuccessModal } from "../celebration/HackathonChallengeSuccessModal";
import { HackathonSubmitLoadingOverlay } from "../celebration/HackathonSubmitLoadingOverlay";
import { useHackathonSubmitCelebration } from "../celebration/useHackathonSubmitCelebration";
import { InstagramShareModal } from "./InstagramShareModal";
import { formatHackathonShareCaption, randomShareCaption, SHARE_CAPTIONS } from "../share-captions";
import { validateHackathonSocialPostUrl } from "../social-post-validation";
import { hkInputClass, hkSecondaryButton } from "./ResumeChallenge";
import { SocialFollowAndRateActions, SocialShareActions } from "./SocialChallengeActions";

export function SocialChallenge({ me }: Readonly<{ me: HackathonMe }>) {
  const state = me.progress.social.state;
  const editable = me.hackathon.phase === "live" && !me.progress.completed;
  const submitted = me.social && me.social.reviewStatus !== "rejected";
  const [editing, setEditing] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState(me.social?.linkedinUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(me.social?.instagramUrl ?? "");
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareCaption, setShareCaption] = useState(SHARE_CAPTIONS[0]);
  const [instagramModalOpen, setInstagramModalOpen] = useState(false);
  const [confirmedSubmission, setConfirmedSubmission] = useState(false);
  const celebration = useHackathonSubmitCelebration();
  const submit = useSubmitHackathonSocial();
  const serverError = submit.error ? toHackathonError(submit.error).message : null;

  const showForm = (state === "available" && !submitted) || (editing && editable);
  const shareText = useMemo(() => formatHackathonShareCaption(shareCaption), [shareCaption]);
  const challengeNumber = useMemo(() => {
    const idx = me.hackathon.challenges.findIndex(
      (c) => c.key === "social_share" || c.kind === "social",
    );
    return idx >= 0 ? idx + 1 : 3;
  }, [me.hackathon.challenges]);

  useEffect(() => {
    setShareCaption(randomShareCaption());
  }, []);

  const copyText = async (text: string, toastMessage?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (toastMessage) toast.success(toastMessage);
    } catch {
      toast.error("Couldn't copy to clipboard. Select and copy the caption text manually.");
    }
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    const li = linkedinUrl.trim();
    const ig = instagramUrl.trim();
    try {
      validateHackathonSocialPostUrl("linkedin", li);
      validateHackathonSocialPostUrl("instagram", ig);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Invalid post URL.");
      return;
    }
    if (!confirmedSubmission) {
      setLocalError("Please confirm the declaration below before submitting.");
      return;
    }
    celebration.startSubmit();
    submit.mutate(
      { linkedinUrl: li, instagramUrl: ig },
      {
        onSuccess: () => {
          setEditing(false);
          setConfirmedSubmission(false);
          celebration.finishSubmitSuccess();
        },
        onError: () => {
          celebration.finishSubmitError();
        },
      },
    );
  };

  const shareOnLinkedIn = () => {
    window.open(buildLinkedInShareComposeUrlFromFullText(shareText), "_blank", "noopener,noreferrer");
    void copyText(
      shareText,
      "Post text copied. If LinkedIn’s box is empty, paste with ⌘V / Ctrl+V (includes https://interviewtrix.com/).",
    );
  };

  const shareOnInstagram = () => {
    setInstagramModalOpen(true);
  };

  if (state === "locked" && !me.social) return null;

  return (
    <div className="space-y-5">
      {me.social?.reviewStatus === "rejected" ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-[#8a3560]/70 bg-[#2e1330]/50 px-4 py-3 text-sm text-[#ffb3cb]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Your links were not accepted{me.social.reviewNote ? `: ${me.social.reviewNote}` : "."} Please share new posts
            and submit the links again.
          </span>
        </p>
      ) : null}

      {submitted && !editing ? (
        <div className="space-y-5">
          <div className="space-y-3">
            {[
              { icon: Linkedin, label: "LinkedIn post", url: me.social!.linkedinUrl },
              { icon: Instagram, label: "Instagram post", url: me.social!.instagramUrl },
            ].map(({ icon: Icon, label, url }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[#1f8a82]/60 bg-[#0c3238]/40 px-4 py-3 text-sm text-[#dbe9f8] hover:text-white"
              >
                <Icon className="size-4 shrink-0 text-[#4ee6cf]" aria-hidden />
                <span className="font-semibold">{label}</span>
                <span className="min-w-0 flex-1 truncate text-[#9eb2ca]">{url}</span>
                <ExternalLink className="size-4 shrink-0" aria-hidden />
              </a>
            ))}
            <p className="text-xs text-[#7189a6]">
              {me.social!.reviewStatus === "approved"
                ? "Verified by the InterviewTrix team."
                : "Our team will check these links during judging."}
            </p>
            {editable ? (
              <button type="button" className={hkSecondaryButton} onClick={() => setEditing(true)}>
                Edit links
              </button>
            ) : null}
          </div>
          <SocialFollowAndRateActions />
        </div>
      ) : null}

      <InstagramShareModal
        open={instagramModalOpen}
        onOpenChange={setInstagramModalOpen}
        shareText={shareText}
      />
      <HackathonChallengeSuccessModal open={celebration.modalOpen} onOpenChange={celebration.setModalOpen} />

      {showForm ? (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="hk-slot relative space-y-3 rounded-2xl border border-[#27547d]/80 bg-[#071426]/60 p-3 sm:p-3.5">
            {celebration.showOverlay ? <HackathonSubmitLoadingOverlay /> : null}
            <SocialShareActions
              caption={shareCaption}
              copied={copied}
              onCopyCaption={() => void copyText(shareText)}
              onChangeCaption={setShareCaption}
              onRegenerateCaption={() => setShareCaption((prev) => randomShareCaption(prev))}
              onShareLinkedIn={shareOnLinkedIn}
              onShareInstagram={shareOnInstagram}
            />
            <div className="border-t border-[#27547d]/50 pt-3">
              <p className="text-sm text-[#cfdbe8]">
                After your posts are live, paste the links here and submit. We use them to confirm this hackathon
                challenge — thanks for helping us verify your entry.
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="hk-linkedin" className="flex items-center gap-2 text-sm font-semibold text-[#dbe9f8]">
                    <Linkedin className="size-4 text-[#6fc0ff]" aria-hidden /> LinkedIn post URL
                  </label>
                  <input
                    id="hk-linkedin"
                    type="url"
                    inputMode="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/posts/…"
                    className={hkInputClass}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="hk-instagram" className="flex items-center gap-2 text-sm font-semibold text-[#dbe9f8]">
                    <Instagram className="size-4 text-[#ff5f97]" aria-hidden /> Instagram post URL
                  </label>
                  <input
                    id="hk-instagram"
                    type="url"
                    inputMode="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://www.instagram.com/p/…"
                    className={hkInputClass}
                  />
                </div>
              </div>
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-[#27547d]/60 bg-[#040b17]/50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={confirmedSubmission}
                  onChange={(event) => {
                    setConfirmedSubmission(event.target.checked);
                    if (event.target.checked) setLocalError(null);
                  }}
                  className="mt-1 size-4 shrink-0 rounded border-[#27547d] bg-[#071426] accent-[#1677ff]"
                />
                <span className="text-xs leading-relaxed text-[#9eb2ca] sm:text-sm">
                  I confirm that I have shared public posts on LinkedIn and Instagram, submitted the correct post links
                  above, and understand that InterviewTrix may cancel my submission or ask me to resubmit if the links
                  cannot be verified.
                </span>
              </label>
              {localError || serverError ? (
                <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-[#ff6f9f]">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {localError ?? serverError}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={!confirmedSubmission || submit.isPending || celebration.showOverlay}
                  className="hk-btn h-12 w-full px-6 text-sm disabled:pointer-events-none disabled:opacity-45 sm:w-auto"
                >
                  {submit.isPending || celebration.showOverlay ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    `Submit Challenge ${challengeNumber}`
                  )}
                </button>
                {editing ? (
                  <button type="button" className={hkSecondaryButton} onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <SocialFollowAndRateActions />
        </form>
      ) : null}
    </div>
  );
}
