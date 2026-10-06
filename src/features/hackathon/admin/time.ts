const IST_OFFSET_MS = 330 * 60_000;

/** ISO instant → `YYYY-MM-DDTHH:mm` wall-clock in IST, for `<input type="datetime-local">`. */
export function isoToIstInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const shifted = new Date(new Date(iso).getTime() + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 16);
}

/** `YYYY-MM-DDTHH:mm` typed as IST → ISO instant with offset. */
export function istInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+05:30`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
