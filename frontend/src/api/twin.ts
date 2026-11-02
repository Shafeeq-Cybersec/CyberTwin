import apiClient from "./client";
import type {
  AttackPathResponse,
  Graph,
  RelationshipCreate,
  RelationshipRules,
  RelationshipUpdate,
  RelationshipView,
} from "../types/twin";

/** Fetch the full digital twin graph (asset nodes + relationships). */
export async function getGraph(): Promise<Graph> {
  const { data } = await apiClient.get<Graph>("/twin/graph");
  return data;
}

/** List all relationships enriched with asset names (for the viewer). */
export async function listRelationships(): Promise<RelationshipView[]> {
  const { data } = await apiClient.get<RelationshipView[]>("/twin/relationships");
  return data;
}

/** Fetch the validation matrix (which asset types are valid per relationship). */
export async function getRelationshipRules(): Promise<RelationshipRules> {
  const { data } = await apiClient.get<RelationshipRules>("/twin/relationship-rules");
  return data;
}

/** Create a relationship between two assets. */
export async function createRelationship(payload: RelationshipCreate): Promise<RelationshipView> {
  const { data } = await apiClient.post<RelationshipView>("/twin/relationships", payload);
  return data;
}

/** Update a relationship's type and/or endpoints. */
export async function updateRelationship(
  elementId: string,
  payload: RelationshipUpdate
): Promise<RelationshipView> {
  const { data } = await apiClient.patch<RelationshipView>(
    `/twin/relationships/${encodeURIComponent(elementId)}`,
    payload
  );
  return data;
}

/** Delete a relationship by its Neo4j element id. */
export async function deleteRelationship(elementId: string): Promise<void> {
  await apiClient.delete(`/twin/relationships/${encodeURIComponent(elementId)}`);
}

/** Analyze attack paths, optionally scoped to a target asset. */
export async function getAttackPaths(targetId?: string): Promise<AttackPathResponse> {
  const params = targetId ? { target_id: targetId } : {};
  const { data } = await apiClient.get<AttackPathResponse>("/twin/attack-paths", { params });
  return data;
}
