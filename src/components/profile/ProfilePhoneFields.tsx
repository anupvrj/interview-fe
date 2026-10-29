"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import { PHONE_COUNTRY_CODES } from "@/lib/phone-country-codes";
import {
  formatPhoneForStorage,
  isValidPhoneForStorage,
} from "@/lib/phone-utils";
import { checkMobileNumber, maxLocalDigits, normaliseLocalNumber } from "@/lib/phone-validation";
import { cn } from "@/lib/utils";

const COUNTRY_CODE_OPTIONS = PHONE_COUNTRY_CODES.map((option) => ({
  value: option.value,
  label: option.label,
}));

export function ProfilePhoneFields({
  countryCode,
  localNumber,
  savedPhone,
  saving = false,
  disabled = false,
  onCountryCodeChange,
  onLocalNumberChange,
  onSave,
  showSaveButton = true,
  fixedCountryCode,
  hideFixedDialCode = false,
  compact = false,
  fullWidth = false,
  className,
}: Readonly<{
  countryCode: string;
  localNumber: string;
  savedPhone: string | null;
  saving?: boolean;
  disabled?: boolean;
  onCountryCodeChange: (value: string) => void;
  onLocalNumberChange: (value: string) => void;
  onSave: () => void;
  showSaveButton?: boolean;
  /** Hides the country dropdown and shows this dial code only (e.g. launch RSVP). */
  fixedCountryCode?: string;
  /** Keep fixedCountryCode for formatting but do not show +91 (etc.) in the UI. */
  hideFixedDialCode?: boolean;
  /** Tighter layout for modals — shorter number field. */
  compact?: boolean;
  /** Full-width row on small screens (launch / event registration). */
  fullWidth?: boolean;
  className?: string;
}>) {
  const [touched, setTouched] = useState(false);
  const dialCode = fixedCountryCode ?? countryCode;
  const formatted = formatPhoneForStorage(dialCode, localNumber);
  const check = checkMobileNumber(dialCode, localNumber);
  // Say what's wrong once they've typed a full number or left the field — not on the first digit.
  const showError =
    !!localNumber && !check.ok && (touched || localNumber.length >= maxLocalDigits(dialCode));
  const dirty = formatted !== (savedPhone ?? "");
  const canSave =
    dirty &&
    (formatted === "" || isValidPhoneForStorage(dialCode, localNumber));

  return (
    <div className={cn(fixedCountryCode ? "mt-0" : "mt-1.5", className)}>
    <div
      className={cn(
        "flex w-full items-center gap-2",
        compact && !fullWidth && "max-w-[18rem] sm:max-w-[22rem] md:max-w-none",
        !compact && "flex-col sm:flex-row sm:items-center",
      )}
    >
      {fixedCountryCode && !hideFixedDialCode ? (
        <span
          id="profile-phone-country"
          className={cn(
            "inline-flex h-11 shrink-0 items-center rounded-xl border border-[#27547d]/80 bg-[#081a33]/90 px-3 text-[15px] font-semibold tabular-nums text-[#dbe9f8]",
            compact && "h-11 px-2.5 text-sm",
          )}
          aria-hidden
        >
          {fixedCountryCode}
        </span>
      ) : fixedCountryCode && hideFixedDialCode ? (
        <span id="profile-phone-country" className="sr-only">
          Country code {fixedCountryCode}, applied automatically
        </span>
      ) : null}
      {!fixedCountryCode ? (
        <AppSelect
          id="profile-phone-country"
          value={countryCode}
          onChange={(value) => {
            onCountryCodeChange(value);
            onLocalNumberChange(normaliseLocalNumber(value, localNumber));
          }}
          options={COUNTRY_CODE_OPTIONS}
          disabled={disabled || saving}
          className="h-10 w-full sm:max-w-[10.5rem] bg-card"
        />
      ) : null}
      <Input
        id="profile-phone-local"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={dialCode === "+91" ? "10-digit mobile" : "Mobile number"}
        value={localNumber}
        disabled={disabled || saving}
        aria-invalid={showError || undefined}
        aria-describedby={showError ? "profile-phone-error" : undefined}
        // Full width when stacked on phones; `flex-1` there would collapse the field's height.
        // 16px text on phones (iOS zooms the page into smaller inputs); `!` beats .app-control.
        className={cn(
          "h-11 min-w-0 bg-card !text-base sm:h-10 sm:!text-sm",
          compact ? (hideFixedDialCode ? "w-full min-w-0" : "min-w-0 flex-1") : "w-full sm:flex-1",
          showError && "!border-destructive focus-visible:!ring-destructive/30",
          fixedCountryCode &&
            "rounded-xl border-[#27547d]/80 bg-[#081a33]/90 text-white placeholder:text-[#6a849e] focus-visible:ring-[#3aa6ff]/30",
        )}
        onBlur={() => setTouched(true)}
        onChange={(event) =>
          onLocalNumberChange(normaliseLocalNumber(dialCode, event.target.value))
        }
      />
      {showSaveButton ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 shrink-0"
          disabled={disabled || saving || !canSave}
          onClick={onSave}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      ) : null}
    </div>
      {showError && !check.ok ? (
        <p id="profile-phone-error" role="alert" className="mt-1.5 text-xs font-medium text-destructive">
          {check.message}
        </p>
      ) : null}
    </div>
  );
}
