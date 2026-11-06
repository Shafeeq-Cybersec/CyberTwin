import { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { DashboardData } from "../types/dashboard";
import type { Asset } from "../types/asset";
import type { Graph, RelationshipRules, RelationshipView, AttackPathResponse } from "../types/twin";
import type { Vulnerability } from "../types/vulnerability";
import type { Finding } from "../types/finding";
import type { ThreatIntel, ThreatStats } from "../types/threatIntel";

// Default demo user
export const MOCK_USER = {
  id: "usr-demo-001",
  email: "analyst@company.com",
  full_name: "Lead SOC Analyst",
  role: "admin",
  created_at: new Date().toISOString(),
};

export const MOCK_ASSETS: Asset[] = [
  {
    id: "ast-001",
    name: "Edge Gateway FW-01",
    hostname: "fw01.prod.corp",
    ip_address: "198.51.100.1",
    asset_type: "firewall",
    operating_system: "FortiOS 7.2.4",
    department: "Infrastructure",
    criticality: "critical",
    status: "active",
    owner: "Network SecOps",
    tags: ["perimeter", "firewall", "production"],
    description: "Main ingress perimeter firewall",
    cvss_score: 8.8,
    internet_exposed: true,
    missing_mfa: false,
    weak_password: false,
    misconfigured: false,
    open_ports: 3,
    business_importance: 9,
    risk: {
      score: 78,
      level: "red",
      summary: "High risk due to internet exposure and critical CVSS score",
      factors: [
        { name: "Internet Exposure", points: 30, max_points: 30, detail: "Directly facing WAN" },
        { name: "CVSS Severity", points: 28, max_points: 30, detail: "CVSS 8.8 detected" },
      ],
    },
    created_at: "2026-01-15T08:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "ast-002",
    name: "Customer Portal Web App",
    hostname: "app-prod.corp",
    ip_address: "10.0.1.50",
    asset_type: "application",
    operating_system: "Ubuntu Linux 22.04 LTS",
    department: "Engineering",
    criticality: "critical",
    status: "active",
    owner: "DevOps",
    tags: ["web", "api", "customer-facing"],
    description: "Public facing customer portal with payment gateway link",
    cvss_score: 7.5,
    internet_exposed: true,
    missing_mfa: false,
    weak_password: false,
    misconfigured: true,
    open_ports: 2,
    business_importance: 10,
    risk: {
      score: 82,
      level: "red",
      summary: "Critical risk: misconfigured and facing internet",
      factors: [
        { name: "Misconfiguration", points: 25, max_points: 25, detail: "Unrestricted admin endpoint" },
        { name: "Internet Exposure", points: 30, max_points: 30, detail: "Direct public access" },
      ],
    },
    created_at: "2026-01-18T09:00:00Z",
    updated_at: "2026-03-05T11:20:00Z",
  },
  {
    id: "ast-003",
    name: "Postgres Master DB",
    hostname: "db01.internal.corp",
    ip_address: "10.0.2.10",
    asset_type: "database",
    operating_system: "Debian 12",
    department: "Data Platform",
    criticality: "critical",
    status: "active",
    owner: "DBA Team",
    tags: ["database", "pii", "core-data"],
    description: "Primary transactional database containing customer PII",
    cvss_score: 5.2,
    internet_exposed: false,
    missing_mfa: false,
    weak_password: false,
    misconfigured: false,
    open_ports: 1,
    business_importance: 10,
    risk: {
      score: 55,
      level: "orange",
      summary: "High business impact data store",
      factors: [
        { name: "Business Criticality", points: 30, max_points: 30, detail: "Tier 1 asset" },
      ],
    },
    created_at: "2026-01-10T08:00:00Z",
    updated_at: "2026-02-28T14:15:00Z",
  },
  {
    id: "ast-004",
    name: "John Doe's Workstation",
    hostname: "jdoe-lap.corp",
    ip_address: "10.0.5.120",
    asset_type: "laptop",
    operating_system: "Windows 11 Enterprise",
    department: "Finance",
    criticality: "medium",
    status: "active",
    owner: "John Doe",
    tags: ["endpoint", "finance", "executive"],
    description: "Workstation with access to financial systems",
    cvss_score: 6.4,
    internet_exposed: false,
    missing_mfa: true,
    weak_password: true,
    misconfigured: false,
    open_ports: 4,
    business_importance: 6,
    risk: {
      score: 64,
      level: "orange",
      summary: "Elevated risk due to weak identity hygiene",
      factors: [
        { name: "Missing MFA", points: 20, max_points: 20, detail: "Password-only auth" },
        { name: "Weak Password", points: 15, max_points: 20, detail: "Fails length requirement" },
      ],
    },
    created_at: "2026-02-01T10:00:00Z",
    updated_at: "2026-03-04T09:30:00Z",
  },
  {
    id: "ast-005",
    name: "Core Switch SW-01",
    hostname: "sw-core01.corp",
    ip_address: "10.0.0.1",
    asset_type: "switch",
    operating_system: "Cisco IOS-XE 17.9",
    department: "Infrastructure",
    criticality: "high",
    status: "active",
    owner: "Network SecOps",
    tags: ["network", "switch", "backbone"],
    description: "Backbone router & switch connecting subnets",
    cvss_score: 4.1,
    internet_exposed: false,
    missing_mfa: false,
    weak_password: false,
    misconfigured: false,
    open_ports: 2,
    business_importance: 8,
    risk: {
      score: 38,
      level: "yellow",
      summary: "Moderate network tier risk",
      factors: [
        { name: "Business Importance", points: 20, max_points: 30, detail: "High value conduit" },
      ],
    },
    created_at: "2026-01-05T08:00:00Z",
    updated_at: "2026-02-15T12:00:00Z",
  },
  {
    id: "ast-006",
    name: "Internal Active Directory DC",
    hostname: "dc01.corp",
    ip_address: "10.0.0.10",
    asset_type: "server",
    operating_system: "Windows Server 2022",
    department: "IT Ops",
    criticality: "critical",
    status: "active",
    owner: "IT Admin",
    tags: ["domain-controller", "identity", "tier0"],
    description: "Domain controller holding Kerberos & user identities",
    cvss_score: 9.1,
    internet_exposed: false,
    missing_mfa: false,
    weak_password: false,
    misconfigured: true,
    open_ports: 8,
    business_importance: 10,
    risk: {
      score: 86,
      level: "red",
      summary: "Critical identity target for lateral movement",
      factors: [
        { name: "Tier 0 Asset", points: 30, max_points: 30, detail: "Compromise yields full domain admin" },
        { name: "Misconfigured ACLs", points: 25, max_points: 25, detail: "Overly permissive object delegation" },
      ],
    },
    created_at: "2026-01-08T09:00:00Z",
    updated_at: "2026-03-06T16:00:00Z",
  },
];

export const MOCK_GRAPH: Graph = {
  nodes: MOCK_ASSETS.map((a) => ({
    id: a.id,
    name: a.name,
    asset_type: a.asset_type,
    criticality: a.criticality,
    status: a.status,
    hostname: a.hostname,
    ip_address: a.ip_address,
    risk_score: a.risk.score,
    risk_level: a.risk.level,
  })),
  edges: [
    { id: "rel-1", source: "ast-001", target: "ast-002", type: "CONNECTS_TO" },
    { id: "rel-2", source: "ast-002", target: "ast-003", type: "STORES" },
    { id: "rel-3", source: "ast-004", target: "ast-005", type: "CONNECTS_TO" },
    { id: "rel-4", source: "ast-005", target: "ast-006", type: "CONNECTS_TO" },
    { id: "rel-5", source: "ast-001", target: "ast-005", type: "PROTECTS" },
  ],
};

export const MOCK_RELATIONSHIPS: RelationshipView[] = [
  {
    id: "rel-1",
    source: "ast-001",
    source_name: "Edge Gateway FW-01",
    source_type: "firewall",
    target: "ast-002",
    target_name: "Customer Portal Web App",
    target_type: "application",
    type: "CONNECTS_TO",
  },
  {
    id: "rel-2",
    source: "ast-002",
    source_name: "Customer Portal Web App",
    source_type: "application",
    target: "ast-003",
    target_name: "Postgres Master DB",
    target_type: "database",
    type: "STORES",
  },
  {
    id: "rel-3",
    source: "ast-004",
    source_name: "John Doe's Workstation",
    source_type: "laptop",
    target: "ast-005",
    target_name: "Core Switch SW-01",
    target_type: "switch",
    type: "CONNECTS_TO",
  },
  {
    id: "rel-4",
    source: "ast-005",
    source_name: "Core Switch SW-01",
    source_type: "switch",
    target: "ast-006",
    target_name: "Internal Active Directory DC",
    target_type: "server",
    type: "CONNECTS_TO",
  },
  {
    id: "rel-5",
    source: "ast-001",
    source_name: "Edge Gateway FW-01",
    source_type: "firewall",
    target: "ast-005",
    target_name: "Core Switch SW-01",
    target_type: "switch",
    type: "PROTECTS",
  },
];

export const MOCK_RELATIONSHIP_RULES: RelationshipRules = {
  USES: {
    sources: ["user", "application"],
    targets: ["laptop", "desktop", "application", "database", "cloud_instance"],
  },
  RUNS_ON: {
    sources: ["application", "database"],
    targets: ["server", "cloud_instance"],
  },
  CONNECTS_TO: {
    sources: ["laptop", "desktop", "server", "router", "firewall", "switch", "cloud_instance", "application"],
    targets: ["router", "firewall", "switch", "server", "database", "cloud_instance", "application"],
  },
  STORES: {
    sources: ["application", "database", "server"],
    targets: ["database", "server", "cloud_instance"],
  },
  PROTECTS: {
    sources: ["firewall", "router"],
    targets: ["laptop", "desktop", "server", "router", "switch", "database", "cloud_instance", "application"],
  },
  MEMBER_OF: {
    sources: ["user", "server", "laptop", "desktop"],
    targets: ["server", "cloud_instance"],
  },
};

export const MOCK_ATTACK_PATHS: AttackPathResponse = {
  paths: [
    {
      id: "path-1",
      probability: 0.82,
      length: 3,
      entry_name: "Edge Gateway FW-01",
      target_name: "Postgres Master DB",
      weakest_link_id: "ast-002",
      weakest_link_name: "Customer Portal Web App",
      weakest_link_score: 82,
      nodes: [
        { id: "ast-001", name: "Edge Gateway FW-01", asset_type: "firewall", risk_score: 78, risk_level: "red" },
        { id: "ast-002", name: "Customer Portal Web App", asset_type: "application", risk_score: 82, risk_level: "red" },
        { id: "ast-003", name: "Postgres Master DB", asset_type: "database", risk_score: 55, risk_level: "orange" },
      ],
      steps: [
        {
          from_id: "ast-001",
          from_name: "Edge Gateway FW-01",
          to_id: "ast-002",
          to_name: "Customer Portal Web App",
          relationship: "CONNECTS_TO",
          explanation: "Inbound HTTP/S traffic allowed from perimeter to web tier",
          step_probability: 0.9,
        },
        {
          from_id: "ast-002",
          from_name: "Customer Portal Web App",
          to_id: "ast-003",
          to_name: "Postgres Master DB",
          relationship: "STORES",
          explanation: "App executes SQL queries directly with stored DB credentials",
          step_probability: 0.85,
        },
      ],
    },
  ],
};

export const MOCK_DASHBOARD: DashboardData = {
  kpis: {
    total_assets: 6,
    critical_assets: 4,
    internet_facing_assets: 2,
    high_risk_users: 1,
    critical_cves: 3,
    average_risk_score: 67.1,
  },
  risk_distribution: [
    { label: "Low", value: 0 },
    { label: "Medium", value: 1 },
    { label: "High", value: 2 },
    { label: "Critical", value: 3 },
  ],
  asset_types: [
    { label: "Firewall", value: 1 },
    { label: "Application", value: 1 },
    { label: "Database", value: 1 },
    { label: "Laptop", value: 1 },
    { label: "Switch", value: 1 },
    { label: "Server", value: 1 },
  ],
  department_risk: [
    { department: "IT Ops", average_risk: 86.0, asset_count: 1 },
    { department: "Engineering", average_risk: 82.0, asset_count: 1 },
    { department: "Infrastructure", average_risk: 58.0, asset_count: 2 },
    { department: "Finance", average_risk: 64.0, asset_count: 1 },
    { department: "Data Platform", average_risk: 55.0, asset_count: 1 },
  ],
  operating_systems: [
    { label: "Windows", value: 2 },
    { label: "Linux / Debian", value: 2 },
    { label: "Cisco IOS", value: 1 },
    { label: "FortiOS", value: 1 },
  ],
  top_vulnerabilities: [
    {
      id: "vuln-001",
      cve_id: "CVE-2024-3400",
      title: "Palo Alto PAN-OS Command Injection",
      severity: "critical",
      cvss: 10.0,
      affected_assets: 1,
    },
    {
      id: "vuln-002",
      cve_id: "CVE-2023-48795",
      title: "SSH Terrapin Prefix Truncation Attack",
      severity: "high",
      cvss: 7.5,
      affected_assets: 3,
    },
    {
      id: "vuln-003",
      cve_id: "CVE-2023-38606",
      title: "Kernel Remote Privilege Escalation",
      severity: "critical",
      cvss: 9.8,
      affected_assets: 2,
    },
  ],
};

export const MOCK_VULNERABILITIES: Vulnerability[] = [
  {
    id: "vuln-001",
    cve_id: "CVE-2024-3400",
    title: "Palo Alto PAN-OS Command Injection",
    description: "An arbitrary code execution vulnerability in the GlobalProtect feature allows an unauthenticated attacker to execute arbitrary code with root privileges.",
    severity: "critical",
    cvss: 10.0,
    recommendation: "Apply hotfix from vendor bulletin.",
    status: "open",
    affected_assets: [
      { id: "ast-001", name: "Edge Gateway FW-01", asset_type: "firewall", criticality: "critical" },
    ],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "vuln-002",
    cve_id: "CVE-2023-48795",
    title: "SSH Terrapin Prefix Truncation Attack",
    description: "Prefix truncation attack against the SSH protocol enables a man-in-the-middle to drop arbitrary messages from the handshake transcript.",
    severity: "high",
    cvss: 7.5,
    recommendation: "Disable vulnerable ChaCha20-Poly1305 ciphers.",
    status: "in_progress",
    affected_assets: [
      { id: "ast-002", name: "Customer Portal Web App", asset_type: "application", criticality: "critical" },
      { id: "ast-005", name: "Core Switch SW-01", asset_type: "switch", criticality: "high" },
    ],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "vuln-003",
    cve_id: "CVE-2023-38606",
    title: "Kernel Remote Privilege Escalation",
    description: "Flaw in memory mapping allows privilege escalation to kernel space without physical access.",
    severity: "critical",
    cvss: 9.8,
    recommendation: "Upgrade Linux kernel to patched release.",
    status: "open",
    affected_assets: [
      { id: "ast-003", name: "Postgres Master DB", asset_type: "database", criticality: "critical" },
    ],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

export const MOCK_FINDINGS: Finding[] = [
  {
    id: "fnd-001",
    asset_id: "ast-002",
    title: "Public Facing Admin Console Unrestricted",
    description: "The management console for Customer Portal Web App is reachable directly over WAN with default credentials enabled.",
    finding_type: "open_rdp",
    severity: "critical",
    status: "open",
    recommendation: "Restrict management endpoints to internal VPN IP ranges.",
    mitre_tactic: "Initial Access",
    mitre_technique_id: "T1190",
    mitre_technique_name: "Exploit Public-Facing Application",
    asset: {
      id: "ast-002",
      name: "Customer Portal Web App",
      asset_type: "application",
      criticality: "critical",
    },
    created_at: "2026-02-14T11:00:00Z",
    updated_at: "2026-02-14T11:00:00Z",
  },
  {
    id: "fnd-002",
    asset_id: "ast-004",
    title: "Multi-Factor Authentication Disabled",
    description: "User workstation does not enforce hardware token or push notification for corporate login.",
    finding_type: "missing_mfa",
    severity: "high",
    status: "in_progress",
    recommendation: "Enforce conditional access policy with Duo or FIDO2 key.",
    mitre_tactic: "Credential Access",
    mitre_technique_id: "T1078",
    mitre_technique_name: "Valid Accounts",
    asset: {
      id: "ast-004",
      name: "John Doe's Workstation",
      asset_type: "laptop",
      criticality: "medium",
    },
    created_at: "2026-02-20T14:30:00Z",
    updated_at: "2026-03-01T08:00:00Z",
  },
];

export const MOCK_THREAT_INTEL: ThreatIntel[] = [
  {
    id: "thr-001",
    source: "cisa_kev",
    external_id: "CVE-2024-3400",
    title: "Palo Alto PAN-OS Command Injection",
    description: "Actively exploited in the wild against VPN firewalls.",
    severity: "critical",
    cvss: 10.0,
    kev: true,
    mitre_technique_id: "T1190",
    mitre_tactic: "Initial Access",
    capec_id: null,
    references: ["https://nvd.nist.gov/vuln/detail/CVE-2024-3400"],
    published: "2024-04-12T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "thr-002",
    source: "mitre_attack",
    external_id: "T1078",
    title: "Valid Accounts - Lateral Movement",
    description: "Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion.",
    severity: "high",
    cvss: 7.8,
    kev: false,
    mitre_technique_id: "T1078",
    mitre_tactic: "Defense Evasion",
    capec_id: "CAPEC-560",
    references: ["https://attack.mitre.org/techniques/T1078/"],
    published: "2023-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
  },
];

export const MOCK_THREAT_STATS: ThreatStats = {
  total: 2,
  by_source: {
    cisa_kev: 1,
    mitre_attack: 1,
  },
  kev_count: 1,
};

/** Mock request interceptor that supplies answers when real backend is absent */
export function handleMockRequest(config: InternalAxiosRequestConfig): AxiosResponse | null {
  const url = config.url || "";
  const method = (config.method || "get").toLowerCase();

  const makeResponse = (data: unknown, status = 200): AxiosResponse => ({
    data,
    status,
    statusText: "OK",
    headers: {},
    config,
  });

  // Auth routes
  if (url.includes("/auth/login")) {
    return makeResponse({
      access_token: "mock-jwt-token-active-session",
      token_type: "bearer",
    });
  }
  if (url.includes("/auth/me")) {
    return makeResponse(MOCK_USER);
  }

  // Dashboard
  if (url.includes("/dashboard")) {
    return makeResponse(MOCK_DASHBOARD);
  }

  // Twin routes
  if (url.includes("/twin/graph")) {
    return makeResponse(MOCK_GRAPH);
  }
  if (url.includes("/twin/relationships")) {
    if (method === "get") return makeResponse(MOCK_RELATIONSHIPS);
    if (method === "post") {
      const body = JSON.parse(config.data || "{}");
      return makeResponse({
        id: `rel-${Date.now()}`,
        source: body.source,
        source_name: MOCK_ASSETS.find((a) => a.id === body.source)?.name || "Unknown",
        source_type: MOCK_ASSETS.find((a) => a.id === body.source)?.asset_type || "server",
        target: body.target,
        target_name: MOCK_ASSETS.find((a) => a.id === body.target)?.name || "Unknown",
        target_type: MOCK_ASSETS.find((a) => a.id === body.target)?.asset_type || "server",
        type: body.type,
      }, 201);
    }
  }
  if (url.includes("/twin/relationship-rules")) {
    return makeResponse(MOCK_RELATIONSHIP_RULES);
  }
    if (url.includes("/twin/attack-paths")) {
    return makeResponse(MOCK_ATTACK_PATHS);
  }
  if (url.includes("/twin/blast-radius/")) {
    const assetId = url.split("/twin/blast-radius/")[1]?.split("?")[0];
    const srcAsset = MOCK_ASSETS.find(a => a.id === assetId) || MOCK_ASSETS[0];
    const downstream = MOCK_ASSETS.filter(a => a.id !== srcAsset.id);
    const affected = downstream.slice(0, 3).map((a, idx) => ({
      id: a.id,
      name: a.name,
      asset_type: a.asset_type,
      criticality: a.criticality,
      risk_score: a.risk?.score ?? 60,
      risk_level: a.risk?.level ?? "yellow",
      hops_away: idx + 1,
      compromise_probability: Math.max(25, 90 - (idx * 25)),
    }));
    return makeResponse({
      source_id: srcAsset.id,
      source_name: srcAsset.name,
      affected_nodes: affected,
      total_affected: affected.length,
      critical_assets_compromised: affected.filter(a => a.criticality === "critical").length,
      crown_jewel_at_risk: affected.some(a => a.criticality === "critical" || a.asset_type === "database"),
      estimated_impact_score: Math.min(100, Math.round((srcAsset.risk?.score ?? 50) * 0.4 + 55)),
      recommended_mitigation: `Compromise of ${srcAsset.name} exposes ${affected.length} connected workloads. Enforce network micro-segmentation and revoke service principal tokens immediately.`,
    });
  }

  // Assets
  if (url.includes("/assets")) {
    if (method === "get") {
      const match = url.match(/\/assets\/([^/?]+)/);
      if (match && match[1]) {
        const found = MOCK_ASSETS.find((a) => a.id === match[1]);
        return makeResponse(found || MOCK_ASSETS[0]);
      }
      return makeResponse({
        items: MOCK_ASSETS,
        total: MOCK_ASSETS.length,
        page: 1,
        page_size: 50,
      });
    }
    if (method === "post") {
      const body = JSON.parse(config.data || "{}");
      const newAsset = { ...body, id: `ast-${Date.now()}`, risk: { score: 50, level: "yellow" } };
      return makeResponse(newAsset, 201);
    }
  }

  // Vulnerabilities
  if (url.includes("/vulnerabilities")) {
    if (method === "get") {
      const match = url.match(/\/vulnerabilities\/([^/?]+)/);
      if (match && match[1]) {
        const found = MOCK_VULNERABILITIES.find((v) => v.id === match[1]);
        return makeResponse(found || MOCK_VULNERABILITIES[0]);
      }
      return makeResponse({
        items: MOCK_VULNERABILITIES,
        total: MOCK_VULNERABILITIES.length,
        page: 1,
        page_size: 50,
      });
    }
  }

  // Findings
  if (url.includes("/findings")) {
    if (method === "get") {
      return makeResponse({
        items: MOCK_FINDINGS,
        total: MOCK_FINDINGS.length,
        page: 1,
        page_size: 50,
      });
    }
  }

  // Threat Intel
  if (url.includes("/threat-intel/stats")) {
    return makeResponse(MOCK_THREAT_STATS);
  }
  if (url.includes("/threat-intel")) {
    return makeResponse({
      items: MOCK_THREAT_INTEL,
      total: MOCK_THREAT_INTEL.length,
      page: 1,
      page_size: 50,
    });
  }

  return null;
}

