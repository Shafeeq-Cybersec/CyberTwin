// SOC dashboard types — mirror the backend dashboard schema.

export interface DashboardKpis {
  total_assets: number;
  critical_assets: number;
  internet_facing_assets: number;
  high_risk_users: number;
  critical_cves: number;
  average_risk_score: number;
}

export interface LabeledCount {
  label: string;
  value: number;
}

export interface DepartmentRisk {
  department: string;
  average_risk: number;
  asset_count: number;
}

export interface TopVulnerability {
  id: string;
  cve_id: string;
  title: string | null;
  severity: string;
  cvss: number;
  affected_assets: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  risk_distribution: LabeledCount[];
  asset_types: LabeledCount[];
  department_risk: DepartmentRisk[];
  operating_systems: LabeledCount[];
  top_vulnerabilities: TopVulnerability[];
}
