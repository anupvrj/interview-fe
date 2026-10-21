"use client";

import { useUser } from "@clerk/nextjs";
import { Info, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { JourneyIconTile, journey } from "@/components/interview/journey-ui";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supportsDisplayMediaCapture } from "@/lib/codingSessionRecording";
import {
  PermissionAllowedNote,
  PermissionGuide,
  queryCameraMicState,
  type CameraMicState,
} from "@/components/interview/PermissionGuide";

const PERMISSIONS_DESKTOP =
  "Allow mic, camera, and screenshare when the browser asks — the interview cannot run without them.";
/** Phones can't share a screen; they record camera + mic instead. */
const PERMISSIONS_PHONE =
  "Allow mic and camera when the browser asks — the interview cannot run without them.";

const BRIEFING_ITEMS = [
  PERMISSIONS_DESKTOP,
  "Sit in a quiet place. Background noise makes answers unclear in the transcript and report.",
  "Use headphones. Keep the camera on and look at the camera while you speak.",
  "Light your face and use a clean background. More than one person on camera lowers your score and can be flagged in the report.",
  "Stay on this tab. Refreshing or switching apps can drop the session.",
  "Speak clearly and wait until the interviewer finishes before you answer.",
  "Finish the session so transcripts, scores, and coaching can be generated.",
] as const;

type InterviewBriefingDialogProps = {
  open: boolean;
  connecting: boolean;
  onAccept: () => void;
};

export function InterviewBriefingDialog({
  open,
  connecting,
  onAccept,
}: Readonly<InterviewBriefingDialogProps>) {
  const { user } = useUser();
  const firstName =
    user?.firstName?.trim() ||
    user?.fullName?.trim().split(/\s+/)[0] ||
    "there";
  const [canShareScreen, setCanShareScreen] = useState(true);
  useEffect(() => {
    setCanShareScreen(supportsDisplayMediaCapture());
  }, []);
  // Follow the camera/mic permission live: the browser asks while this dialog is open.
  const [access, setAccess] = useState<CameraMicState>("unknown");
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const refresh = () => void queryCameraMicState().then((s) => alive && setAccess(s));
    refresh();
    const timer = setInterval(refresh, 1500);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [open]);
  const items = BRIEFING_ITEMS.map((text) =>
    text === PERMISSIONS_DESKTOP && !canShareScreen ? PERMISSIONS_PHONE : text,
  );

  return (
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogContent
        onEscapeKeyDown={(event) => event.preventDefault()}
        className={cn(journey.dialog, "flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden sm:max-w-2xl")}
      >
        <AlertDialogHeader className={cn(journey.headerBand, "shrink-0 py-4 sm:py-5")}>
          <div className="flex flex-col items-center text-center">
            <JourneyIconTile tone="warning" size="lg" className="mb-3">
                <Info className="h-7 w-7" aria-hidden />
              </JourneyIconTile>
            <AlertDialogTitle className={journey.title}>
              Hey {firstName}, before you start..
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(journey.description, "mt-2")}>
              Read these once, then accept to connect and begin your interview.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {/* Only the list scrolls, so the accept button stays on screen on small phones. */}
        <div className={cn(journey.body, "min-h-0 flex-1 overflow-y-auto")}>
          {access === "granted" ? (
            <PermissionAllowedNote className="mb-3" />
          ) : (
            <PermissionGuide mode={access === "denied" ? "unblock" : "allow"} className="mb-4" />
          )}
          <ul className="list-disc space-y-1.5 pl-5 text-left text-[13px] leading-5 text-muted-foreground sm:text-sm">
            {items.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>

        <AlertDialogFooter className={cn(journey.footer, "shrink-0 sm:justify-center")}>
          <Button
            type="button"
            size="lg"
            disabled={connecting}
            onClick={onAccept}
            className={cn(journey.primaryButton, "w-full min-w-[120px] sm:w-auto")}
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting…
              </>
            ) : (
              "Accept and Start Interview"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
