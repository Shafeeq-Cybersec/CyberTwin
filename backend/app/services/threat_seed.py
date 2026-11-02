"""Curated threat-feed snapshots used by the import connectors.

In production each connector would fetch live from its source API (NVD 2.0,
the CISA KEV JSON catalog, the MITRE ATT&CK/CAPEC STIX bundles). To keep the
module deterministic and usable offline, the connectors return these curated
snapshots of real, well-known entries. `threat_intel_service.fetch_source`
is the single seam where a live HTTP fetch would replace these lists.
"""

from app.models.threat_intel import ThreatSource
from app.models.vulnerability import Severity

# --- CVE / NVD ---
CVE_FEED = [
    {
        "external_id": "CVE-2021-44228",
        "title": "Apache Log4j2 Remote Code Execution (Log4Shell)",
        "description": "JNDI features in Log4j2 allow attacker-controlled LDAP lookups leading to remote code execution.",
        "severity": Severity.critical, "cvss": 10.0, "kev": True,
        "mitre_technique_id": "T1190", "mitre_tactic": "Initial Access",
        "references": ["https://nvd.nist.gov/vuln/detail/CVE-2021-44228"], "published": "2021-12-10",
    },
    {
        "external_id": "CVE-2020-1472",
        "title": "Netlogon Elevation of Privilege (Zerologon)",
        "description": "A flaw in the Netlogon protocol allows an attacker to impersonate any domain controller.",
        "severity": Severity.critical, "cvss": 10.0, "kev": True,
        "mitre_technique_id": "T1068", "mitre_tactic": "Privilege Escalation",
        "references": ["https://nvd.nist.gov/vuln/detail/CVE-2020-1472"], "published": "2020-08-17",
    },
    {
        "external_id": "CVE-2019-0708",
        "title": "Remote Desktop Services RCE (BlueKeep)",
        "description": "A pre-authentication RCE vulnerability in Windows Remote Desktop Services.",
        "severity": Severity.critical, "cvss": 9.8, "kev": True,
        "mitre_technique_id": "T1210", "mitre_tactic": "Lateral Movement",
        "references": ["https://nvd.nist.gov/vuln/detail/CVE-2019-0708"], "published": "2019-05-14",
    },
    {
        "external_id": "CVE-2017-0144",
        "title": "SMBv1 Remote Code Execution (EternalBlue)",
        "description": "A vulnerability in Microsoft SMBv1 allowing remote code execution, used by WannaCry.",
        "severity": Severity.high, "cvss": 8.1, "kev": True,
        "mitre_technique_id": "T1210", "mitre_tactic": "Lateral Movement",
        "references": ["https://nvd.nist.gov/vuln/detail/CVE-2017-0144"], "published": "2017-03-14",
    },
    {
        "external_id": "CVE-2014-0160",
        "title": "OpenSSL Heartbeat Information Disclosure (Heartbleed)",
        "description": "A buffer over-read in OpenSSL's TLS heartbeat extension exposes memory contents.",
        "severity": Severity.high, "cvss": 7.5, "kev": False,
        "mitre_technique_id": "T1190", "mitre_tactic": "Initial Access",
        "references": ["https://nvd.nist.gov/vuln/detail/CVE-2014-0160"], "published": "2014-04-07",
    },
]

