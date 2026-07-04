"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock,
  IndianRupee,
  Loader2,
  Lock,
  TriangleAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InterviewerOnboardingForm } from "@/components/peer/InterviewerOnboardingForm";
import {
  buildInterviewerCandidateReviews,
  InterviewerRatingReviewsButton,
} from "@/components/peer/InterviewerRatingReviewsButton";
import { InterviewerBookingsTable } from "@/components/peer/InterviewerDashboardBookingLists";
import { PeerTimezoneSettingsButton } from "@/components/peer/PeerTimezoneSelect";
import { usePeerTimezone } from "@/components/peer/usePeerTimezone";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import { isPeerInterviewExpired, isUnpaidPeerBookingStatus } from "@/lib/peer-booking-expiry";
import {
  peerApi,
  type PeerAvailability,
  type PeerBooking,
  type PeerInterviewType,
  type PeerInterviewerProfile,
  type PeerInterviewerAnalytics,
} from "@/lib/api";

export default function InterviewerHubPage() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const [profile, setProfile] = useState<PeerInterviewerProfile | null>(null);
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [analytics, setAnalytics] = useState<PeerInterviewerAnalytics | null>(null);
  const [bookings, setBookings] = useState<PeerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAvail, setSavingAvail] = useState(false);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const { timezone, setTimezone, saving: savingTimezone, timezoneLabel, loading: tzLoading } =
    usePeerTimezone();

  const typeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of types) m[t.key] = t.name;
    return m;
  }, [types]);

  const pendingCount = useMemo(
    () =>
      bookings.filter(
        (b) => isUnpaidPeerBookingStatus(b.status) && !isPeerInterviewExpired(b),
      ).length,
    [bookings],
  );

  const candidateReviews = useMemo(
    () => buildInterviewerCandidateReviews(bookings, typeNames),
    [bookings, typeNames],
  );

  const load = async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        peerApi.getMyInterviewerProfile(),
        peerApi.listInterviewTypes(),
      ]);
      setProfile(p);
      setTypes(t);
      if (p?.status === "approved") {
        const [a, b] = await Promise.all([
          peerApi.getAnalytics().catch(() => null),
          peerApi.listInterviewerBookings().catch(() => []),
        ]);
        setAnalytics(a);
        setBookings(b);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;
    void load();
  }, [isLoaded, user]);

  useEffect(() => {
    if (!loading && isLoaded && profile === null) {
      router.replace("/dashboard/peer-interviews/interviewer/apply");
    }
  }, [loading, isLoaded, profile, router]);

  const setAvailability = async (status: PeerAvailability) => {
    setSavingAvail(true);
    try {
      const updated = await peerApi.setAvailability(status);
      setProfile(updated);
      toast.success(`You are now ${status}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not update availability");
    } finally {
      setSavingAvail(false);
    }
  };

  const acceptBooking = async (bookingId: string) => {
    setBusyBookingId(bookingId);
    try {
      await peerApi.acceptBooking(bookingId);
      toast.success("Booking accepted. The candidate can now pay.");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not accept booking");
      throw e;
    } finally {
      setBusyBookingId(null);
    }
  };

  const declineBooking = async (bookingId: string, reason: string) => {
    setBusyBookingId(bookingId);
    try {
      await peerApi.rejectBooking(bookingId, reason);
      toast.success("Booking declined");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not decline booking");
      throw e;
    } finally {
      setBusyBookingId(null);
    }
  };

  if (loading || !isLoaded || profile === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  // Status gates
  if (profile.status === "pending") {
    return (
      <StatusCard
        icon={<Clock className="h-10 w-10" />}
        tone="amber"
        title="Your application is under review"
        message="It may take up to 24–48 hours to approve your profile. Meanwhile, explore the platform. Slot creation is locked until you're approved."
      >
        <Link href="/dashboard">
          <Button variant="outline">Explore platform</Button>
        </Link>
      </StatusCard>
    );
  }

  if (profile.status === "rejected") {
    return (
      <StatusCard
        icon={<TriangleAlert className="h-10 w-10" />}
        tone="red"
        title="Application not approved"
        message={profile.rejectionReason || "Your application did not meet our criteria."}
      >
        <p className="text-sm text-muted-foreground">We'd love for you to apply again in the future.</p>
        <InterviewerOnboardingForm types={types} initialName={profile.name} onSubmitted={() => void load()} />
      </StatusCard>
    );
  }

  if (profile.status === "suspended" || profile.status === "blocked") {
    return (
      <StatusCard
        icon={<Lock className="h-10 w-10" />}
        tone="red"
        title={profile.status === "blocked" ? "Account blocked" : "Account suspended"}
        message={
          (profile.suspensionReason || "Your account is under review.") +
          " If this happened by mistake, please reach out to our admin team at info@interviewtrix.com."
        }
      />
    );
  }

  // Approved -> dashboard
  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviewer Dashboard"
        description="Manage your availability, slots and bookings."
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <InterviewerRatingReviewsButton
              ratingAvg={analytics?.ratingAvg ?? profile.ratingAvg ?? 0}
              ratingCount={analytics?.ratingCount ?? profile.ratingCount ?? 0}
              reviews={candidateReviews}
              className="min-w-0 flex-1 shrink basis-0 sm:flex-none sm:basis-auto"
            />
            <PeerTimezoneSettingsButton
              timezone={timezone}
              timezoneLabel={timezoneLabel}
              onChange={setTimezone}
              disabled={tzLoading}
              saving={savingTimezone}
              compact
              className="min-w-0 flex-1 shrink basis-0 px-2 sm:flex-none sm:basis-auto sm:px-3"
            />
            <Select
              value={profile.availabilityStatus}
              disabled={savingAvail}
              onValueChange={(value) => void setAvailability(value as PeerAvailability)}
            >
              <SelectTrigger
                id="availability-status"
                aria-label="Availability status"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 w-auto min-w-[11.5rem] gap-2 border-border bg-card px-3 font-semibold shadow-sm hover:border-primary hover:text-primary",
                )}
              >
                <CircleDot className="h-4 w-4 shrink-0" />
                <SelectValue placeholder="Availability" />
                {savingAvail ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#7367F0]" />
                ) : null}
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="away">Away</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/dashboard/peer-interviews/interviewer/slots">
              <Button variant="outline" className="h-10 gap-2 px-3 font-semibold shadow-sm">
                <CalendarClock className="h-4 w-4" /> Manage slots
              </Button>
            </Link>
            <Link href="/dashboard/peer-interviews/interviewer/earnings">
              <Button variant="outline" className="h-10 gap-2 px-3 font-semibold shadow-sm">
                <IndianRupee className="h-4 w-4" /> View earnings
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <DashboardStatCard
          theme="purple"
          label="Total bookings"
          value={analytics?.totalBookings ?? 0}
          icon={Users}
          hint={
            <>
              <Users className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>All time</span>
            </>
          }
        />
        <DashboardStatCard
          theme="emerald"
          label="Interviews done"
          value={analytics?.interviewsDone ?? 0}
          icon={CheckCircle2}
          hint={
            <>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>Completed sessions</span>
            </>
          }
        />
        <DashboardStatCard
          theme="amber"
          label="Pending requests"
          value={pendingCount}
          icon={Clock}
          hint={
            <>
              <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>Awaiting acceptance or payment</span>
            </>
          }
        />
        <DashboardStatCard
          theme="violet"
          label="Total earnings"
          value={`₹${analytics?.totalEarnings ?? 0}`}
          icon={IndianRupee}
          hint={
            <>
              <IndianRupee className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>Pending + approved + paid</span>
            </>
          }
        />
      </div>

      <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Bookings</CardTitle>
            <CardDescription className="mt-1 text-sm">
              All your peer interview bookings. Filter by status or round, then open details to accept,
              decline, or review the candidate.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          <InterviewerBookingsTable
            bookings={bookings}
            types={types}
            typeNames={typeNames}
            timezone={timezone}
            busyBookingId={busyBookingId}
            onAccept={acceptBooking}
            onDecline={declineBooking}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatusCard({
  icon,
  title,
  message,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  tone: "amber" | "red";
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title="Interviewer Dashboard" badge="Status" />
      <div className={cn(appCard, "flex flex-col items-center gap-4 px-6 py-12 text-center")}>
        <span
          className={cn(
            "flex h-20 w-20 items-center justify-center rounded-2xl",
            tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600",
          )}
        >
          {icon}
        </span>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="max-w-lg text-sm text-muted-foreground">{message}</p>
        {children}
      </div>
    </div>
  );
}
