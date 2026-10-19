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

const BRIEFING_ITEMS = [
  "Allow mic, camera, and screenshare when the browser asks — the interview cannot run without them.",
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

  return (
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogContent
        onEscapeKeyDown={(event) => event.preventDefault()}
        className={cn(journey.dialog, "mx-4 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto sm:max-w-2xl")}
      >
        <AlertDialogHeader className={journey.headerBand}>
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

        <div className={journey.body}>
          <ul className="list-disc space-y-1.5 pl-5 text-left text-sm leading-5 text-muted-foreground">
            {BRIEFING_ITEMS.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>

        <AlertDialogFooter className={cn(journey.footer, "sm:justify-center")}>
          <Button
            type="button"
            size="lg"
            disabled={connecting}
            onClick={onAccept}
            className={cn(journey.primaryButton, "min-w-[120px]")}
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
