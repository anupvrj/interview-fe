"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import { PHONE_COUNTRY_CODES } from "@/lib/phone-country-codes";
import {
  formatPhoneForStorage,
  isValidPhoneForStorage,
} from "@/lib/phone-utils";
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
  const formatted = formatPhoneForStorage(countryCode, localNumber);
  const dirty = formatted !== (savedPhone ?? "");
  const canSave =
    dirty &&
    (formatted === "" || isValidPhoneForStorage(countryCode, localNumber));

  return (
    <div
      className={cn(
        "mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center",
        className,
      )}
    >
      <AppSelect
        id="profile-phone-country"
        value={countryCode}
        onChange={onCountryCodeChange}
        options={COUNTRY_CODE_OPTIONS}
        disabled={disabled || saving}
        className="h-10 w-full sm:max-w-[10.5rem] bg-card"
      />
      <Input
        id="profile-phone-local"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="Mobile number"
        value={localNumber}
        disabled={disabled || saving}
        className="h-10 min-w-0 flex-1 bg-card"
        onChange={(event) =>
          onLocalNumberChange(event.target.value.replace(/[^\d]/g, ""))
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
  );
}
