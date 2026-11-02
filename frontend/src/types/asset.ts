// Asset inventory types — mirror the backend enums and schemas.

export type AssetType =
  | "laptop"
  | "desktop"
  | "server"
  | "router"
  | "firewall"
  | "switch"
  | "database"
  | "application"
  | "user"
  | "cloud_instance";

export type Criticality = "critical" | "high" | "medium" | "low";

export type AssetStatus = "active" | "inactive" | "decommissioned" | "maintenance";

export type RiskLevel = "green" | "yellow" | "orange" | "red";

export interface RiskFactor {
  name: string;
  points: number;
  max_points: number;
  detail: string;
}

export interface RiskProfile {
  score: number; // 0–100
  level: RiskLevel;
  factors: RiskFactor[];
  summary: string;
}

// Risk factor inputs shared by Asset and AssetInput.
export interface RiskFactorFields {
  cvss_score: number;
  internet_exposed: boolean;
  missing_mfa: boolean;
  weak_password: boolean;
  misconfigured: boolean;
  open_ports: number;
  business_importance: number;
}

export interface Asset extends RiskFactorFields {
  id: string;
  name: string;
  hostname: string | null;
  ip_address: string | null;
  asset_type: AssetType;
  operating_system: string | null;
  owner: string | null;
  department: string | null;
  criticality: Criticality;
  status: AssetStatus;
  tags: string[];
  description: string | null;
  created_at: string;
  updated_at: string;
  risk: RiskProfile;
}

// Shape submitted by the add/edit dialog (no server-managed fields)
export interface AssetInput extends RiskFactorFields {
  name: string;
  hostname: string | null;
  ip_address: string | null;
  asset_type: AssetType;
  operating_system: string | null;
  owner: string | null;
  department: string | null;
  criticality: Criticality;
  status: AssetStatus;
  tags: string[];
  description: string | null;
}

// Risk level → display styles (badge + graph coloring).
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  green: "Low",
  yellow: "Guarded",
  orange: "Elevated",
  red: "Critical",
};

export const RISK_LEVEL_STYLES: Record<RiskLevel, string> = {
  green: "text-severity-low bg-severity-low/10 border-severity-low/30",
  yellow: "text-severity-medium bg-severity-medium/10 border-severity-medium/30",
  orange: "text-severity-high bg-severity-high/10 border-severity-high/30",
  red: "text-severity-critical bg-severity-critical/10 border-severity-critical/30",
};

// Raw hex per level for React Flow / inline styling.
export const RISK_LEVEL_HEX: Record<RiskLevel, string> = {
  green: "#4ade80",
  yellow: "#facc15",
  orange: "#fb923c",
  red: "#f43f5e",
};

export interface AssetPage {
  items: Asset[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface AssetQuery {
  search?: string;
  asset_type?: AssetType;
  criticality?: Criticality;
  status?: AssetStatus;
  department?: string;
  sort_by?: "name" | "risk" | "created_at";
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

// Human-readable labels + display metadata, shared across the UI.
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  laptop: "Laptop",
  desktop: "Desktop",
  server: "Server",
  router: "Router",
  firewall: "Firewall",
  switch: "Switch",
  database: "Database",
  application: "Application",
  user: "User",
  cloud_instance: "Cloud Instance",
};

export const CRITICALITY_LABELS: Record<Criticality, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const STATUS_LABELS: Record<AssetStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  decommissioned: "Decommissioned",
  maintenance: "Maintenance",
};

export const CRITICALITY_STYLES: Record<Criticality, string> = {
  critical: "text-severity-critical bg-severity-critical/10 border-severity-critical/20",
  high: "text-severity-high bg-severity-high/10 border-severity-high/20",
  medium: "text-severity-medium bg-severity-medium/10 border-severity-medium/20",
  low: "text-severity-low bg-severity-low/10 border-severity-low/20",
};

export const STATUS_STYLES: Record<AssetStatus, string> = {
  active: "text-severity-low bg-severity-low/10 border-severity-low/20",
  inactive: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  decommissioned: "text-severity-critical bg-severity-critical/10 border-severity-critical/20",
  maintenance: "text-severity-medium bg-severity-medium/10 border-severity-medium/20",
};
