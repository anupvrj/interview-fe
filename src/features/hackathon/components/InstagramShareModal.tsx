"use client";

import { Instagram, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { instagramShareOpenUrl } from "../social-links";

type InstagramShareModalProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareText: string;
}>;

export function InstagramShareModal({ open, onOpenChange, shareText }: InstagramShareModalProps) {
  const copyAndShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      window.open(instagramShareOpenUrl(), "_blank", "noopener,noreferrer");
      toast.success("Caption copied. On Instagram tap + → Post and paste your caption.");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't copy. Select the caption above and copy it manually, then open Instagram.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-[#020810]/75"
        className="max-h-[min(90vh,640px)] w-[calc(100%-2rem)] max-w-xl gap-0 overflow-hidden border border-[#27547d]/90 bg-[#071426] p-0 text-[#dbe9f8] shadow-none"
      >
        <DialogHeader className="space-y-2 border-b border-[#27547d]/60 px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-white">
            <Instagram className="size-5 text-[#ff5f97]" aria-hidden />
            Share on Instagram
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-[#9eb2ca]">
            Instagram does not support posting directly from other websites. Copy this caption and use it when you create
            your post on Instagram.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(50vh,320px)] overflow-y-auto px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7189a6]">Your caption</p>
          <pre className="whitespace-pre-wrap rounded-lg border border-[#27547d]/80 bg-[#040b17] px-3 py-2.5 text-xs leading-relaxed text-[#cfdbe8]">
            {shareText}
          </pre>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-[#27547d]/60 px-5 py-4 sm:flex-col sm:space-x-0">
          <p className="w-full text-center text-xs leading-relaxed text-[#7189a6]">
            Tap Copy &amp; Share to copy your caption and open Instagram. Then tap + → Post and paste.
          </p>
          <button type="button" onClick={() => void copyAndShare()} className="hk-btn h-12 w-full px-6 text-sm">
            <Share2 className="size-4" aria-hidden />
            Copy &amp; Share
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
