"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, ExternalLink, Instagram, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { instagramShareOpenUrl } from "../social-links";
import { hackathonReelFontVars } from "@/lib/fonts/hackathon-reel";
import { cn } from "@/lib/utils";

/**
 * Ready-made post images (1080×1080) in public/hackathon-2026/instagram-post-images.
 * The page shows JPEG copies — preview/ (1080px, so a long-press inside Instagram's browser
 * still saves a full-size image) and thumb/ (160px); Download gives the original PNG.
 * To add one: drop the PNG in the folder, make its preview/ and thumb/ JPEGs, list it here.
 */
const IMAGE_DIR = "/hackathon-2026/instagram-post-images";
export const INSTAGRAM_POST_IMAGES = [
  { id: "IX_HG_Share_1_AIInterviewer", label: "AI interviewer" },
  { id: "IX_HG_Share_2_ParticipantBadge", label: "Completed badge" },
  { id: "IX_HG_Share_3_HackathonPass", label: "Hackathon pass" },
  { id: "IX_HG_Share_4_ChallengeAccepted", label: "Challenge accepted" },
  { id: "IX_HG_Share_5_BuildPracticeHired", label: "Build. Practice. Get hired." },
  { id: "IX_HG_Share_6_JustCompleted", label: "Just completed" },
  { id: "IX_HG_Share_7_LightProud", label: "So happy I completed" },
] as const;

type PostImage = (typeof INSTAGRAM_POST_IMAGES)[number];
const fullUrl = (img: PostImage) => `${IMAGE_DIR}/${img.id}.png`;
const previewUrl = (img: PostImage) => `${IMAGE_DIR}/preview/${img.id}.jpg`;
const thumbUrl = (img: PostImage) => `${IMAGE_DIR}/thumb/${img.id}.jpg`;
const downloadName = (img: PostImage) => `InterviewTrix-HiringGames-${img.id.replace(/^IX_HG_Share_\d+_/, "")}.png`;

type InstagramShareModalProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareText: string;
}>;

const ghostButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/60 bg-transparent px-4 text-sm font-semibold text-white hover:border-white hover:bg-white/[0.06] disabled:opacity-60";

/** One step: number (tick when done), title, and a highlight when it's the one to do next. */
function Step({
  n,
  title,
  done,
  current,
  children,
}: Readonly<{ n: number; title: string; done: boolean; current: boolean; children: React.ReactNode }>) {
  return (
    <li
      className={cn(
        "min-w-0 rounded-2xl border p-3.5 sm:p-4",
        current ? "border-[#3aa0ff] bg-[#0b2142]/70" : done ? "border-[#29d6a0]/40 bg-[#0b2e2b]/20" : "border-[#27547d]/60 bg-[#040b17]/40",
      )}
      aria-current={current ? "step" : undefined}
    >
      <p className="mb-3 flex items-center gap-2.5 text-[15px] font-semibold text-white">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold",
            done ? "bg-[#29d6a0] text-[#041a14]" : current ? "bg-[#1677ff] text-white" : "bg-[#173252] text-[#9eb2ca]",
          )}
          aria-hidden
        >
          {done ? <Check className="size-4" /> : n}
        </span>
        {title}
        {done ? <span className="ml-auto text-xs font-medium text-[#29d6a0]">Done</span> : null}
      </p>
      {children}
    </li>
  );
}

/**
 * Self-guided Instagram share: (1) pick one of the ready-made images — one is chosen at
 * random — and save it, (2) copy the caption, (3) post it on Instagram. The step to do
 * next is highlighted and done steps get a tick. Instagram can't take a post from a
 * website, so on phones that can share files the image goes to the share sheet (Instagram
 * is in it); otherwise it's downloaded (or long-pressed to save inside in-app browsers).
 */
