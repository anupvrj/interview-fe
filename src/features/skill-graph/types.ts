/** Mirrors interview-core `modules/skillGraph` API responses (SKILL-GRAPH-V1-SPEC §7). */

export type SkillLens = "knowledge" | "problem_solving" | "communication";
export type SkillStatus = "unassessed" | "claimed" | "verified" | "hidden" | "gap";
export type CommunicationBand = "developing" | "solid" | "strong";

export interface SkillGraphNode {
  id: string;
  name: string;
  parent_id: string | null;
  lens: SkillLens;
  domain: string;
  is_main: boolean;
  status: SkillStatus;
  /** Main nodes only (children carry null in the graph; see the detail panel). */
  score: number | null;
  /** Communication shows a band instead of a score until confidence > 0.6. */
  band: CommunicationBand | null;
  confidence: number | null;
  coverage?: number;
  importance: number;
  evidence_count: number;
  origin: string;
}

export interface SkillGraphEdge {
  from: string;
  to: string;
  type: "parent" | "applies";
}

export interface AnalyzedInterview {
  interview_id: string;
  round: string;
  events: number;
  analyzed_at: string;
}

export interface SkillGraph {
  candidate_id: string;
  as_of?: string | null;
  role_ids: string[];
  last_resume_parse_at: string | null;
  nodes: SkillGraphNode[];
  edges: SkillGraphEdge[];
  interviews: AnalyzedInterview[];
}

export interface SkillEvidenceEvent {
  event_id: string;
  node_id: string;
  node_name: string;
  round: "resume" | "interview" | "coding" | "system_design" | "manual";
  source: "resume" | "grader" | "report_metric" | "manual";
  level: number | null;
  outcome: number | null;
  weight: number;
  quote_text: string | null;
  quote_turn: number | null;
  source_ref: string | null;
  manual_action: "claim" | "hide" | "unhide" | null;
  interview_id: string | null;
  grader_model: string | null;
  rubric_version: string | null;
  created_at: string;
}

export interface SkillNodeDetail {
  node: SkillGraphNode;
  score: number | null;
  confidence: number | null;
  children: SkillGraphNode[];
  events: SkillEvidenceEvent[];
}

export interface SkillStateSnapshot {
  status: SkillStatus | null;
  score: number | null;
  confidence: number | null;
  coverage: number | null;
  band: CommunicationBand | null;
}

export interface SkillGraphDiff {
  candidate_id: string;
  since: string;
  events_added: number;
  changes: Array<{
    node_id: string;
    name: string;
    lens: SkillLens | null;
    is_main: boolean;
    parent_id: string | null;
    before: SkillStateSnapshot;
    after: SkillStateSnapshot;
  }>;
  new_skills: Array<{ node_id: string; name: string }>;
}

export interface ResumeParseSummary {
  candidate_id: string;
  role_id: string;
  claimed_nodes: string[];
  nodes_in_graph: number;
  unassessed_nodes: number;
  unmapped_phrases: string[];
  review_queue_added: number;
  review_queue_pending: number;
}

export interface SkillReviewItem {
  id: string;
  candidate_id: string;
  raw_phrase: string;
  suggested_domain: string | null;
  suggested_lens: SkillLens | null;
  quote_text: string | null;
  interview_id: string | null;
  origin: string;
  status: "pending" | "accepted" | "rejected";
  resolved_node_id: string | null;
  created_at: string;
}

export interface TaxonomyNode {
  id: string;
  name: string;
  parent_id: string | null;
  lens: SkillLens;
  domain: string;
  is_main: boolean;
}

export interface SkillGraphExport {
  schema: string;
  exported_at: string;
  candidate_id: string;
  role_ids: string[];
  scoring: Record<string, string>;
  nodes: Array<Omit<SkillGraphNode, "origin"> & { evidence: Array<{ round: string; level: number | null; quote: string | null; interview_id: string | null; at: string }> }>;
  edges: SkillGraphEdge[];
}
