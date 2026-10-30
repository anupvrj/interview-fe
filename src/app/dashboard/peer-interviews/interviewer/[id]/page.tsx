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
import { dash2026Scope, Eyebrow } from "@/components/dashboard-2026/ui";
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
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/70 px-2.5 py-1.5 text-[12.5px] font-medium text-foreground/80">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
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
        "min-w-0 flex-1 rounded-2xl border px-3 py-3 sm:min-w-[8rem] sm:px-4",
        accent === "rating" && "border-amber-500/25 bg-amber-500/[0.07]",
        accent === "primary" && "border-primary/25 bg-primary/[0.06]",
        accent === "default" && "border-border bg-background/70",
      )}
    >
      <p className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-[22px] font-extrabold tracking-tight tabular-nums text-foreground">{value}</p>
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
      <div className="flex h-72 items-center justify-center rounded-[22px] border border-border bg-card">
        <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
      </div>
    );
  }

  if (!interviewer) {
    return (
      <div className={cn(dash2026Scope, "flex flex-col items-center gap-3 rounded-[22px] border border-border bg-card px-6 py-16 text-center")}>
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
              "group relative flex flex-col rounded-[18px] border border-border bg-card p-4 ring-1 ring-transparent transition-all duration-200 hover:border-primary/35",
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
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {meta.defaultDurationMins} MIN
                </span>
              ) : (
                <span />
              )}
              <div className="text-right">
                <p className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-wider text-muted-foreground">
                  per session
                </p>
                <p className="text-[22px] font-extrabold tracking-tight tabular-nums text-foreground">₹{price ?? "—"}</p>
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
    <div className={cn(dash2026Scope, "mx-auto w-full max-w-7xl space-y-5 lg:space-y-6")}>
      <div className="relative overflow-hidden rounded-[22px] border border-border bg-card">
        <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_70%_at_8%_0%,rgba(115,103,240,.14),transparent_70%),radial-gradient(40%_70%_at_95%_20%,rgba(31,143,255,.09),transparent_70%)]" />
        <div className="relative flex items-center justify-between gap-3 px-5 pt-5 sm:px-8 sm:pt-7">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All interviewers
          </button>
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background/70 px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[10.5px] text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", availabilityLabel.className)} />
            {availabilityLabel.text.toUpperCase()} FOR BOOKINGS
          </span>
        </div>
        <div className="relative px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div className="flex items-start gap-3 sm:gap-4">
                {interviewer.profilePictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={interviewer.profilePictureUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-border sm:h-24 sm:w-24"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-br from-[#F1EEFF] to-[#E3EEFF] text-lg font-black text-primary dark:from-primary/20 dark:to-sky-500/10 sm:h-24 sm:w-24 sm:text-3xl">
                    {initials(interviewer.name)}
                  </span>
                )}

                <div className="min-w-0 flex-1 pt-0.5">
                  <Eyebrow>PEER INTERVIEWER</Eyebrow>
                  <h1 className="mt-3 text-[28px] font-black leading-[1.05] tracking-[-0.045em] text-foreground sm:text-[38px]">
                    {interviewer.name}
                  </h1>
                  <p className="mt-1 text-[15px] text-muted-foreground sm:text-[16px]">
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
                className="h-10 w-fit gap-2 rounded-xl border-primary/30 bg-card/80 px-4 text-[13.5px] text-primary backdrop-blur-sm hover:bg-primary/5 hover:text-primary"
              >
                <IndianRupee className="h-4 w-4" />
                See prices by round
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

      <div className="overflow-hidden rounded-[22px] border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-5 md:p-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>PICK A SLOT</Eyebrow>
            <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.035em] text-foreground">When do you want to sit down?</h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />Open</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" />Already booked</span>
            </p>
          </div>
          <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-muted-foreground sm:text-right">
            {openSlotCount} SLOT{openSlotCount === 1 ? "" : "S"} OPEN
          </span>
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
        <DialogContent className={cn(dash2026Scope, "max-h-[85vh] max-w-2xl overflow-y-auto rounded-[22px] p-6 sm:p-7")}>
          <DialogHeader>
            <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary">— PRICES BY ROUND —</p>
            <DialogTitle className="text-[22px] font-extrabold tracking-[-0.03em]">{interviewer.name.split(" ")[0]}&apos;s rounds</DialogTitle>
            <DialogDescription>
              Interview types this engineer offers. You pay only after they accept your slot request.
            </DialogDescription>
          </DialogHeader>
          {pricingCards}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSlot} onOpenChange={(o) => !o && setSelectedSlot(null)}>
        <DialogContent className={cn(dash2026Scope, "max-w-md gap-0 overflow-hidden rounded-[22px] p-0")}>
          <div className="relative border-b border-border px-6 py-5">
            <div aria-hidden className="bg-blueprint mask-fade pointer-events-none absolute inset-0 opacity-60" />
            <DialogHeader className="relative space-y-1 text-left">
              <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary">— BOOK WITH {interviewer.name.split(" ")[0].toUpperCase()} —</p>
              <DialogTitle className="text-[22px] font-extrabold tracking-[-0.03em]">Book this slot</DialogTitle>
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
              <p className="mb-2.5 font-[family-name:var(--font-geist-mono)] text-[10.5px] tracking-wider text-muted-foreground">CHOOSE A ROUND</p>
              <div className="space-y-2">
                {selectedSlot?.availableForTypes.map((t) => {
                  const active = chosenType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setChosenType(t)}
                      aria-pressed={active}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                        active
                          ? "border-primary bg-primary/[0.06] shadow-[0_0_0_4px_rgba(115,103,240,0.12)]"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border-2", active ? "border-primary bg-primary" : "border-border")}>
                        {active ? <span className="size-1.5 rounded-full bg-white" /> : null}
                      </span>
                      <span className="flex-1 text-[14px] font-medium">{typeNames[t] || t}</span>
                      <span className="text-[15px] font-extrabold tabular-nums text-foreground">
                        ₹{selectedSlot?.prices[t]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-3.5 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                No payment now. You&apos;ll be charged only after {interviewer.name.split(" ")[0]}{" "}
                accepts your request.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" className="h-11 rounded-xl px-4" onClick={() => setSelectedSlot(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void confirmBooking()}
              disabled={booking || !chosenType}
              className="h-11 rounded-xl px-5 font-semibold shadow-[0_10px_24px_-12px_rgba(115,103,240,.8)] hover:bg-primary/90"
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
