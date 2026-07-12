"use client";

import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PeerBooking } from "@/lib/api";

/**
 * Always navigates to the full peer report page so candidates see the
 * interviewer score / transcript report inline (not only in a dialog).
 */
export function PeerBookingViewReportButton({
  booking,
  className,
  size = "default",
  variant = "outline",
}: {
  booking: PeerBooking;
  timezone?: string;
  interviewLabel?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "link";
}) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() =>
        router.push(`/dashboard/peer-interviews/bookings/${booking.id}/report`)
      }
    >
      <FileText className="mr-2 h-4 w-4" />
      View report
    </Button>
  );
}

export function PeerBookingViewReportLink({
  booking,
  className,
  children,
}: {
  booking: PeerBooking;
  timezone?: string;
  interviewLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        router.push(`/dashboard/peer-interviews/bookings/${booking.id}/report`)
      }
    >
      {children}
    </button>
  );
}
