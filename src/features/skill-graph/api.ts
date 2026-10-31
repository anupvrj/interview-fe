import { apiClient } from "@/lib/api";
import type {
  ResumeParseSummary,
  SkillGraph,
  SkillGraphDiff,
  SkillGraphExport,
  SkillLens,
  SkillNodeDetail,
  SkillReviewItem,
  TaxonomyNode,
} from "./types";

type Envelope<T> = { success: boolean; data: T };
const enc = encodeURIComponent;

/** `candidateId` is a Clerk user id or "me". */
export const skillGraphApi = {
  /** `asOf` replays the graph up to the end of one analysed interview (session scrubber). */
  getGraph: async (candidateId: string, opts: { lens?: SkillLens; asOf?: string | null } = {}): Promise<SkillGraph> => {
    const params: Record<string, string> = {};
    if (opts.lens) params.lens = opts.lens;
    if (opts.asOf) params.as_of = opts.asOf;
    const res = await apiClient.get<Envelope<SkillGraph>>(`/candidates/${enc(candidateId)}/skill-graph`, { params });
    return res.data.data;
  },
  /** Every node with its own score plus up to three quotes each, for the candidate to keep or share. */
  exportGraph: async (candidateId: string): Promise<SkillGraphExport> => {
    const res = await apiClient.get<Envelope<SkillGraphExport>>(`/candidates/${enc(candidateId)}/skill-graph/export`);
    return res.data.data;
  },
  getNode: async (candidateId: string, nodeId: string): Promise<SkillNodeDetail> => {
    const res = await apiClient.get<Envelope<SkillNodeDetail>>(`/candidates/${enc(candidateId)}/skill-graph/node/${enc(nodeId)}`);
    return res.data.data;
  },
  getDiff: async (candidateId: string, since: string): Promise<SkillGraphDiff> => {
    const res = await apiClient.get<Envelope<SkillGraphDiff>>(`/candidates/${enc(candidateId)}/skill-graph/diff`, { params: { since } });
    return res.data.data;
  },
  parseResume: async (candidateId: string): Promise<ResumeParseSummary> => {
    const res = await apiClient.post<Envelope<ResumeParseSummary>>(`/candidates/${enc(candidateId)}/resume/parse`, {});
    return res.data.data;
  },
  getTaxonomy: async (): Promise<TaxonomyNode[]> => {
    const res = await apiClient.get<Envelope<{ nodes: TaxonomyNode[] }>>("/skill-graph/taxonomy");
    return res.data.data.nodes ?? [];
  },
};

export type ManualSkillEdit = {
  action: "add" | "remove" | "restore";
  nodeId?: string;
  name?: string;
  domain?: string;
  aliases?: string[];
};

export type ResolveReviewInput = {
  action: "accept" | "reject";
  nodeId?: string;
  name?: string;
  domain?: string;
};

/** Super admin. */
export const skillGraphAdminApi = {
  listQueue: async (status: SkillReviewItem["status"] = "pending"): Promise<SkillReviewItem[]> => {
    const res = await apiClient.get<Envelope<{ items: SkillReviewItem[] }>>("/admin/skill-graph/review-queue", { params: { status } });
    return res.data.data.items ?? [];
  },
  resolve: async (id: string, input: ResolveReviewInput): Promise<{ status: string; node_id: string | null }> => {
    const res = await apiClient.post<Envelope<{ status: string; node_id: string | null }>>(`/review-queue/${enc(id)}/resolve`, input);
    return res.data.data;
  },
  editSkill: async (candidateId: string, input: ManualSkillEdit): Promise<{ node_id: string; node_created: boolean; status: string | null }> => {
    const res = await apiClient.post<Envelope<{ node_id: string; node_created: boolean; status: string | null }>>(`/candidates/${enc(candidateId)}/skills`, input);
    return res.data.data;
  },
};

export const skillGraphKeys = {
  graph: (candidateId: string, asOf?: string | null) => ["skill-graph", candidateId, "graph", asOf ?? "live"] as const,
  node: (candidateId: string, nodeId: string) => ["skill-graph", candidateId, "node", nodeId] as const,
  diff: (candidateId: string, since: string) => ["skill-graph", candidateId, "diff", since] as const,
  taxonomy: ["skill-graph", "taxonomy"] as const,
  queue: (status: string) => ["skill-graph", "review-queue", status] as const,
};
