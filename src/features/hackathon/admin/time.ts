const IST_OFFSET_MS = 330 * 60_000;

/** ISO instant → `YYYY-MM-DDTHH:mm` wall-clock in IST, for combined form state. */
export function isoToIstInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const shifted = new Date(ms + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 16);
}

export function splitIstInput(value: string): { date: string; time: string } {
  if (!value?.includes("T")) return value ? { date: value.slice(0, 10), time: "" } : { date: "", time: "" };
  const [date, timePart] = value.split("T");
  return { date: date ?? "", time: (timePart ?? "").slice(0, 5) };
}

export function combineIstInput(date: string, time: string): string {
  if (!date) return "";
  if (!time) return `${date}T`;
  return `${date}T${time.slice(0, 5)}`;
}

/** ISO instant → separate date and time fields in IST. */
export function splitIsoToIstDateAndTime(iso: string | null | undefined): { date: string; time: string } {
  return splitIstInput(isoToIstInput(iso));
}

/** Separate IST date + time → ISO instant. */
export function istDateAndTimeToIso(date: string, time: string): string | null {
  const combined = combineIstInput(date, time);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(combined)) return null;
  return istInputToIso(combined);
}

/** `YYYY-MM-DDTHH:mm` typed as IST → ISO instant with offset. */
export function istInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+05:30`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
