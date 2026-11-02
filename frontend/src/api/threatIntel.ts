import apiClient from "./client";
import type {
  AssetThreatMatch,
  CorrelationResult,
  ImportResult,
  ThreatIntel,
  ThreatSource,
  ThreatStats,
} from "../types/threatIntel";

/** Import threat feeds (all sources, or one). */
export async function importFeeds(source?: ThreatSource): Promise<ImportResult> {
  const params = source ? { source } : {};
  const { data } = await apiClient.post<ImportResult>("/threat-intel/import", null, { params });
  return data;
}

/** Correlate imported threats to assets (creates findings, updates risk). */
export async function correlate(): Promise<CorrelationResult> {
  const { data } = await apiClient.post<CorrelationResult>("/threat-intel/correlate");
  return data;
}

/** Aggregate stats. */
export async function getStats(): Promise<ThreatStats> {
  const { data } = await apiClient.get<ThreatStats>("/threat-intel/stats");
  return data;
}

/** List imported threat entries. */
export async function listThreats(params: {
  source?: ThreatSource;
  kev_only?: boolean;
  search?: string;
} = {}): Promise<ThreatIntel[]> {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== false)
  );
  const { data } = await apiClient.get<ThreatIntel[]>("/threat-intel", { params: clean });
  return data;
}

/** Threats correlated to a specific asset. */
export async function matchesForAsset(assetId: string): Promise<AssetThreatMatch[]> {
  const { data } = await apiClient.get<AssetThreatMatch[]>(`/threat-intel/asset/${assetId}`);
  return data;
}
