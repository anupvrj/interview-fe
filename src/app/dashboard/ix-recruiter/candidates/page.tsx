"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  FileText,
  Loader2,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { IndustryRoleFields } from "@/components/career/IndustryRoleFields";
import { CandidateStatusBadge } from "@/components/recruiter/RecruiterStatusBadges";
import { IxScoreFilterSlider } from "@/components/recruiter/IxScoreFilterSlider";
import { ProfileSkillsEditor, profileSkillsDialogOutsideHandlers } from "@/components/profile/ProfileSkillsEditor";
import {
  recruiterApi,
  type PeerPaginated,
  type TalentCandidateRow,
} from "@/lib/api";
import { appCard, appFilterBar, appPrimaryButton } from "@/lib/app-theme";
import { CANDIDATE_STATUS_LABELS, ixScoreTone } from "@/lib/recruiter";
import { cn } from "@/lib/utils";

const dialogShell =
  "flex w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden p-0 fixed left-[50%] top-[50%] max-h-[min(85dvh,32rem)] translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border bg-card shadow-header";

const dialogHeaderClass =
  "items-start space-y-1.5 border-b border-border/60 px-4 pb-4 pt-5 pr-12 text-left sm:px-5";

const CANDIDATE_STATUS_OPTIONS = Object.entries(CANDIDATE_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

type TalentFilters = {
  q: string;
  candidateStatus: string;
  role: string;
  industry: string;
  skills: string[];
  minIxScore: number;
};

type ExtraTalentFilters = Pick<TalentFilters, "skills" | "minIxScore">;

const EMPTY_FILTERS: TalentFilters = {
  q: "",
  candidateStatus: "",
  role: "",
  industry: "",
  skills: [],
  minIxScore: 0,
};

const EMPTY_EXTRA_FILTERS: ExtraTalentFilters = {
  skills: [],
  minIxScore: 0,
};

function formatSkillsParam(skills: string[]): string | undefined {
  const terms = [
    ...new Set(skills.map((skill) => skill.trim()).filter(Boolean)),
  ];
  return terms.length > 0 ? terms.join(",") : undefined;
}

const EMPTY: PeerPaginated<TalentCandidateRow> = {
  items: [],
  page: 1,
  pageSize: 15,
  total: 0,
  totalPages: 1,
};

function ToolbarIconButton({
  label,
  active,
  badge,
  onClick,
  children,
}: Readonly<{
  label: string;
  active?: boolean;
  badge?: number | boolean;
  onClick: () => void;
  children: ReactNode;
}>) {
  return (
    <span className="relative inline-flex shrink-0">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "h-11 w-11 border-border/60 bg-card",
          active && "border-[#7367F0]/40 bg-[#7367F0]/5 text-[#7367F0]",
        )}
      >
        {children}
      </Button>
      {badge ? (
        typeof badge === "number" ? (
          <span className="absolute -right-0.5 -top-0.5 z-10 flex h-4 min-w-[1rem] items-center justify-center rounded-full border-2 border-card bg-[#7367F0] px-1 text-[10px] font-semibold leading-none text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : (
          <span className="absolute -right-0.5 -top-0.5 z-10 h-2.5 w-2.5 rounded-full border-2 border-card bg-[#7367F0]" />
        )
      ) : null}
    </span>
  );
}

