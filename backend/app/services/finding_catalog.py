"""Catalog of security finding templates.

Each finding type maps to a default severity, description, remediation
recommendation, and MITRE ATT&CK technique. Used both to pre-fill the
create form and to auto-generate findings from asset risk factors.
"""

from dataclasses import dataclass

from app.models.finding import FindingType
from app.models.vulnerability import Severity


@dataclass(frozen=True)
class FindingTemplate:
    title: str
    severity: Severity
    description: str
    recommendation: str
    mitre_tactic: str
    mitre_technique_id: str
    mitre_technique_name: str


CATALOG: dict[FindingType, FindingTemplate] = {
    FindingType.weak_password: FindingTemplate(
        title="Weak or Default Password",
        severity=Severity.high,
        description="The asset uses a weak, guessable, or default password, making it susceptible to brute-force and credential-stuffing attacks.",
        recommendation="Enforce a strong password policy, rotate the affected credentials, and adopt a password manager or vault.",
        mitre_tactic="Credential Access",
        mitre_technique_id="T1110",
        mitre_technique_name="Brute Force",
    ),
    FindingType.missing_mfa: FindingTemplate(
        title="Multi-Factor Authentication Not Enforced",
        severity=Severity.high,
        description="Access to the asset is not protected by multi-factor authentication, allowing a single stolen credential to grant access.",
        recommendation="Enforce MFA for all interactive and administrative access, preferring phishing-resistant methods (FIDO2/WebAuthn).",
        mitre_tactic="Initial Access",
        mitre_technique_id="T1078",
        mitre_technique_name="Valid Accounts",
    ),
    FindingType.open_rdp: FindingTemplate(
        title="Exposed Remote Desktop (RDP)",
        severity=Severity.critical,
        description="Remote Desktop Protocol is reachable from an untrusted network, a common entry point for ransomware and account takeover.",
        recommendation="Restrict RDP to a VPN or bastion host, enforce network-level authentication, and monitor for brute-force attempts.",
        mitre_tactic="Lateral Movement",
        mitre_technique_id="T1021.001",
        mitre_technique_name="Remote Services: Remote Desktop Protocol",
    ),
    FindingType.open_ssh: FindingTemplate(
        title="Exposed SSH Service",
        severity=Severity.high,
        description="SSH is reachable from an untrusted network, exposing the asset to brute-force and key-compromise attacks.",
        recommendation="Limit SSH exposure via firewall/VPN, disable password auth in favor of keys, and enforce MFA where possible.",
        mitre_tactic="Lateral Movement",
        mitre_technique_id="T1021.004",
        mitre_technique_name="Remote Services: SSH",
    ),
    FindingType.critical_cve: FindingTemplate(
        title="Critical CVE Present",
        severity=Severity.critical,
        description="A critical, potentially exploitable vulnerability is present on the asset and may allow remote compromise.",
        recommendation="Prioritize patching or mitigating the affected component; isolate the asset until remediated.",
        mitre_tactic="Initial Access",
        mitre_technique_id="T1190",
        mitre_technique_name="Exploit Public-Facing Application",
    ),
    FindingType.exposed_database: FindingTemplate(
        title="Publicly Exposed Database",
        severity=Severity.critical,
        description="A database service is reachable from the public internet, risking data exfiltration and unauthorized modification.",
        recommendation="Remove public exposure, place the database behind a private subnet, and require authenticated, encrypted connections.",
        mitre_tactic="Initial Access",
        mitre_technique_id="T1190",
        mitre_technique_name="Exploit Public-Facing Application",
    ),
    FindingType.privilege_escalation: FindingTemplate(
        title="Privilege Escalation Risk",
        severity=Severity.high,
        description="A misconfiguration or vulnerable component may allow an attacker to escalate to higher privileges on the asset.",
        recommendation="Apply least-privilege, remediate the misconfiguration, and patch known privilege-escalation vectors.",
        mitre_tactic="Privilege Escalation",
        mitre_technique_id="T1068",
        mitre_technique_name="Exploitation for Privilege Escalation",
    ),
    FindingType.lateral_movement_risk: FindingTemplate(
        title="Lateral Movement Risk",
        severity=Severity.high,
        description="The asset's exposure and connectivity could let an attacker pivot to other systems within the environment.",
        recommendation="Segment the network, restrict east-west traffic, and monitor for anomalous remote-service usage.",
        mitre_tactic="Lateral Movement",
        mitre_technique_id="T1210",
        mitre_technique_name="Exploitation of Remote Services",
    ),
}
