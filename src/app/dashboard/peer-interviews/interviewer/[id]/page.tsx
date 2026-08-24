"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Code2,
  Globe2,
  Handshake,
  IndianRupee,
  Layers,
  Loader2,
  MessageCircle,
  Network,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PeerCalendarGrid } from "@/components/peer/PeerCalendarGrid";
import { PeerTimezoneBadge, PeerTimezoneSelect } from "@/components/peer/PeerTimezoneSelect";
import { usePeerTimezone } from "@/components/peer/usePeerTimezone";
import { formatPeerSchedule, formatPeerTimezoneLabel, isSlotStartInPast } from "@/components/peer/peerSlotTime";
import { appCard } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import {
  peerApi,
  type PeerInterviewType,
  type PeerInterviewerCard,
  type PeerSlot,
} from "@/lib/api";
import { useDashboardInvalidation } from "@/hooks/useDashboardInvalidation";

const ROUND_STYLE: Record<
  string,
  { icon: typeof Code2; iconBg: string; iconText: string; ring: string }
> = {
  general_screening: {
    icon: MessageCircle,
    iconBg: "bg-sky-500/10",
    iconText: "text-sky-600",
    ring: "group-hover:ring-sky-500/20",
  },
  live_coding: {
    icon: Code2,
    iconBg: "bg-violet-500/10",
    iconText: "text-[#7367F0]",
    ring: "group-hover:ring-[#7367F0]/25",
  },
  system_design: {
    icon: Network,
    iconBg: "bg-indigo-500/10",
    iconText: "text-indigo-600",
    ring: "group-hover:ring-indigo-500/20",
  },
  managerial: {
    icon: Users,
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-600",
    ring: "group-hover:ring-emerald-500/20",
  },
  salary_negotiation: {
    icon: IndianRupee,
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600",
    ring: "group-hover:ring-amber-500/20",
  },
  culture_fit_hr: {
    icon: Handshake,
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-600",
    ring: "group-hover:ring-rose-500/20",
  },
};

