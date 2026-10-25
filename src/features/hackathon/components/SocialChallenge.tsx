"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, ExternalLink, Instagram, Linkedin, Loader2 } from "lucide-react";
import { toHackathonError, type HackathonMe } from "../api";
import { useSubmitHackathonSocial } from "../hooks";
import { buildLinkedInShareComposeUrlFromFullText, instagramShareOpenUrl } from "../social-links";
import { HackathonChallengeSuccessModal } from "../celebration/HackathonChallengeSuccessModal";
import { HackathonSubmitLoadingOverlay } from "../celebration/HackathonSubmitLoadingOverlay";
import { useHackathonSubmitCelebration } from "../celebration/useHackathonSubmitCelebration";
import { formatHackathonShareCaption, randomShareCaption, SHARE_CAPTIONS } from "../share-captions";
import { randomSharePostImage, SHARE_POST_IMAGES } from "../share-images";
import { validateHackathonSocialPostUrl } from "../social-post-validation";
import { hkSecondaryButton } from "./ResumeChallenge";
import { SocialFollowAndRateActions } from "./SocialChallengeActions";
import { SocialShareStep } from "./SocialShareStep";
import { cn } from "@/lib/utils";

export function SocialChallenge({ me }: Readonly<{ me: HackathonMe }>) {
  const state = me.progress.social.state;
  const editable = me.hackathon.phase === "live" && !me.progress.completed;
  const submitted = me.social && me.social.reviewStatus !== "rejected";
  const [editing, setEditing] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState(me.social?.linkedinUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(me.social?.instagramUrl ?? "");
  const [localError, setLocalError] = useState<string | null>(null);
  const [shareCaption, setShareCaption] = useState(SHARE_CAPTIONS[0]);
  const [shareImage, setShareImage] = useState<(typeof SHARE_POST_IMAGES)[number]>(SHARE_POST_IMAGES[0]);
  /** 0 = LinkedIn, 1 = Instagram: one platform at a time. */
  const [step, setStep] = useState(0);
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

  // Picked after mount so the server and browser render the same first frame.
  useEffect(() => {
    setShareCaption(randomShareCaption());
    setShareImage(randomSharePostImage());
  }, []);

  const goToStep = (next: number) => {
    setLocalError(null);
    setStep(next);
  };

  const nextToInstagram = () => {
    try {
      validateHackathonSocialPostUrl("linkedin", linkedinUrl);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Paste the link to your LinkedIn post.");
      return;
    }
    goToStep(1);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    // Checked here; the cleaned-up links (no tracking params, one form per post) are sent.
    let li: string;
    let ig: string;
    try {
      li = validateHackathonSocialPostUrl("linkedin", linkedinUrl);
      ig = validateHackathonSocialPostUrl("instagram", instagramUrl);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Invalid post URL.");
      if (!linkedinUrl.trim()) setStep(0);
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
              <button
                type="button"
                className={hkSecondaryButton}
                onClick={() => {
                  setStep(0);
                  setEditing(true);
                }}
              >
                Edit links
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
            <ol className="flex items-center gap-2 text-sm font-semibold" aria-label="Steps">
              {(["LinkedIn", "Instagram"] as const).map((name, i) => (
                <li key={name} className="flex items-center gap-2" aria-current={step === i ? "step" : undefined}>
                  {i > 0 ? <span className="h-px w-6 bg-[#27547d]" aria-hidden /> : null}
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-xs font-bold",
                      step === i ? "bg-[#1677ff] text-white" : step > i ? "bg-[#29d6a0] text-[#041a14]" : "bg-[#173252] text-[#9eb2ca]",
                    )}
                    aria-hidden
                  >
                    {step > i ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span className={step === i ? "text-white" : "text-[#7189a6]"}>{name}</span>
                </li>
              ))}
            </ol>

            {step === 0 ? (
              <SocialShareStep
                key="linkedin"
                platform="linkedin"
                image={shareImage}
                text={shareText}
                openUrl={buildLinkedInShareComposeUrlFromFullText(shareText)}
                link={linkedinUrl}
                onLinkChange={setLinkedinUrl}
              />
            ) : (
              <SocialShareStep
                key="instagram"
                platform="instagram"
                image={shareImage}
                text={shareText}
                openUrl={instagramShareOpenUrl()}
                link={instagramUrl}
                onLinkChange={setInstagramUrl}
              />
            )}

            {step === 1 ? (
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
                <span>Both posts are public and these are my links.</span>
              </label>
            ) : null}

            {localError || serverError ? (
              <p role="alert" className="flex items-start gap-2 text-sm text-[#ff6f9f]">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {localError ?? serverError}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              {step === 1 ? (
                <button type="button" className={hkSecondaryButton} onClick={() => goToStep(0)}>
                  Back
                </button>
              ) : editing ? (
                <button type="button" className={hkSecondaryButton} onClick={() => setEditing(false)}>
                  Cancel
                </button>
              ) : (
                <span />
              )}
              {step === 0 ? (
                <button type="button" className="hk-btn h-12 w-full px-6 text-sm sm:w-auto" onClick={nextToInstagram}>
                  Next: Instagram
                </button>
              ) : (
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
              )}
            </div>
          </div>
          <SocialFollowAndRateActions />
        </form>
      ) : null}
    </div>
  );
}
