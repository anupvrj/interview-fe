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
  className?: string;
}>) {
  const [touched, setTouched] = useState(false);
  const formatted = formatPhoneForStorage(countryCode, localNumber);
  const check = checkMobileNumber(countryCode, localNumber);
  // Say what's wrong once they've typed a full number or left the field — not on the first digit.
  const showError =
    !!localNumber && !check.ok && (touched || localNumber.length >= maxLocalDigits(countryCode));
  const dirty = formatted !== (savedPhone ?? "");
  const canSave =
    dirty &&
    (formatted === "" || isValidPhoneForStorage(countryCode, localNumber));

  return (
    <div className={cn("mt-1.5", className)}>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
      <Input
        id="profile-phone-local"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={countryCode === "+91" ? "10-digit mobile number" : "Mobile number"}
        value={localNumber}
        disabled={disabled || saving}
        aria-invalid={showError || undefined}
        aria-describedby={showError ? "profile-phone-error" : undefined}
        // Full width when stacked on phones; `flex-1` there would collapse the field's height.
        // 16px text on phones (iOS zooms the page into smaller inputs); `!` beats .app-control.
        className={cn(
          "h-11 w-full min-w-0 bg-card !text-base sm:h-10 sm:flex-1 sm:!text-sm",
          showError && "!border-destructive focus-visible:!ring-destructive/30",
        )}
        onBlur={() => setTouched(true)}
        onChange={(event) =>
          onLocalNumberChange(normaliseLocalNumber(countryCode, event.target.value))
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
