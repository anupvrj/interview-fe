"use client";

import { IntegritySwitch } from "@/components/integrity/IntegritySwitch";
import { INTEGRITY_SETTING_GROUPS } from "@/lib/integrity/settingGroups";
import {
  DEFAULT_INTEGRITY_SETTINGS,
  type IntegritySettings,
} from "@/lib/integrity/settings";

export function InstitutionIntegrityFields({
  settings,
  onChange,
}: Readonly<{
  settings: IntegritySettings;
  onChange: (next: IntegritySettings) => void;
}>) {
  return (
    <div className="space-y-4 rounded-lg border border-border/60 p-3">
      <div>
        <p className="text-sm font-medium">Interview integrity</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Turn the whole suite off for this institute, or disable a single check.
          A module that is off on the platform Integrity page stays off here.
        </p>
      </div>
      {INTEGRITY_SETTING_GROUPS.map((group) => (
        <div key={group.title} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          <ul className="divide-y divide-border/60 rounded-md border border-border/50">
            {group.keys.map((item) => {
              const on = settings[item.key];
              const disabled =
                Boolean(item.requiresMaster) && !settings.telemetryEnabled;
              return (
                <li
                  key={item.key}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      {item.help}
                    </p>
                  </div>
                  <IntegritySwitch
                    on={on}
                    disabled={disabled}
                    label={item.label}
                    onToggle={() =>
                      onChange({ ...settings, [item.key]: !settings[item.key] })
                    }
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function integrityFromInstitution(
  raw?: Partial<IntegritySettings> | null,
): IntegritySettings {
  return { ...DEFAULT_INTEGRITY_SETTINGS, ...(raw ?? {}) };
}