export function InstagramShareModal({ open, onOpenChange, shareText }: InstagramShareModalProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [imageSaved, setImageSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShareFile, setCanShareFile] = useState(false);
  const [busy, setBusy] = useState(false);
  const image = INSTAGRAM_POST_IMAGES[imageIndex];
  const current = useMemo(() => (!imageSaved ? 1 : !copied ? 2 : 3), [imageSaved, copied]);

  useEffect(() => {
    if (!open) return;
    setImageIndex(Math.floor(Math.random() * INSTAGRAM_POST_IMAGES.length));
    setImageSaved(false);
    setCopied(false);
    try {
      const probe = new File([new Blob([""], { type: "image/png" })], "probe.png", { type: "image/png" });
      setCanShareFile(typeof navigator.canShare === "function" && navigator.canShare({ files: [probe] }));
    } catch {
      setCanShareFile(false);
    }
  }, [open]);

  const imageFile = async () => {
    const blob = await (await fetch(fullUrl(image))).blob();
    return new File([blob], downloadName(image), { type: blob.type || "image/png" });
  };

  const copyCaption = async (silent = false) => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      if (!silent) toast.success("Caption copied — you'll paste it on Instagram.");
    } catch {
      toast.error("Couldn't copy. Press and hold the caption to select and copy it.");
    }
  };

  const shareImage = async () => {
    setBusy(true);
    try {
      await copyCaption(true); // the share sheet takes only the image; the caption is pasted on Instagram
      await navigator.share({ files: [await imageFile()] });
      setImageSaved(true);
      toast.success("Caption copied too — paste it in your post.");
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") toast.error("Couldn't open sharing. Use Download image instead.");
    } finally {
      setBusy(false);
    }
  };

  const downloadImage = async () => {
    setBusy(true);
    try {
      const url = URL.createObjectURL(await imageFile());
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName(image);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setImageSaved(true);
    } catch {
      window.open(fullUrl(image), "_blank", "noopener,noreferrer");
      setImageSaved(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-[#020810]/75"
        className={`hk-root hk-modal ${hackathonReelFontVars} max-h-[92svh] w-[calc(100%-1rem)] max-w-xl gap-0 overflow-y-auto overflow-x-hidden [&>*]:min-w-0 border border-[#27547d]/90 bg-[#071426] p-0 text-[#dbe9f8] shadow-none`}
      >
        <DialogHeader className="space-y-1.5 border-b border-[#27547d]/60 px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-white">
            <Instagram className="size-5 text-[#ff5f97]" aria-hidden />
            Post on Instagram in 3 steps
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-[#9eb2ca]">
            We've made the image and the caption for you. Save the image, copy the caption, and post.
          </DialogDescription>
          <p className="pt-1 text-xs font-semibold text-[#6fc0ff]" aria-live="polite">
            Step {current} of 3
          </p>
        </DialogHeader>

        <ol className="min-w-0 space-y-3 px-3 py-4 sm:px-5">
          <Step n={1} title="Save your post image" done={imageSaved} current={current === 1}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl(image)}
              alt={`Post image: ${image.label}`}
              width={1080}
              height={1080}
              className="mx-auto aspect-square w-full max-w-[18rem] rounded-xl border border-[#27547d]/80 bg-[#040b17] object-cover"
            />
            <p className="mt-3 text-center text-xs text-[#9eb2ca]">We picked this one for you. Like another? Tap it below.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5" role="radiogroup" aria-label="Choose a post image">
              {INSTAGRAM_POST_IMAGES.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  role="radio"
                  aria-checked={i === imageIndex}
                  aria-label={img.label}
                  onClick={() => {
                    setImageIndex(i);
                    setImageSaved(false);
                  }}
                  className={cn(
                    "size-9 shrink-0 overflow-hidden rounded-lg border-2 sm:size-11",
                    i === imageIndex ? "border-[#3aa0ff]" : "border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl(img)} alt="" width={160} height={160} className="size-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {canShareFile ? (
                <button type="button" onClick={() => void shareImage()} disabled={busy} className={cn(imageSaved ? ghostButton : "hk-btn h-12 px-4 text-sm", "w-full")}>
                  <Share2 className="size-4" aria-hidden />
                  Share image to Instagram
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void downloadImage()}
                disabled={busy}
                className={cn(canShareFile || imageSaved ? ghostButton : "hk-btn h-12 px-4 text-sm", "w-full")}
              >
                <Download className="size-4" aria-hidden />
                {imageSaved ? "Download again" : "Download image"}
              </button>
              <p className="text-center text-xs leading-relaxed text-[#7189a6]">
                Inside Instagram and nothing happens? Press and hold the image above and choose “Save image”.
              </p>
            </div>
          </Step>

          <Step n={2} title="Copy the caption" done={copied} current={current === 2}>
            <pre className="hk-modal-panel max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-[#27547d]/80 bg-[#040b17] px-3 py-2.5 font-sans text-xs leading-relaxed text-[#cfdbe8] select-text">
              {shareText}
            </pre>
            <button
              type="button"
              onClick={() => void copyCaption()}
              className={cn(current === 2 ? "hk-btn h-12 px-4 text-sm" : ghostButton, "mt-2 w-full")}
            >
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "Caption copied" : "Copy caption"}
            </button>
          </Step>

          <Step n={3} title="Post it on Instagram" done={false} current={current === 3}>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-[#cfdbe8] marker:text-[#6fc0ff]">
              <li>
                Open Instagram and tap <strong className="text-white">+</strong> → <strong className="text-white">Post</strong>.
              </li>
              <li>Pick the image you just saved.</li>
              <li>
                Paste the caption and tag <strong className="text-white">@interviewtrix_official</strong>.
              </li>
              <li>
                Share it (keep your account <strong className="text-white">public</strong>), then copy the post link and paste it in
                the Instagram box below.
              </li>
            </ol>
            <a
              href={instagramShareOpenUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (!copied) void copyCaption(true);
              }}
              className={cn(current === 3 ? "hk-btn h-12 px-4 text-sm" : ghostButton, "mt-3 w-full")}
            >
              <Instagram className="size-4" aria-hidden />
              Open Instagram
              <ExternalLink className="size-3.5 opacity-70" aria-hidden />
            </a>
          </Step>
        </ol>
      </DialogContent>
    </Dialog>
  );
}
