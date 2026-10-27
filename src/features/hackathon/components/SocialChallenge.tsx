"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ExternalLink, Linkedin, Loader2, Shuffle } from "lucide-react";
import { toHackathonError, type HackathonMe } from "../api";
import { useSubmitHackathonSocial } from "../hooks";
import { buildLinkedInShareComposeUrlFromFullText } from "../social-links";
import { HackathonChallengeSuccessModal } from "../celebration/HackathonChallengeSuccessModal";
import { HackathonSubmitLoadingOverlay } from "../celebration/HackathonSubmitLoadingOverlay";
import { useHackathonSubmitCelebration } from "../celebration/useHackathonSubmitCelebration";
import { formatHackathonShareCaption, randomShareCaption } from "../share-captions";
import { randomSharePostImage } from "../share-images";
import { validateHackathonSocialPostUrl } from "../social-post-validation";
import { hkSecondaryButton } from "./ResumeChallenge";
import { SocialFollowAndRateActions } from "./SocialChallengeActions";
import { ShareCopyButton, SocialShareStep } from "./SocialShareStep";
import { cn } from "@/lib/utils";

export function SocialChallenge({ me }: Readonly<{ me: HackathonMe }>) {
  const state = me.progress.social.state;
  const editable = me.hackathon.phase === "live" && !me.progress.completed;
  const submitted = me.social && me.social.reviewStatus !== "rejected";
  const [editing, setEditing] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState(me.social?.linkedinUrl ?? "");
  const [localError, setLocalError] = useState<string | null>(null);
  const [shareCaption, setShareCaption] = useState(() => randomShareCaption());
  const [shareImage, setShareImage] = useState(() => randomSharePostImage());
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

  const socialChallenge = me.hackathon.challenges.find((c) => c.key === "social_share" || c.kind === "social");
  const heading = socialChallenge?.title?.trim() || "Share on LinkedIn";
  const subheading =
    socialChallenge?.description?.trim() ||
    "Post about your mock interview on LinkedIn, then share post links with us.";

  const regenerateContent = () => {
    setShareCaption((current) => randomShareCaption(current));
    setShareImage((current) => randomSharePostImage(current));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    let li: string;
    try {
      li = validateHackathonSocialPostUrl("linkedin", linkedinUrl);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Paste the link to your LinkedIn post.");
      return;
    }
    if (!confirmedSubmission) {
      setLocalError("Please confirm the declaration below before submitting.");
      return;
    }
    celebration.startSubmit();
    submit.mutate(
      { linkedinUrl: li },
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

  if (state === "locked" && !me.social) return null;

  return (
    <div className="space-y-5">
      {me.social?.reviewStatus === "rejected" ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-[#8a3560]/70 bg-[#2e1330]/50 px-4 py-3 text-sm text-[#ffb3cb]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Your link was not accepted{me.social.reviewNote ? `: ${me.social.reviewNote}` : "."} Please share a new post
            and submit the link again.
          </span>
        </p>
      ) : null}

      {submitted && !editing ? (
        <div className="space-y-5">
          <div className="space-y-3">
            <a
              href={me.social!.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-[#1f8a82]/60 bg-[#0c3238]/40 px-4 py-3 text-sm text-[#dbe9f8] hover:text-white"
            >
              <Linkedin className="size-4 shrink-0 text-[#4ee6cf]" aria-hidden />
              <span className="font-semibold">LinkedIn post</span>
              <span className="min-w-0 flex-1 truncate text-[#9eb2ca]">{me.social!.linkedinUrl}</span>
              <ExternalLink className="size-4 shrink-0" aria-hidden />
            </a>
            <p className="text-xs text-[#7189a6]">
              {me.social!.reviewStatus === "approved"
                ? "Verified by the InterviewTrix team."
                : "Our team will check this link during judging."}
            </p>
            {editable ? (
              <button
                type="button"
                className={hkSecondaryButton}
                onClick={() => {
                  setEditing(true);
                }}
              >
                Edit link
              </button>
            ) : null}
          </div>
          <SocialFollowAndRateActions />
        </div>
      ) : null}

      <HackathonChallengeSuccessModal open={celebration.modalOpen} onOpenChange={celebration.setModalOpen} />

      {showForm ? (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="hk-slot relative space-y-4 rounded-2xl border border-[#27547d]/80 bg-[#071426]/60 p-3 sm:p-4">
            {celebration.showOverlay ? <HackathonSubmitLoadingOverlay /> : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white sm:text-lg">{heading}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#9eb2ca]">{subheading}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <ShareCopyButton text={shareText} className={cn(hkSecondaryButton, "min-h-10 text-sm")} />
                <button
                  type="button"
                  onClick={regenerateContent}
                  className={cn(hkSecondaryButton, "min-h-10 text-sm")}
                >
                  <Shuffle className="size-4" aria-hidden />
                  Regenerate content
                </button>
              </div>
            </div>

            <SocialShareStep
              platform="linkedin"
              image={shareImage}
              text={shareText}
              openUrl={buildLinkedInShareComposeUrlFromFullText(shareText)}
              link={linkedinUrl}
              onLinkChange={setLinkedinUrl}
            />

            <label className="flex cursor-pointer items-start gap-3 text-sm text-[#9eb2ca]">
              <input
                type="checkbox"
                checked={confirmedSubmission}
                onChange={(event) => {
                  setConfirmedSubmission(event.target.checked);
                  if (event.target.checked) setLocalError(null);
                }}
                className="mt-0.5 size-4 shrink-0 rounded border-[#27547d] bg-[#071426] accent-[#1677ff]"
              />
              <span>My LinkedIn post is public and this is the correct link to it.</span>
            </label>

            {localError || serverError ? (
              <p role="alert" className="flex items-start gap-2 text-sm text-[#ff6f9f]">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {localError ?? serverError}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              {editing ? (
                <button type="button" className={hkSecondaryButton} onClick={() => setEditing(false)}>
                  Cancel
                </button>
              ) : (
                <span />
              )}
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
            </div>
          </div>
          <SocialFollowAndRateActions />
        </form>
      ) : null}
    </div>
  );
}
