import { paymentApi } from "@/lib/api";

/** True when user must renew before starting paid sessions. */
export async function fetchSubscriptionExpired(): Promise<boolean> {
  try {
    const sub = await paymentApi.getSubscription();
    if (!sub) return false;
    return (
      sub.isExpired === true ||
      sub.needsRenewal === true ||
      sub.status === "expired" ||
      !!sub.expiredPlanId
    );
  } catch {
    try {
      const limit = await paymentApi.checkInterviewLimit();
      return limit.isExpired === true;
    } catch {
      return false;
    }
  }
}
