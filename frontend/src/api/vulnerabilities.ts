import apiClient from "./client";
import type {
  Vulnerability,
  VulnerabilityInput,
  VulnerabilityPage,
  VulnerabilityQuery,
} from "../types/vulnerability";

/** List vulnerabilities with search/filter/pagination. */
export async function listVulnerabilities(query: VulnerabilityQuery = {}): Promise<VulnerabilityPage> {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get<VulnerabilityPage>("/vulnerabilities", { params });
  return data;
}

/** Fetch a single vulnerability by id. */
export async function getVulnerability(id: string): Promise<Vulnerability> {
  const { data } = await apiClient.get<Vulnerability>(`/vulnerabilities/${id}`);
  return data;
}

/** Create a vulnerability. */
export async function createVulnerability(payload: VulnerabilityInput): Promise<Vulnerability> {
  const { data } = await apiClient.post<Vulnerability>("/vulnerabilities", payload);
  return data;
}

/** Partially update a vulnerability. */
export async function updateVulnerability(
  id: string,
  payload: Partial<VulnerabilityInput>
): Promise<Vulnerability> {
  const { data } = await apiClient.patch<Vulnerability>(`/vulnerabilities/${id}`, payload);
  return data;
}

/** Delete a vulnerability. */
export async function deleteVulnerability(id: string): Promise<void> {
  await apiClient.delete(`/vulnerabilities/${id}`);
}

/** Attach an asset to a vulnerability. */
export async function attachAsset(vulnId: string, assetId: string): Promise<Vulnerability> {
  const { data } = await apiClient.post<Vulnerability>(`/vulnerabilities/${vulnId}/assets/${assetId}`);
  return data;
}

/** Detach an asset from a vulnerability. */
export async function detachAsset(vulnId: string, assetId: string): Promise<Vulnerability> {
  const { data } = await apiClient.delete<Vulnerability>(`/vulnerabilities/${vulnId}/assets/${assetId}`);
  return data;
}
