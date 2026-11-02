import apiClient from "./client";
import type {
  Finding,
  FindingCatalog,
  FindingInput,
  FindingPage,
  FindingQuery,
  FindingStats,
} from "../types/finding";

/** List findings with search/filter/pagination. */
export async function listFindings(query: FindingQuery = {}): Promise<FindingPage> {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get<FindingPage>("/findings", { params });
  return data;
}

/** Aggregate dashboard stats. */
export async function getStats(): Promise<FindingStats> {
  const { data } = await apiClient.get<FindingStats>("/findings/stats");
  return data;
}

/** Auto-generate findings from asset risk factors. */
export async function generateFindings(): Promise<{ created: number; message: string }> {
  const { data } = await apiClient.post("/findings/generate");
  return data;
}

/** Fetch the finding template catalog (defaults + MITRE mapping). */
export async function getCatalog(): Promise<FindingCatalog> {
  const { data } = await apiClient.get<FindingCatalog>("/findings/catalog/templates");
  return data;
}

export async function getFinding(id: string): Promise<Finding> {
  const { data } = await apiClient.get<Finding>(`/findings/${id}`);
  return data;
}

export async function createFinding(payload: FindingInput): Promise<Finding> {
  const { data } = await apiClient.post<Finding>("/findings", payload);
  return data;
}

export async function updateFinding(id: string, payload: Partial<FindingInput>): Promise<Finding> {
  const { data } = await apiClient.patch<Finding>(`/findings/${id}`, payload);
  return data;
}

export async function deleteFinding(id: string): Promise<void> {
  await apiClient.delete(`/findings/${id}`);
}