function TalentPrimaryFilterFields({
  idPrefix,
  values,
  onChange,
  onSubmit,
}: Readonly<{
  idPrefix: string;
  values: Pick<TalentFilters, "q" | "candidateStatus" | "role" | "industry">;
  onChange: (patch: Partial<TalentFilters>) => void;
  onSubmit?: () => void;
}>) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor={`${idPrefix}-q`}
          className="text-xs font-medium text-muted-foreground"
        >
          Search (name, email or phone)
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`${idPrefix}-q`}
            value={values.q}
            onChange={(e) => onChange({ q: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit?.();
            }}
            placeholder="Search candidates"
            className="h-11 w-full bg-card !pl-10 pr-4"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor={`${idPrefix}-status`}
          className="text-xs font-medium text-muted-foreground"
        >
          Candidate status
        </Label>
        <AppSelect
          id={`${idPrefix}-status`}
          value={values.candidateStatus}
          onChange={(value) => onChange({ candidateStatus: value })}
          allowEmpty
          emptyLabel="All statuses"
          options={CANDIDATE_STATUS_OPTIONS}
          className="h-11"
        />
      </div>

      <IndustryRoleFields
        industryId={`${idPrefix}-industry`}
        roleId={`${idPrefix}-role`}
        industry={values.industry}
        role={values.role}
        onIndustryChange={(industry) => onChange({ industry })}
        onRoleChange={(role) => onChange({ role })}
        allowEmptyIndustry
        allowEmptyRole
        emptyIndustryLabel="All industries"
        emptyRoleLabel="All roles"
        layout="grid"
        industryClassName="h-11 bg-card"
        roleClassName="h-11 bg-card"
      />
    </>
  );
}

function TalentExtraFilterFields({
  values,
  onChange,
  industry,
}: Readonly<{
  values: ExtraTalentFilters;
  onChange: (patch: Partial<ExtraTalentFilters>) => void;
  industry?: string;
}>) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          Skills
        </Label>
        <ProfileSkillsEditor
          skills={values.skills}
          onChange={(skills) => onChange({ skills })}
          industry={industry}
          placeholder="Search skills — pick from list or press Enter"
          emptyHint="No skills selected."
          inputClassName="h-11 bg-card"
        />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Add multiple skills — candidates with any listed skill will appear.
        </p>
      </div>

      <IxScoreFilterSlider
        value={values.minIxScore}
        onChange={(minIxScore) => onChange({ minIxScore })}
        className="w-full"
      />
    </>
  );
}

function MobileSearchButton({
  active,
  onClick,
  children,
}: Readonly<{
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}>) {
  return (
    <span className="relative inline-flex min-w-0 flex-1 sm:flex-none md:hidden">
      <Button
        type="button"
        onClick={onClick}
        className={cn(
          "h-10 w-full text-white sm:w-auto",
          appPrimaryButton,
          active && "ring-2 ring-[#7367F0]/35 ring-offset-2 ring-offset-background",
        )}
      >
        {children}
      </Button>
      {active ? (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-white/90" />
      ) : null}
    </span>
  );
}

