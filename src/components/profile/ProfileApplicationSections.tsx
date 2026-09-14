"use client";

import { useState } from "react";
import {
  Globe,
  GraduationCap,
  Languages,
  MapPin,
  Plus,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/ui/app-select";
import {
  ProfileApplicationSectionCard,
  ProfileEditActions,
  ProfileField,
} from "@/components/profile/ProfileSectionPrimitives";
import {
  profileFormFieldClass,
  profileFormLabelClass,
  profileInputClass,
} from "@/components/profile/profile-styles";
import {
  ETHNICITY_OPTIONS,
  GENDER_OPTIONS,
  HIGHEST_DEGREE_OPTIONS,
  SPONSORSHIP_OPTIONS,
  VETERAN_STATUS_OPTIONS,
  WORK_AUTH_OPTIONS,
  WORK_AUTH_US_OPTIONS,
  YES_NO_PREFER_OPTIONS,
  composeLocation,
  displayYesNoPrefer,
  emptyEducationEntry,
  type ApplicationProfile,
} from "@/lib/application-profile";
import { cn } from "@/lib/utils";

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

type SectionProps = {
  value: ApplicationProfile;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onChange: (next: ApplicationProfile) => void;
  onSave: () => void;
  onCancel: () => void;
};

function FormField({
  id,
  label,
  children,
  className,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(profileFormFieldClass, className)}>
      <Label htmlFor={id} className={profileFormLabelClass}>
        {label}
      </Label>
      {children}
    </div>
  );
}

export function ProfileLocationCard(props: SectionProps) {
  const { value, editing, saving, onEdit, onChange, onSave, onCancel } = props;
  const address = value.address;
  const setAddress = (patch: Partial<typeof address>) =>
    onChange({ ...value, address: { ...address, ...patch } });

  return (
    <ProfileApplicationSectionCard
      title="Location"
      description="Address used to autofill job applications"
      icon={MapPin}
      tone="cyan"
      editing={editing}
      onEdit={onEdit}
    >
      {editing ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="profile-street" label="Address" className="sm:col-span-2">
              <Input
                id="profile-street"
                className={profileInputClass}
                value={address.street}
                disabled={saving}
                onChange={(e) => setAddress({ street: e.target.value })}
              />
            </FormField>
            <FormField id="profile-city" label="City">
              <Input
                id="profile-city"
                className={profileInputClass}
                value={address.city}
                disabled={saving}
                onChange={(e) => setAddress({ city: e.target.value })}
              />
            </FormField>
            <FormField id="profile-state" label="State">
              <Input
                id="profile-state"
                className={profileInputClass}
                value={address.state}
                disabled={saving}
                onChange={(e) => setAddress({ state: e.target.value })}
              />
            </FormField>
            <FormField id="profile-country" label="Country">
              <Input
                id="profile-country"
                className={profileInputClass}
                value={address.country}
                disabled={saving}
                onChange={(e) => setAddress({ country: e.target.value })}
              />
            </FormField>
            <FormField id="profile-postal" label="Postal code">
              <Input
                id="profile-postal"
                className={profileInputClass}
                value={address.postalCode}
                disabled={saving}
                onChange={(e) => setAddress({ postalCode: e.target.value })}
              />
            </FormField>
          </div>
          <ProfileEditActions saving={saving} onSave={onSave} onCancel={onCancel} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileField label="Location" value={composeLocation(address) || "—"} />
          <ProfileField label="Address" value={address.street || "—"} />
          <ProfileField label="City" value={address.city || "—"} />
          <ProfileField label="State" value={address.state || "—"} />
          <ProfileField label="Country" value={address.country || "—"} />
          <ProfileField label="Postal code" value={address.postalCode || "—"} />
        </div>
      )}
    </ProfileApplicationSectionCard>
  );
}

