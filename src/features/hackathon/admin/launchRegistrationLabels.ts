import { LAUNCH_EVENT_FORM } from "@/lib/hackathon-2026-content";

const professionByValue = Object.fromEntries(
  LAUNCH_EVENT_FORM.professionOptions.map((o) => [o.value, o.label]),
) as Record<string, string>;

const whyByValue = Object.fromEntries(LAUNCH_EVENT_FORM.whyAttendOptions.map((o) => [o.value, o.label])) as Record<
  string,
  string
>;

const attendedByValue = Object.fromEntries(
  LAUNCH_EVENT_FORM.attendedOptions.map((o) => [o.value, o.label]),
) as Record<string, string>;

const readyByValue = Object.fromEntries(LAUNCH_EVENT_FORM.readyOptions.map((o) => [o.value, o.label])) as Record<
  string,
  string
>;

export function launchProfessionLabel(value: string): string {
  return professionByValue[value] ?? value;
}

export function launchWhyAttendLabel(value: string): string {
  return whyByValue[value] ?? value;
}

export function launchAttendedLabel(value: string): string {
  return attendedByValue[value] ?? value;
}

export function launchReadyLabel(value: string): string {
  return readyByValue[value] ?? value;
}