# --- CISA KEV (subset that overlaps the CVE feed above) ---
KEV_FEED = [
    {
        "external_id": "CVE-2021-44228",
        "title": "Log4Shell — Known Exploited",
        "description": "Listed in the CISA Known Exploited Vulnerabilities catalog; active exploitation observed.",
        "severity": Severity.critical, "cvss": 10.0, "kev": True,
        "mitre_technique_id": "T1190", "mitre_tactic": "Initial Access",
        "references": ["https://www.cisa.gov/known-exploited-vulnerabilities-catalog"], "published": "2021-12-10",
    },
    {
        "external_id": "CVE-2020-1472",
        "title": "Zerologon — Known Exploited",
        "description": "Listed in the CISA KEV catalog; exploited to compromise Active Directory domains.",
        "severity": Severity.critical, "cvss": 10.0, "kev": True,
        "mitre_technique_id": "T1068", "mitre_tactic": "Privilege Escalation",
        "references": ["https://www.cisa.gov/known-exploited-vulnerabilities-catalog"], "published": "2020-08-17",
    },
    {
        "external_id": "CVE-2019-0708",
        "title": "BlueKeep — Known Exploited",
        "description": "Listed in the CISA KEV catalog; wormable RDP vulnerability.",
        "severity": Severity.critical, "cvss": 9.8, "kev": True,
        "mitre_technique_id": "T1210", "mitre_tactic": "Lateral Movement",
        "references": ["https://www.cisa.gov/known-exploited-vulnerabilities-catalog"], "published": "2019-05-14",
    },
]

# --- MITRE ATT&CK techniques ---
ATTACK_FEED = [
    {"external_id": "T1190", "title": "Exploit Public-Facing Application",
     "description": "Adversaries exploit a weakness in an internet-facing host or system.",
     "mitre_technique_id": "T1190", "mitre_tactic": "Initial Access",
     "references": ["https://attack.mitre.org/techniques/T1190/"]},
    {"external_id": "T1110", "title": "Brute Force",
     "description": "Adversaries systematically guess credentials to gain access.",
     "mitre_technique_id": "T1110", "mitre_tactic": "Credential Access",
     "references": ["https://attack.mitre.org/techniques/T1110/"]},
    {"external_id": "T1021.001", "title": "Remote Services: Remote Desktop Protocol",
     "description": "Adversaries use RDP to move laterally within a network.",
     "mitre_technique_id": "T1021.001", "mitre_tactic": "Lateral Movement",
     "references": ["https://attack.mitre.org/techniques/T1021/001/"]},
    {"external_id": "T1068", "title": "Exploitation for Privilege Escalation",
     "description": "Adversaries exploit software vulnerabilities to elevate privileges.",
     "mitre_technique_id": "T1068", "mitre_tactic": "Privilege Escalation",
     "references": ["https://attack.mitre.org/techniques/T1068/"]},
    {"external_id": "T1210", "title": "Exploitation of Remote Services",
     "description": "Adversaries exploit remote services to move laterally.",
     "mitre_technique_id": "T1210", "mitre_tactic": "Lateral Movement",
     "references": ["https://attack.mitre.org/techniques/T1210/"]},
]

# --- CAPEC attack patterns ---
CAPEC_FEED = [
    {"external_id": "CAPEC-66", "title": "SQL Injection",
     "description": "Injecting SQL through unsanitized input to manipulate a database.",
     "capec_id": "CAPEC-66", "mitre_technique_id": "T1190",
     "references": ["https://capec.mitre.org/data/definitions/66.html"]},
    {"external_id": "CAPEC-112", "title": "Brute Force",
     "description": "Exhaustively trying credential combinations to gain access.",
     "capec_id": "CAPEC-112", "mitre_technique_id": "T1110",
     "references": ["https://capec.mitre.org/data/definitions/112.html"]},
    {"external_id": "CAPEC-98", "title": "Phishing",
     "description": "Deceiving a user into revealing credentials or executing code.",
     "capec_id": "CAPEC-98",
     "references": ["https://capec.mitre.org/data/definitions/98.html"]},
    {"external_id": "CAPEC-233", "title": "Privilege Escalation",
     "description": "Gaining elevated access beyond what was originally granted.",
     "capec_id": "CAPEC-233", "mitre_technique_id": "T1068",
     "references": ["https://capec.mitre.org/data/definitions/233.html"]},
]

FEEDS: dict[ThreatSource, list[dict]] = {
    ThreatSource.cve: CVE_FEED,
    ThreatSource.cisa_kev: KEV_FEED,
    ThreatSource.mitre_attack: ATTACK_FEED,
    ThreatSource.capec: CAPEC_FEED,
}
