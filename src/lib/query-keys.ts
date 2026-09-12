export const queryKeys = {
  entitlements: (userId: string) => ["entitlements", userId] as const,
  interviews: (userId: string) => ["interviews", userId] as const,
  interviewSchedules: (userId: string) => ["interviewSchedules", userId] as const,
  resumes: (userId: string) => ["resumes", userId] as const,
  codingInterviews: (userId: string) => ["codingInterviews", userId] as const,
  systemDesignSessions: (userId: string) =>
    ["systemDesignSessions", userId] as const,
  peerBookings: (userId: string) => ["peerBookings", userId] as const,
  profile: (userId: string) => ["profile", userId] as const,
};