export function ProfileEducationCard(props: SectionProps) {
  const { value, editing, saving, onEdit, onChange, onSave, onCancel } = props;
  const education = value.education.length > 0 ? value.education : [];

  return (
    <ProfileApplicationSectionCard
      title="Education"
      description="Highest degree and schools for application forms"
      icon={GraduationCap}
      tone="violet"
      editing={editing}
      onEdit={onEdit}
    >
      {editing ? (
        <div className="space-y-4">
          <FormField id="profile-highest-degree" label="Highest degree">
            <AppSelect
              id="profile-highest-degree"
              value={value.highestDegree}
              onChange={(highestDegree) => onChange({ ...value, highestDegree })}
              options={HIGHEST_DEGREE_OPTIONS}
              allowEmpty
              emptyLabel="Not set"
              disabled={saving}
              className={profileInputClass}
            />
          </FormField>
          <div className="space-y-3">
            {education.map((entry, index) => (
              <div
                key={`${entry.school}-${index}`}
                className="grid gap-3 rounded-xl border border-border/60 p-4 sm:grid-cols-2"
              >
                <FormField label="School" className="sm:col-span-2">
                  <Input
                    className={profileInputClass}
                    value={entry.school}
                    disabled={saving}
                    onChange={(e) => {
                      const next = [...education];
                      next[index] = { ...entry, school: e.target.value };
                      onChange({ ...value, education: next });
                    }}
                  />
                </FormField>
                <FormField label="Degree">
                  <Input
                    className={profileInputClass}
                    value={entry.degree}
                    disabled={saving}
                    onChange={(e) => {
                      const next = [...education];
                      next[index] = { ...entry, degree: e.target.value };
                      onChange({ ...value, education: next });
                    }}
                  />
                </FormField>
                <FormField label="Field of study">
                  <Input
                    className={profileInputClass}
                    value={entry.field}
                    disabled={saving}
                    onChange={(e) => {
                      const next = [...education];
                      next[index] = { ...entry, field: e.target.value };
                      onChange({ ...value, education: next });
                    }}
                  />
                </FormField>
                <FormField label="Start">
                  <Input
                    className={profileInputClass}
                    placeholder="YYYY or YYYY-MM"
                    value={entry.startDate}
                    disabled={saving}
                    onChange={(e) => {
                      const next = [...education];
                      next[index] = { ...entry, startDate: e.target.value };
                      onChange({ ...value, education: next });
                    }}
                  />
                </FormField>
                <div className="flex items-end gap-2">
                  <FormField label="End" className="min-w-0 flex-1">
                    <Input
                      className={profileInputClass}
                      placeholder="YYYY or Present"
                      value={entry.endDate}
                      disabled={saving}
                      onChange={(e) => {
                        const next = [...education];
                        next[index] = { ...entry, endDate: e.target.value };
                        onChange({ ...value, education: next });
                      }}
                    />
                  </FormField>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mb-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={saving}
                    onClick={() =>
                      onChange({
                        ...value,
                        education: education.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={saving || education.length >= 8}
              onClick={() =>
                onChange({
                  ...value,
                  education: [...education, emptyEducationEntry()],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add school
            </Button>
          </div>
          <ProfileEditActions saving={saving} onSave={onSave} onCancel={onCancel} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <ProfileField label="Highest degree" value={value.highestDegree || "—"} />
          </div>
          {education.length > 0 ? (
            education.map((entry, index) => (
              <div key={`${entry.school}-${index}`} className="grid gap-3 sm:grid-cols-2">
                <ProfileField label="School" value={entry.school || "—"} />
                <ProfileField label="Degree" value={entry.degree || "—"} />
                <ProfileField label="Field of study" value={entry.field || "—"} />
                <ProfileField
                  label="Dates"
                  value={[entry.startDate, entry.endDate].filter(Boolean).join(" – ") || "—"}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No schools added yet.</p>
          )}
        </div>
      )}
    </ProfileApplicationSectionCard>
  );
}

export function ProfileEeoCard(props: SectionProps) {
  const { value, editing, saving, onEdit, onChange, onSave, onCancel } = props;

  return (
    <ProfileApplicationSectionCard
      title="EEO"
      description="Optional self-identification. Autofill stays off until you opt in."
      icon={Users}
      tone="amber"
      editing={editing}
      onEdit={onEdit}
    >
      {editing ? (
        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <input
              type="checkbox"
              aria-label="Allow the Chrome extension to fill EEO questions"
              className="mt-1 h-4 w-4 accent-[#7367F0]"
              checked={value.eeoAutofillEnabled}
              disabled={saving}
              onChange={(e) =>
                onChange({ ...value, eeoAutofillEnabled: e.target.checked })
              }
            />
            <span>
              <span className="block text-sm font-medium text-foreground">
                Allow the Chrome extension to fill EEO questions
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Gender, ethnicity, veteran, disability, and related answers are
                optional on most applications. They are stored on your profile but
                only sent to the extension when this is on.
              </span>
            </span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="profile-gender" label="Gender">
              <AppSelect
                id="profile-gender"
                value={value.gender}
                onChange={(gender) => onChange({ ...value, gender })}
                options={GENDER_OPTIONS}
                allowEmpty
                emptyLabel="Not set"
                disabled={saving}
                className={profileInputClass}
              />
            </FormField>
            <FormField id="profile-ethnicity" label="Ethnicity">
              <AppSelect
                id="profile-ethnicity"
                value={value.ethnicity}
                onChange={(ethnicity) => onChange({ ...value, ethnicity })}
                options={ETHNICITY_OPTIONS}
                allowEmpty
                emptyLabel="Not set"
                disabled={saving}
                className={profileInputClass}
              />
            </FormField>
            <FormField id="profile-hispanic" label="Hispanic or Latino">
              <AppSelect
                id="profile-hispanic"
                value={value.hispanic}
                onChange={(hispanic) => onChange({ ...value, hispanic })}
                options={YES_NO_PREFER_OPTIONS}
                allowEmpty
                emptyLabel="Not set"
                disabled={saving}
                className={profileInputClass}
              />
            </FormField>
            <FormField id="profile-veteran" label="Veteran status">
              <AppSelect
                id="profile-veteran"
                value={value.veteranStatus}
                onChange={(veteranStatus) => onChange({ ...value, veteranStatus })}
                options={VETERAN_STATUS_OPTIONS}
                allowEmpty
                emptyLabel="Not set"
                disabled={saving}
                className={profileInputClass}
              />
            </FormField>
            <FormField id="profile-armed-forces" label="Armed forces">
              <AppSelect
                id="profile-armed-forces"
                value={value.armedForces}
                onChange={(armedForces) => onChange({ ...value, armedForces })}
                options={YES_NO_PREFER_OPTIONS}
                allowEmpty
                emptyLabel="Not set"
                disabled={saving}
                className={profileInputClass}
              />
            </FormField>
            <FormField id="profile-disability" label="Disability">
              <AppSelect
                id="profile-disability"
                value={value.disability}
                onChange={(disability) => onChange({ ...value, disability })}
                options={YES_NO_PREFER_OPTIONS}
                allowEmpty
                emptyLabel="Not set"
                disabled={saving}
                className={profileInputClass}
              />
            </FormField>
            <FormField id="profile-lgbt" label="LGBT">
              <AppSelect
                id="profile-lgbt"
                value={value.lgbt}
                onChange={(lgbt) => onChange({ ...value, lgbt })}
                options={YES_NO_PREFER_OPTIONS}
                allowEmpty
                emptyLabel="Not set"
                disabled={saving}
                className={profileInputClass}
              />
            </FormField>
          </div>
          <ProfileEditActions saving={saving} onSave={onSave} onCancel={onCancel} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileField
            label="EEO autofill"
            value={value.eeoAutofillEnabled ? "On" : "Off"}
          />
          <ProfileField label="Gender" value={value.gender || "—"} />
          <ProfileField label="Ethnicity" value={value.ethnicity || "—"} />
          <ProfileField label="Hispanic" value={displayYesNoPrefer(value.hispanic)} />
          <ProfileField label="Veteran status" value={value.veteranStatus || "—"} />
          <ProfileField
            label="Armed forces"
            value={displayYesNoPrefer(value.armedForces)}
          />
          <ProfileField
            label="Disability"
            value={displayYesNoPrefer(value.disability)}
          />
          <ProfileField label="LGBT" value={displayYesNoPrefer(value.lgbt)} />
        </div>
      )}
    </ProfileApplicationSectionCard>
  );
}

export function ProfileWorkAuthCard(props: SectionProps) {
  const { value, editing, saving, onEdit, onChange, onSave, onCancel } = props;

  return (
    <ProfileApplicationSectionCard
      title="Work authorization"
      description="Answers for work-authorization and sponsorship questions"
      icon={Shield}
      tone="emerald"
      editing={editing}
      onEdit={onEdit}
    >
      {editing ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="profile-work-auth" label="Work authorization">
              <AppSelect
                id="profile-work-auth"
                value={value.workAuthorization}
                onChange={(workAuthorization) =>
                  onChange({ ...value, workAuthorization })
                }
                options={WORK_AUTH_OPTIONS}
                allowEmpty
                emptyLabel="Not set"
                disabled={saving}
                className={profileInputClass}
              />
            </FormField>
            <FormField id="profile-work-auth-us" label="Work authorization (US)">
              <AppSelect
                id="profile-work-auth-us"
                value={value.workAuthorizationUs}
                onChange={(workAuthorizationUs) =>
                  onChange({ ...value, workAuthorizationUs })
                }
                options={WORK_AUTH_US_OPTIONS}
                allowEmpty
                emptyLabel="Not set"
                disabled={saving}
                className={profileInputClass}
              />
            </FormField>
            <FormField id="profile-sponsorship" label="Sponsorship">
              <AppSelect
                id="profile-sponsorship"
                value={value.sponsorship}
                onChange={(sponsorship) => onChange({ ...value, sponsorship })}
                options={SPONSORSHIP_OPTIONS}
                allowEmpty
                emptyLabel="Not set"
                disabled={saving}
                className={profileInputClass}
              />
            </FormField>
          </div>
          <ProfileEditActions saving={saving} onSave={onSave} onCancel={onCancel} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileField
            label="Work authorization"
            value={value.workAuthorization || "—"}
          />
          <ProfileField
            label="Work authorization (US)"
            value={value.workAuthorizationUs || "—"}
          />
          <ProfileField
            label="Sponsorship"
            value={displayYesNoPrefer(value.sponsorship)}
          />
        </div>
      )}
    </ProfileApplicationSectionCard>
  );
}

export function ProfileSocialLinksCard(props: SectionProps) {
  const { value, editing, saving, onEdit, onChange, onSave, onCancel } = props;
  const links = value.links;
  const setLinks = (patch: Partial<typeof links>) =>
    onChange({ ...value, links: { ...links, ...patch } });
  const [extraSite, setExtraSite] = useState("");

  return (
    <ProfileApplicationSectionCard
      title="Social and links"
      description="Public profiles the extension can paste into applications"
      icon={Globe}
      tone="cyan"
      editing={editing}
      onEdit={onEdit}
    >
      {editing ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["linkedin", "LinkedIn"],
                ["github", "GitHub"],
                ["portfolio", "Portfolio"],
                ["website", "Website"],
                ["twitter", "Twitter"],
                ["behance", "Behance"],
                ["dribbble", "Dribbble"],
              ] as const
            ).map(([key, label]) => (
              <FormField key={key} id={`profile-${key}`} label={label}>
                <Input
                  id={`profile-${key}`}
                  className={profileInputClass}
                  value={links[key]}
                  disabled={saving}
                  placeholder="https://"
                  onChange={(e) => setLinks({ [key]: e.target.value })}
                />
              </FormField>
            ))}
          </div>
          <div className="space-y-2">
            <p className={profileFormLabelClass}>Other websites</p>
            {links.other.map((site, index) => (
              <div key={`${site}-${index}`} className="flex gap-2">
                <Input className={profileInputClass} value={site} readOnly />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={saving}
                  onClick={() =>
                    setLinks({
                      other: links.other.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                className={profileInputClass}
                placeholder="https://example.com"
                value={extraSite}
                disabled={saving}
                onChange={(e) => setExtraSite(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving || !extraSite.trim() || links.other.length >= 10}
                onClick={() => {
                  const next = extraSite.trim();
                  if (!next) return;
                  setLinks({ other: [...links.other, next] });
                  setExtraSite("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
          <ProfileEditActions saving={saving} onSave={onSave} onCancel={onCancel} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileField label="LinkedIn" value={links.linkedin || "—"} />
          <ProfileField label="GitHub" value={links.github || "—"} />
          <ProfileField label="Portfolio" value={links.portfolio || "—"} />
          <ProfileField label="Website" value={links.website || "—"} />
          <ProfileField label="Twitter" value={links.twitter || "—"} />
          <ProfileField label="Behance" value={links.behance || "—"} />
          <ProfileField label="Dribbble" value={links.dribbble || "—"} />
          <ProfileField
            label="Other websites"
            value={links.other.length ? links.other.join(", ") : "—"}
          />
        </div>
      )}
    </ProfileApplicationSectionCard>
  );
}

export function ProfileApplicationOtherCard(props: SectionProps) {
  const { value, editing, saving, onEdit, onChange, onSave, onCancel } = props;
  const [languageDraft, setLanguageDraft] = useState("");

  return (
    <ProfileApplicationSectionCard
      title="Other"
      description="Languages, referral source, and related application answers"
      icon={Languages}
      tone="violet"
      editing={editing}
      onEdit={onEdit}
    >
      {editing ? (
        <div className="space-y-4">
          <FormField label="Languages">
            <div className="flex flex-wrap gap-2">
              {value.languages.map((language) => (
                <span
                  key={language}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium"
                >
                  {language}
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={saving}
                    onClick={() =>
                      onChange({
                        ...value,
                        languages: value.languages.filter((item) => item !== language),
                      })
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                className={profileInputClass}
                placeholder="e.g. English"
                value={languageDraft}
                disabled={saving}
                onChange={(e) => setLanguageDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const next = languageDraft.trim();
                  if (!next) return;
                  if (!value.languages.includes(next)) {
                    onChange({ ...value, languages: [...value.languages, next] });
                  }
                  setLanguageDraft("");
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving || !languageDraft.trim()}
                onClick={() => {
                  const next = languageDraft.trim();
                  if (!next) return;
                  if (!value.languages.includes(next)) {
                    onChange({ ...value, languages: [...value.languages, next] });
                  }
                  setLanguageDraft("");
                }}
              >
                Add
              </Button>
            </div>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="profile-source" label="Source">
              <Input
                id="profile-source"
                className={profileInputClass}
                placeholder="How did you hear about us?"
                value={value.source}
                disabled={saving}
                onChange={(e) => onChange({ ...value, source: e.target.value })}
              />
            </FormField>
            <FormField id="profile-referred-by" label="Referred by">
              <Input
                id="profile-referred-by"
                className={profileInputClass}
                value={value.referredBy}
                disabled={saving}
                onChange={(e) => onChange({ ...value, referredBy: e.target.value })}
              />
            </FormField>
          </div>
          <p className="text-xs text-muted-foreground">
            Current date is filled automatically when you apply. Skills stay in
            Professional details.
          </p>
          <ProfileEditActions saving={saving} onSave={onSave} onCancel={onCancel} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileField
            label="Languages"
            value={value.languages.length ? value.languages.join(", ") : "—"}
          />
          <ProfileField label="Source" value={value.source || "—"} />
          <ProfileField label="Referred by" value={value.referredBy || "—"} />
          <ProfileField label="Current date" value="Filled automatically on apply" />
        </div>
      )}
    </ProfileApplicationSectionCard>
  );
}

export function ProfileCoverLetterEditor({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={profileFormFieldClass}>
      <Label htmlFor="profile-cover-letter" className={profileFormLabelClass}>
        Cover letter
      </Label>
      <Textarea
        id="profile-cover-letter"
        className="min-h-[140px]"
        placeholder="Optional cover letter text for application forms"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function ProfileCurrentlyWorkingField({
  value,
  disabled,
  onChange,
}: {
  value: boolean | undefined;
  disabled?: boolean;
  onChange: (value: boolean | undefined) => void;
}) {
  const selectValue = value === true ? "yes" : value === false ? "no" : "";
  return (
    <div className={profileFormFieldClass}>
      <Label htmlFor="profile-currently-working" className={profileFormLabelClass}>
        Currently working
      </Label>
      <AppSelect
        id="profile-currently-working"
        value={selectValue}
        onChange={(next) =>
          onChange(next === "yes" ? true : next === "no" ? false : undefined)
        }
        options={YES_NO_OPTIONS}
        allowEmpty
        emptyLabel="Not set"
        disabled={disabled}
        className={profileInputClass}
      />
    </div>
  );
}