const DEFAULT_ROUND_STYLE = {
  icon: Layers,
  iconBg: "bg-[#7367F0]/10",
  iconText: "text-[#7367F0]",
  ring: "group-hover:ring-[#7367F0]/20",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function MetaChip({
  icon: Icon,
  children,
}: {
  icon: typeof Briefcase;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0 text-[#7367F0]/80" />
      {children}
    </span>
  );
}

function StatTile({
  label,
  value,
  sub,
  accent = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: "default" | "rating" | "primary";
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 rounded-xl border px-2.5 py-2.5 sm:min-w-[7.5rem] sm:px-4 sm:py-3",
        accent === "rating" && "border-amber-200/80 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30",
        accent === "primary" && "border-[#7367F0]/20 bg-[#7367F0]/[0.06]",
        accent === "default" && "border-border/60 bg-card",
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground sm:mt-1 sm:text-xl">{value}</p>
      {sub ? <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">{sub}</p> : null}
    </div>
  );
}

export default function InterviewerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { invalidate } = useDashboardInvalidation();

  const [interviewer, setInterviewer] = useState<PeerInterviewerCard | null>(null);
  const [slots, setSlots] = useState<PeerSlot[]>([]);
  const [types, setTypes] = useState<PeerInterviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<PeerSlot | null>(null);
  const [chosenType, setChosenType] = useState<string>("");
  const [booking, setBooking] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const { timezone, setTimezone, saving: savingTimezone, timezoneLabel, loading: tzLoading } =
    usePeerTimezone();

  const typeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of types) m[t.key] = t.name;
    return m;
  }, [types]);

  const typeMeta = useMemo(() => {
    const m: Record<string, PeerInterviewType> = {};
    for (const t of types) m[t.key] = t;
    return m;
  }, [types]);

  const bookableSlots = useMemo(
    () => slots.filter((s) => !isSlotStartInPast(s.start)),
    [slots],
  );

  const openSlotCount = useMemo(
    () => bookableSlots.filter((s) => s.status === "open").length,
    [bookableSlots],
  );

  const minPrice = useMemo(() => {
    const prices = Object.values(interviewer?.pricing || {}).filter((n) => n > 0);
    return prices.length ? Math.min(...prices) : null;
  }, [interviewer]);

  useEffect(() => {
    peerApi.listInterviewTypes().then(setTypes).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    peerApi
      .getInterviewer(id)
      .then((res) => {
        setInterviewer(res.interviewer);
        setSlots(res.slots);
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to load interviewer"))
      .finally(() => setLoading(false));
  }, [id]);

  const openBooking = (slot: PeerSlot) => {
    if (isSlotStartInPast(slot.start)) {
      toast.error("This slot is in the past and cannot be booked");
      return;
    }
    setSelectedSlot(slot);
    setChosenType(slot.availableForTypes[0] || "");
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !chosenType) return;
    if (isSlotStartInPast(selectedSlot.start)) {
      toast.error("This slot is in the past and cannot be booked");
      setSelectedSlot(null);
      return;
    }
    setBooking(true);
    try {
      const created = await peerApi.createBooking({
        slotId: selectedSlot.id,
        interviewType: chosenType,
      });
      toast.success("Request sent! The interviewer will review and accept it.");
      await invalidate(["peerBookings", "entitlements"]);
      router.push(`/dashboard/peer-interviews/bookings/${created.id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not create booking");
    } finally {
      setBooking(false);
      setSelectedSlot(null);
    }
  };

  if (loading) {
    return (
      <div className={cn(appCard, "flex h-72 items-center justify-center")}>
        <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (!interviewer) {
    return (
      <div className={cn(appCard, "flex flex-col items-center gap-3 px-6 py-16 text-center")}>
        <p className="text-lg font-semibold">Interviewer not found</p>
        <Link href="/dashboard/peer-interviews/book">
          <Button variant="outline">Back to directory</Button>
        </Link>
      </div>
    );
  }

  const pricingCards = (
    <div className="grid gap-3 sm:grid-cols-2">
      {interviewer.canTakeTypes.map((roundKey) => {
        const style = ROUND_STYLE[roundKey] ?? DEFAULT_ROUND_STYLE;
        const Icon = style.icon;
        const meta = typeMeta[roundKey];
        const price = interviewer.pricing[roundKey];

        return (
          <div
            key={roundKey}
            className={cn(
              "group relative flex flex-col rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-4 ring-1 ring-transparent transition-all duration-200 hover:border-[#7367F0]/25",
              style.ring,
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  style.iconBg,
                )}
              >
                <Icon className={cn("h-5 w-5", style.iconText)} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="font-semibold leading-snug text-foreground">
                  {typeNames[roundKey] || roundKey}
                </p>
                {meta?.shortDescription ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {meta.shortDescription}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-3">
              {meta?.defaultDurationMins ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {meta.defaultDurationMins} min
                </span>
              ) : (
                <span />
              )}
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  per session
                </p>
                <p className="text-xl font-bold tabular-nums text-[#7367F0]">₹{price ?? "—"}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const availabilityLabel =
    interviewer.availabilityStatus === "away"
      ? { text: "Away", className: "bg-amber-500" }
      : { text: "Available", className: "bg-emerald-500" };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="-ml-2 h-9 w-fit text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to interviewers
        </Button>
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className={cn("h-2 w-2 rounded-full", availabilityLabel.className)} />
          {availabilityLabel.text} for bookings
        </span>
      </div>

      <div className={cn(appCard, "relative overflow-hidden p-0")}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-[#7367F0]/20 via-[#7367F0]/8 to-transparent" />
        <div className="relative px-4 pb-5 pt-5 sm:px-6 sm:pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div className="flex items-start gap-3 sm:gap-4">
                {interviewer.profilePictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={interviewer.profilePictureUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-lg ring-4 ring-card sm:h-24 sm:w-24"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7367F0] to-[#9e95f5] text-lg font-bold text-white shadow-lg ring-4 ring-card sm:h-24 sm:w-24 sm:text-2xl">
                    {initials(interviewer.name)}
                  </span>
                )}

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#7367F0] sm:text-xs">
                    Peer interviewer
                  </p>
                  <h1 className="mt-0.5 text-lg font-semibold leading-tight tracking-tight sm:mt-1 sm:text-2xl lg:text-3xl">
                    {interviewer.name}
                  </h1>
                  <p className="mt-0.5 text-sm text-muted-foreground sm:mt-1 sm:text-base">
                    {interviewer.jobRole}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <MetaChip icon={Briefcase}>{interviewer.company}</MetaChip>
                {interviewer.industry ? (
                  <MetaChip icon={Building2}>{interviewer.industry}</MetaChip>
                ) : null}
                <MetaChip icon={Clock}>{interviewer.yearsOfExperience}+ yrs exp.</MetaChip>
                {interviewer.timezone ? (
                  <MetaChip icon={Globe2}>
                    {formatPeerTimezoneLabel(interviewer.timezone)}
                  </MetaChip>
                ) : null}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPricingOpen(true)}
                className="h-9 w-fit gap-2 border-[#7367F0]/30 bg-card/80 text-[#7367F0] shadow-sm backdrop-blur-sm hover:bg-[#7367F0]/5 hover:text-[#7367F0]"
              >
                <IndianRupee className="h-4 w-4" />
                View Pricing
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3 lg:max-w-md lg:justify-end">
              <StatTile
                label="Rating"
                accent="rating"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    {interviewer.ratingCount > 0 ? interviewer.ratingAvg.toFixed(1) : "New"}
                  </span>
                }
                sub={`${interviewer.ratingCount} review${interviewer.ratingCount === 1 ? "" : "s"}`}
              />
              <StatTile
                label="Open slots"
                accent="primary"
                value={openSlotCount}
                sub="Ready to book"
              />
              <StatTile
                label="Starts at"
                value={minPrice != null ? `₹${minPrice}` : "—"}
                sub={`${interviewer.canTakeTypes.length} round types`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={cn(appCard, "overflow-hidden p-0")}>
        <div className="flex flex-col gap-1 border-b border-border/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7367F0]/10 text-[#7367F0]">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Pick an available slot</h2>
              <p className="text-sm text-muted-foreground">
                Green slots are open · Orange slots are already booked
              </p>
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground sm:text-right">
            {openSlotCount} slot{openSlotCount === 1 ? "" : "s"} available
          </p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <PeerTimezoneSelect
              timezone={timezone}
              onChange={setTimezone}
              disabled={tzLoading || savingTimezone}
              className="max-w-md flex-1"
            />
            <PeerTimezoneBadge label={timezoneLabel} />
          </div>
          <PeerCalendarGrid
            mode="candidate"
            slots={bookableSlots}
            timezone={timezone}
            onSelectSlot={openBooking}
          />
        </div>
      </div>

      <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Pricing</DialogTitle>
            <DialogDescription>
              Interview types this engineer offers. You pay only after they accept your slot request.
            </DialogDescription>
          </DialogHeader>
          {pricingCards}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSlot} onOpenChange={(o) => !o && setSelectedSlot(null)}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
          <div className="border-b border-border/60 bg-gradient-to-br from-[#7367F0]/10 to-transparent px-6 py-5">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle>Book this slot</DialogTitle>
              <DialogDescription className="text-sm">
                {selectedSlot
                  ? formatPeerSchedule(selectedSlot.start, timezone, { dateStyle: "full" })
                  : ""}
              </DialogDescription>
              {selectedSlot ? (
                <PeerTimezoneBadge label={timezoneLabel} className="mt-2" />
              ) : null}
            </DialogHeader>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div>
              <p className="mb-2.5 text-sm font-medium">Choose interview round</p>
              <div className="space-y-2">
                {selectedSlot?.availableForTypes.map((t) => {
                  const active = chosenType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setChosenType(t)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                        active
                          ? "border-[#7367F0] bg-[#7367F0]/[0.06] ring-1 ring-[#7367F0]/30"
                          : "border-border/60 hover:border-[#7367F0]/30 hover:bg-muted/30",
                      )}
                    >
                      <span className="text-sm font-medium">{typeNames[t] || t}</span>
                      <span className="text-sm font-semibold tabular-nums text-[#7367F0]">
                        ₹{selectedSlot?.prices[t]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200/60 bg-emerald-50/60 px-3.5 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                No payment now. You&apos;ll be charged only after {interviewer.name.split(" ")[0]}{" "}
                accepts your request.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border/60 bg-muted/20 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setSelectedSlot(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void confirmBooking()}
              disabled={booking || !chosenType}
              className="bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              {booking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send booking request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
