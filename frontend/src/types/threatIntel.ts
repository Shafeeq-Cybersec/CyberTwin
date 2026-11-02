// Threat Intelligence types — mirror the backend threat_intel schemas.

import type { Severity } from "./vulnerability";

export type ThreatSource = "mitre_attack" | "cve" | "cisa_kev" | "capec";

export interface ThreatIntel {
  id: string;
  source: ThreatSource;
  external_id: string;
  title: string;
  description: string | null;
  severity: Severity | null;
  cvss: number | null;
  kev: boolean;
  mitre_technique_id: string | null;
  mitre_tactic: string | null;
  capec_id: string | null;
  references: string[];
  published: string | null;
  created_at: string;
}

export interface ImportResult {
  imported: Record<string, number>;
  total: number;
  message: string;
}

export interface CorrelationResult {
  threats_matched: number;
  assets_updated: number;
  findings_created: number;
  message: string;
}

export interface ThreatStats {
  total: number;
  by_source: Record<string, number>;
  kev_count: number;
}

export interface AssetThreatMatch {
  threat: ThreatIntel;
  via_cve: string;
}

export const THREAT_SOURCE_LABELS: Record<ThreatSource, string> = {
  mitre_attack: "MITRE ATT&CK",
  cve: "CVE Database",
  cisa_kev: "CISA KEV",
  capec: "CAPEC",
};

export const THREAT_SOURCE_STYLES: Record<ThreatSource, string> = {
  mitre_attack: "text-severity-info bg-severity-info/10 border-severity-info/20",
  cve: "text-accent bg-accent/10 border-accent/20",
  cisa_kev: "text-severity-critical bg-severity-critical/10 border-severity-critical/20",
  capec: "text-severity-medium bg-severity-medium/10 border-severity-medium/20",
};
