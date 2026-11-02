// Security findings types — mirror the backend finding schemas.

import type { AssetType, Criticality } from "./asset";
import type { AssetSummary, Severity, VulnStatus } from "./vulnerability";

// Reuse severity + status enums/labels/styles from vulnerabilities.
export type { AssetSummary, Severity, VulnStatus };
export {
  SEVERITY_LABELS,
  SEVERITY_STYLES,
  VULN_STATUS_LABELS as FINDING_STATUS_LABELS,
  VULN_STATUS_STYLES as FINDING_STATUS_STYLES,
} from "./vulnerability";

export type FindingType =
  | "weak_password"
  | "missing_mfa"
  | "open_rdp"
  | "open_ssh"
  | "critical_cve"
  | "exposed_database"
  | "privilege_escalation"
  | "lateral_movement_risk";

export interface Finding {
  id: string;
  finding_type: FindingType;
  title: string;
  severity: Severity;
  description: string | null;
  recommendation: string | null;
  mitre_tactic: string | null;
  mitre_technique_id: string | null;
  mitre_technique_name: string | null;
  status: VulnStatus;
  asset_id: string;
  asset: AssetSummary;
  created_at: string;
  updated_at: string;
}

export interface FindingInput {
  finding_type: FindingType;
  title: string;
  severity: Severity;
  description: string | null;
  recommendation: string | null;
  mitre_tactic: string | null;
  mitre_technique_id: string | null;
  mitre_technique_name: string | null;
  status: VulnStatus;
  asset_id: string;
}

export interface FindingPage {
  items: Finding[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface FindingStats {
  total: number;
  open: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
}

export interface FindingQuery {
  search?: string;
  finding_type?: FindingType;
  severity?: Severity;
  status?: VulnStatus;
  asset_id?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

// A finding template from the backend catalog (defaults + MITRE mapping).
export interface FindingTemplate {
  title: string;
  severity: Severity;
  description: string;
  recommendation: string;
  mitre_tactic: string;
  mitre_technique_id: string;
  mitre_technique_name: string;
}

export type FindingCatalog = Record<FindingType, FindingTemplate>;

export const FINDING_TYPE_LABELS: Record<FindingType, string> = {
  weak_password: "Weak Password",
  missing_mfa: "Missing MFA",
  open_rdp: "Open RDP",
  open_ssh: "Open SSH",
  critical_cve: "Critical CVE",
  exposed_database: "Exposed Database",
  privilege_escalation: "Privilege Escalation",
  lateral_movement_risk: "Lateral Movement Risk",
};

// re-export for consumers that only import from finding.ts
export type { AssetType, Criticality };
