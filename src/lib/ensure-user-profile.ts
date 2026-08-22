import { getAuthToken, userApi, type User } from "@/lib/api";

export type ClerkUserLike = {
  id: string;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  fullName?: string | null;
  firstName?: string | null;
};

function clerkUserFields(user: ClerkUserLike) {
  return {
    clerkId: user.id,
    email: user.primaryEmailAddress?.emailAddress || "",
    name: user.fullName || user.firstName || "User",
  };
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Ensure a MongoDB user exists for this Clerk account, then load the profile. */
export async function ensureUserProfile(
  clerkUser: ClerkUserLike,
  maxAttempts = 4,
): Promise<User> {
  const { clerkId, email, name } = clerkUserFields(clerkUser);
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        await delay(250 * attempt);
      }
      await getAuthToken();
      await userApi.createOrGetUser(clerkId, email, name);
      return await userApi.getMyProfile();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
