/** Where signed-in users should go to start or continue the hackathon. */
export function hackathonEntryPath({
  registered,
  profilePath,
  dashboardPath,
}: {
  registered?: boolean;
  /** @deprecated Registration is not inferred from profile; only `registered` sends users to the dashboard. */
  profileComplete?: boolean;
  profilePath: string;
  dashboardPath: string;
}): string {
  if (registered) return dashboardPath;
  return profilePath;
}