export default function HireTalentPage() {
  const router = useRouter();
  const [data, setData] = useState<PeerPaginated<TalentCandidateRow>>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [candidateStatus, setCandidateStatus] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [minIxScore, setMinIxScore] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [extraFiltersOpen, setExtraFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<TalentFilters>(EMPTY_FILTERS);
  const [draftExtraFilters, setDraftExtraFilters] =
    useState<ExtraTalentFilters>(EMPTY_EXTRA_FILTERS);

  const currentFilters = (): TalentFilters => ({
    q,
    candidateStatus,
    role,
    industry,
    skills,
    minIxScore,
  });

  const currentExtraFilters = (): ExtraTalentFilters => ({
    skills,
    minIxScore,
  });

  const applyFilterState = (filters: TalentFilters) => {
    setQ(filters.q);
    setCandidateStatus(filters.candidateStatus);
    setRole(filters.role);
    setIndustry(filters.industry);
    setSkills(filters.skills);
    setMinIxScore(filters.minIxScore);
  };

  const applyExtraFilterState = (filters: ExtraTalentFilters) => {
    setSkills(filters.skills);
    setMinIxScore(filters.minIxScore);
  };

  const updateDraftFilters = (patch: Partial<TalentFilters>) => {
    setDraftFilters((prev) => ({ ...prev, ...patch }));
  };

  const updateDraftExtraFilters = (patch: Partial<ExtraTalentFilters>) => {
    setDraftExtraFilters((prev) => ({ ...prev, ...patch }));
  };

  const fetchPage = useCallback(
    async (page: number, override?: Partial<TalentFilters>) => {
      const filters: TalentFilters = {
        q: override?.q ?? q,
        candidateStatus: override?.candidateStatus ?? candidateStatus,
        role: override?.role ?? role,
        industry: override?.industry ?? industry,
        skills: override?.skills ?? skills,
        minIxScore: override?.minIxScore ?? minIxScore,
      };
      setLoading(true);
      try {
        const res = await recruiterApi.listCandidates({
          page,
          pageSize: 15,
          q: filters.q.trim() || undefined,
          candidateStatus: filters.candidateStatus || undefined,
          role: filters.role.trim() || undefined,
          industry: filters.industry.trim() || undefined,
          skills: formatSkillsParam(filters.skills),
          minIxScore: filters.minIxScore > 0 ? filters.minIxScore : undefined,
        });
        setData(res);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load candidates");
      } finally {
        setLoading(false);
      }
    },
    [q, candidateStatus, role, industry, skills, minIxScore],
  );

  useEffect(() => {
    void fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => void fetchPage(1);

  const openSearchDialog = () => {
    setDraftFilters(currentFilters());
    setSearchOpen(true);
  };

  const openExtraFiltersDialog = () => {
    setDraftExtraFilters(currentExtraFilters());
    setExtraFiltersOpen(true);
  };

  const applySearchFromDialog = () => {
    applyFilterState({
      ...currentFilters(),
      ...draftFilters,
    });
    setSearchOpen(false);
    void fetchPage(1, { ...currentFilters(), ...draftFilters });
  };

  const applyExtraFiltersFromDialog = () => {
    applyExtraFilterState(draftExtraFilters);
    setExtraFiltersOpen(false);
    void fetchPage(1, { ...currentFilters(), ...draftExtraFilters });
  };

  const clearFilters = () => {
    applyFilterState(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
    setDraftExtraFilters(EMPTY_EXTRA_FILTERS);
    setSearchOpen(false);
    setExtraFiltersOpen(false);
    void fetchPage(1, EMPTY_FILTERS);
  };

  const clearExtraFilters = () => {
    applyExtraFilterState(EMPTY_EXTRA_FILTERS);
    setDraftExtraFilters(EMPTY_EXTRA_FILTERS);
    setExtraFiltersOpen(false);
    void fetchPage(1, { ...currentFilters(), ...EMPTY_EXTRA_FILTERS });
  };

  const hasActiveSearch = Boolean(q.trim());
  const hasActivePrimaryFilters = Boolean(
    candidateStatus || role.trim() || industry.trim(),
  );
  const hasActiveExtraFilters = Boolean(skills.length > 0 || minIxScore > 0);
  const hasAnyActive =
    hasActiveSearch || hasActivePrimaryFilters || hasActiveExtraFilters;
  const extraFilterCount =
    (skills.length > 0 ? 1 : 0) + (minIxScore > 0 ? 1 : 0);

  const downloadResume = async (clerkId: string) => {
    setDownloading(clerkId);
    try {
      const { url } = await recruiterApi.getCandidateResumeUrl(clerkId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "No resume available");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hire iX Talent"
        badge="Candidate discovery"
        description="Search and filter interview-ready candidates by name, role, industry, status and iX Score."
        actions={
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <Button asChild variant="outline" className="min-w-0 flex-1 sm:flex-none">
              <Link href="/dashboard/ix-recruiter">
                <Users className="mr-2 h-4 w-4" />
                Recruiter Dashboard
              </Link>
            </Button>
            <MobileSearchButton
              active={hasActiveSearch || hasActivePrimaryFilters}
              onClick={openSearchDialog}
            >
              <Search className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Search Talent</span>
            </MobileSearchButton>
            <span className="md:hidden">
              <ToolbarIconButton
                label={`More filters${extraFilterCount ? `, ${extraFilterCount} active` : ""}`}
                active={hasActiveExtraFilters}
                badge={extraFilterCount || undefined}
                onClick={openExtraFiltersDialog}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </ToolbarIconButton>
            </span>
            {hasAnyActive ? (
              <Button
                type="button"
                variant="ghost"
                onClick={clearFilters}
                className="h-10 shrink-0 px-3 text-muted-foreground md:hidden"
              >
                Clear
              </Button>
            ) : null}
          </div>
        }
      />

      <div
        className={cn(
          appFilterBar,
          "hidden min-w-0 overflow-hidden p-3 sm:p-4 md:block",
        )}
      >
        <div className="flex min-w-0 items-end gap-3 overflow-x-auto pb-0.5 scroll-smooth [scrollbar-width:thin]">
          <div className="flex min-w-[14rem] flex-1 flex-col gap-1.5">
            <Label
              htmlFor="talent-q"
              className="whitespace-nowrap text-xs font-medium text-muted-foreground"
            >
              Search (name, email or phone)
            </Label>
            <div className="relative min-w-[12rem]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="talent-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Search candidates"
                className="h-11 w-full bg-card !pl-10 pr-4"
              />
            </div>
          </div>

          <div className="flex w-[11rem] shrink-0 flex-col gap-1.5">
            <Label
              htmlFor="talent-status"
              className="whitespace-nowrap text-xs font-medium text-muted-foreground"
            >
              Candidate status
            </Label>
            <AppSelect
              id="talent-status"
              value={candidateStatus}
              onChange={setCandidateStatus}
              allowEmpty
              emptyLabel="All statuses"
              options={CANDIDATE_STATUS_OPTIONS}
              className="h-11"
            />
          </div>

          <div className="flex min-w-[22rem] shrink-0 flex-col gap-1.5">
            <IndustryRoleFields
              industryId="talent-industry"
              roleId="talent-role"
              industry={industry}
              role={role}
              onIndustryChange={setIndustry}
              onRoleChange={setRole}
              allowEmptyIndustry
              allowEmptyRole
              emptyIndustryLabel="All industries"
              emptyRoleLabel="All roles"
              layout="grid"
              industryClassName="h-11 bg-card"
              roleClassName="h-11 bg-card"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2 pb-0.5">
            <Button
              type="button"
              onClick={applyFilters}
              className="h-11 bg-[#7367F0] text-white hover:bg-[#6e62e5]"
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <ToolbarIconButton
              label={`More filters${extraFilterCount ? `, ${extraFilterCount} active` : ""}`}
              active={hasActiveExtraFilters}
              badge={extraFilterCount || undefined}
              onClick={openExtraFiltersDialog}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </ToolbarIconButton>
            {hasAnyActive ? (
              <Button
                type="button"
                variant="ghost"
                onClick={clearFilters}
                className="h-11"
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog
        open={searchOpen}
        onOpenChange={(open) => {
          if (open) setDraftFilters(currentFilters());
          setSearchOpen(open);
        }}
      >
        <DialogContent className={dialogShell}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="text-base sm:text-lg">
              Search candidates
            </DialogTitle>
            <DialogDescription className="text-left text-xs leading-relaxed">
              Search by name, email, phone, role, industry, or status. Use the
              filter icon for skills and iX Score.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <TalentPrimaryFilterFields
              idPrefix="talent-mobile"
              values={draftFilters}
              onChange={updateDraftFilters}
              onSubmit={applySearchFromDialog}
            />
          </div>

          <DialogFooter className="flex-col-reverse gap-2 border-t border-border/60 px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
            {hasActiveSearch ||
            hasActivePrimaryFilters ||
            draftFilters.q.trim() ||
            draftFilters.candidateStatus ||
            draftFilters.role.trim() ||
            draftFilters.industry.trim() ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const next = {
                    ...currentFilters(),
                    ...EMPTY_FILTERS,
                    skills,
                    minIxScore,
                  };
                  setDraftFilters(next);
                  applyFilterState(next);
                  setSearchOpen(false);
                  void fetchPage(1, next);
                }}
                className="w-full sm:w-auto"
              >
                Clear search
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={applySearchFromDialog}
              className="w-full bg-[#7367F0] text-white hover:bg-[#6e62e5] sm:w-auto"
            >
              <Search className="mr-2 h-4 w-4" />
              Apply search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={extraFiltersOpen}
        onOpenChange={(open) => {
          if (open) setDraftExtraFilters(currentExtraFilters());
          setExtraFiltersOpen(open);
        }}
      >
        <DialogContent
          className={dialogShell}
          {...profileSkillsDialogOutsideHandlers}
        >
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="text-base font-semibold leading-snug sm:text-lg">
              More filters
            </DialogTitle>
            <DialogDescription className="text-left text-xs leading-relaxed">
              Filter by skills and minimum iX Score, then apply to update
              results.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <TalentExtraFilterFields
              values={draftExtraFilters}
              onChange={updateDraftExtraFilters}
              industry={industry}
            />
          </div>

          <DialogFooter className="flex-col-reverse gap-2 border-t border-border/60 px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
            {hasActiveExtraFilters ||
            draftExtraFilters.skills.length > 0 ||
            draftExtraFilters.minIxScore > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={clearExtraFilters}
                className="w-full sm:w-auto"
              >
                Clear filters
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={applyExtraFiltersFromDialog}
              className="w-full bg-[#7367F0] text-white hover:bg-[#6e62e5] sm:w-auto"
            >
              Apply filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={cn(appCard, "overflow-hidden")}>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#7367F0]" />
          </div>
        ) : data.items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No candidates match your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a8aaae]">
                    <th className="px-5 py-3 text-left">Candidate</th>
                    <th className="min-w-[9rem] px-5 py-3 text-left">Role</th>
                    <th className="min-w-[11rem] px-5 py-3 text-left">
                      Current company
                    </th>
                    <th className="w-[4.5rem] whitespace-nowrap px-5 py-3 text-left">
                      iX Score
                    </th>
                    <th className="w-[7rem] whitespace-nowrap px-5 py-3 text-left">
                      Candidate status
                    </th>
                    <th className="w-[140px] min-w-[140px] whitespace-nowrap px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => (
                    <tr
                      key={c.clerkId}
                      className="border-b border-border/60 hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground">
                          {c.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.email}
                        </div>
                      </td>
                      <td className="min-w-[9rem] whitespace-normal break-words px-5 py-3.5 text-muted-foreground">
                        {c.role || "—"}
                      </td>
                      <td className="min-w-[11rem] whitespace-normal break-words px-5 py-3.5 text-muted-foreground">
                        {c.company || "—"}
                      </td>
                      <td className="w-[4.5rem] px-5 py-3.5">
                        <span
                          className={cn(
                            "text-base font-semibold",
                            ixScoreTone(c.ixScore),
                          )}
                        >
                          {c.ixScore != null ? c.ixScore : "—"}
                        </span>
                      </td>
                      <td className="w-[7rem] whitespace-nowrap px-5 py-3.5">
                        <CandidateStatusBadge status={c.candidateStatus} />
                      </td>
                      <td className="w-[140px] min-w-[140px] whitespace-nowrap px-5 py-3.5">
                        <div className="flex flex-nowrap items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            title="Download resume"
                            aria-label="Download resume"
                            disabled={!c.hasResume || downloading === c.clerkId}
                            onClick={() => void downloadResume(c.clerkId)}
                          >
                            {downloading === c.clerkId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                          >
                            <Link
                              href={`/dashboard/ix-recruiter/candidates/${c.clerkId}#ix-report`}
                              title="View iX Report"
                              aria-label="View iX Report"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            className="h-8 w-8 shrink-0 bg-[#7367F0] text-white hover:bg-[#6e62e5]"
                            title="View candidate details"
                            aria-label="View candidate details"
                            onClick={() =>
                              router.push(
                                `/dashboard/ix-recruiter/candidates/${c.clerkId}`,
                              )
                            }
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 px-5 py-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                {data.total} candidate{data.total === 1 ? "" : "s"}
              </p>
              {data.totalPages > 1 ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page <= 1}
                    onClick={() => void fetchPage(data.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page >= data.totalPages}
                    onClick={() => void fetchPage(data.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
