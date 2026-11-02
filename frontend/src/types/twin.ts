// Digital Twin graph types — mirror the backend twin schemas.

import type { AssetStatus, AssetType, Criticality, RiskLevel } from "./asset";

export type RelationshipType =
  | "USES"
  | "RUNS_ON"
  | "CONNECTS_TO"
  | "STORES"
  | "PROTECTS"
  | "MEMBER_OF";

export const RELATIONSHIP_TYPES: RelationshipType[] = [
  "USES",
  "RUNS_ON",
  "CONNECTS_TO",
  "STORES",
  "PROTECTS",
  "MEMBER_OF",
];

export interface GraphNode {
  id: string;
  name: string;
  asset_type: AssetType;
  criticality: Criticality;
  status: AssetStatus;
  hostname: string | null;
  ip_address: string | null;
  risk_score: number;
  risk_level: RiskLevel;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RelationshipCreate {
  source: string;
  target: string;
  type: RelationshipType;
}

export interface RelationshipUpdate {
  source: string;
  target: string;
  type: RelationshipType;
}

// Relationship enriched with asset names/types, used by the viewer.
export interface RelationshipView {
  id: string;
  source: string;
  source_name: string;
  source_type: AssetType;
  target: string;
  target_name: string;
  target_type: AssetType;
  type: RelationshipType;
}

// Validation matrix from the backend: allowed source/target asset types per type.
export type RelationshipRules = Record<
  RelationshipType,
  { sources: AssetType[]; targets: AssetType[] }
>;

// --- Attack Path Analysis ---

export interface AttackPathNode {
  id: string;
  name: string;
  asset_type: AssetType;
  risk_score: number;
  risk_level: RiskLevel;
}

export interface AttackStep {
  from_id: string;
  from_name: string;
  to_id: string;
  to_name: string;
  relationship: RelationshipType;
  explanation: string;
  step_probability: number;
}

export interface AttackPath {
  id: string;
  nodes: AttackPathNode[];
  steps: AttackStep[];
  probability: number;
  length: number;
  entry_name: string;
  target_name: string;
  weakest_link_id: string;
  weakest_link_name: string;
  weakest_link_score: number;
}

export interface AttackPathResponse {
  paths: AttackPath[];
}

// Human-readable labels for relationship types.
export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  USES: "Uses",
  RUNS_ON: "Runs On",
  CONNECTS_TO: "Connects To",
  STORES: "Stores",
  PROTECTS: "Protects",
  MEMBER_OF: "Member Of",
};
