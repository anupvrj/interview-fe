import { apiClient } from "@/lib/api";
import type {
  AudiencePreview,
  BroadcastAudience,
  BroadcastInput,
  BroadcastRecipientRow,
  BroadcastSettings,
  EmailBroadcast,
  RecipientStatus,
} from "./types";

type Envelope<T> = { success: boolean; data: T };
const base = "/admin/broadcasts";
const one = (id: string) => `${base}/${encodeURIComponent(id)}`;

export const broadcastsAdminApi = {
  list: async (): Promise<EmailBroadcast[]> => {
    const res = await apiClient.get<Envelope<{ broadcasts: EmailBroadcast[] }>>(base);
    return res.data.data.broadcasts ?? [];
  },
  get: async (id: string): Promise<EmailBroadcast> => (await apiClient.get<Envelope<EmailBroadcast>>(one(id))).data.data,
  create: async (input: BroadcastInput): Promise<EmailBroadcast> =>
    (await apiClient.post<Envelope<EmailBroadcast>>(base, input)).data.data,
  update: async (id: string, input: BroadcastInput): Promise<EmailBroadcast> =>
    (await apiClient.put<Envelope<EmailBroadcast>>(one(id), input)).data.data,
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(one(id));
  },
  duplicate: async (id: string): Promise<EmailBroadcast> =>
    (await apiClient.post<Envelope<EmailBroadcast>>(`${one(id)}/duplicate`)).data.data,
  audience: async (input: {
    audience: { type: BroadcastAudience; hackathonSlug: string };
    cooldownHours: number;
    broadcastId?: string;
  }): Promise<AudiencePreview> => (await apiClient.post<Envelope<AudiencePreview>>(`${base}/audience`, input)).data.data,
  preview: async (input: Pick<BroadcastInput, "subject" | "preheader" | "content" | "audience" | "event">): Promise<{ subject: string; html: string }> =>
    (await apiClient.post<Envelope<{ subject: string; html: string }>>(`${base}/preview`, input)).data.data,
  test: async (id: string, to?: string[]): Promise<EmailBroadcast> =>
    (await apiClient.post<Envelope<EmailBroadcast>>(`${one(id)}/test`, to?.length ? { to } : {})).data.data,
  send: async (id: string, input: { expectedCount: number; scheduledAt?: string | null }): Promise<EmailBroadcast> =>
    (await apiClient.post<Envelope<EmailBroadcast>>(`${one(id)}/send`, input)).data.data,
  cancel: async (id: string): Promise<EmailBroadcast> => (await apiClient.post<Envelope<EmailBroadcast>>(`${one(id)}/cancel`)).data.data,
  resume: async (id: string): Promise<EmailBroadcast> => (await apiClient.post<Envelope<EmailBroadcast>>(`${one(id)}/resume`)).data.data,
  recipients: async (
    id: string,
    status: RecipientStatus | undefined,
    page: number,
  ): Promise<{ rows: BroadcastRecipientRow[]; total: number; page: number; pageSize: number }> =>
    (
      await apiClient.get<Envelope<{ rows: BroadcastRecipientRow[]; total: number; page: number; pageSize: number }>>(
        `${one(id)}/recipients`,
        { params: { status, page } },
      )
    ).data.data,
  getSettings: async (): Promise<BroadcastSettings> =>
    (await apiClient.get<Envelope<BroadcastSettings>>(`${base}/settings`)).data.data,
  updateSettings: async (input: BroadcastSettings): Promise<BroadcastSettings> =>
    (await apiClient.put<Envelope<BroadcastSettings>>(`${base}/settings`, input)).data.data,
};

/** Public: unsubscribe page. */
export const unsubscribeApi = {
  describe: async (token: string): Promise<{ test: boolean; email: string; unsubscribed: boolean }> =>
    (await apiClient.get<Envelope<{ test: boolean; email: string; unsubscribed: boolean }>>(`/email/unsubscribe/${encodeURIComponent(token)}`)).data.data,
  confirm: async (token: string): Promise<void> => {
    await apiClient.post("/email/unsubscribe", { token });
  },
};
