import apiClient from "./client";
import type { DashboardData } from "../types/dashboard";

/** Fetch all KPI cards and chart series for the SOC dashboard. */
export async function getDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get<DashboardData>("/dashboard");
  return data;
}
