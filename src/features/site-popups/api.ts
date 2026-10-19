import { apiClient } from "@/lib/api";
import type { PublicSitePopup, SitePopup, SitePopupInput } from "./types";

type Envelope<T> = { success: boolean; data: T };

/** Public: popups that are switched on and inside their schedule. */
export const sitePopupsApi = {
  listActive: async (): Promise<PublicSitePopup[]> => {
    const res = await apiClient.get<Envelope<{ popups: PublicSitePopup[] }>>("/config/popups");
    return res.data.data.popups ?? [];
  },
};

/** Super admin CRUD. */
export const sitePopupsAdminApi = {
  list: async (): Promise<SitePopup[]> => {
    const res = await apiClient.get<Envelope<{ popups: SitePopup[] }>>("/admin/popups");
    return res.data.data.popups ?? [];
  },
  get: async (id: string): Promise<SitePopup> => {
    const res = await apiClient.get<Envelope<SitePopup>>(`/admin/popups/${encodeURIComponent(id)}`);
    return res.data.data;
  },
  create: async (input: SitePopupInput): Promise<SitePopup> => {
    const res = await apiClient.post<Envelope<SitePopup>>("/admin/popups", input);
    return res.data.data;
  },
  update: async (id: string, input: SitePopupInput): Promise<SitePopup> => {
    const res = await apiClient.put<Envelope<SitePopup>>(`/admin/popups/${encodeURIComponent(id)}`, input);
    return res.data.data;
  },
  setEnabled: async (id: string, enabled: boolean): Promise<SitePopup> => {
    const res = await apiClient.patch<Envelope<SitePopup>>(`/admin/popups/${encodeURIComponent(id)}/enabled`, { enabled });
    return res.data.data;
  },
  duplicate: async (id: string): Promise<SitePopup> => {
    const res = await apiClient.post<Envelope<SitePopup>>(`/admin/popups/${encodeURIComponent(id)}/duplicate`);
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/popups/${encodeURIComponent(id)}`);
  },
};

export const SITE_POPUPS_QUERY_KEY = ["site-popups", "active"] as const;
