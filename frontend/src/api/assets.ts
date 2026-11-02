import apiClient from "./client";
import type { Asset, AssetInput, AssetPage, AssetQuery } from "../types/asset";

/** List assets with search/filter/sort/pagination. */
export async function listAssets(query: AssetQuery = {}): Promise<AssetPage> {
  // Drop undefined/empty params so we don't send blank query strings
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get<AssetPage>("/assets", { params });
  return data;
}

/** Fetch a single asset by id. */
export async function getAsset(id: string): Promise<Asset> {
  const { data } = await apiClient.get<Asset>(`/assets/${id}`);
  return data;
}

/** Create a new asset. */
export async function createAsset(payload: AssetInput): Promise<Asset> {
  const { data } = await apiClient.post<Asset>("/assets", payload);
  return data;
}

/** Partially update an asset. */
export async function updateAsset(id: string, payload: Partial<AssetInput>): Promise<Asset> {
  const { data } = await apiClient.patch<Asset>(`/assets/${id}`, payload);
  return data;
}

/** Delete an asset. */
export async function deleteAsset(id: string): Promise<void> {
  await apiClient.delete(`/assets/${id}`);
}
