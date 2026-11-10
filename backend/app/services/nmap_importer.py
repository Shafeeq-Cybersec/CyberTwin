"""Nmap / Network Scanner XML & JSON Ingestion Parser.

Parses network scanner results to automatically discover live hosts, open ports,
detected OS footprints, and infer initial asset roles for the Cyber Twin platform.
"""

import xml.etree.ElementTree as ET
from typing import Any


def parse_nmap_xml(xml_content: str) -> list[dict[str, Any]]:
    """Parse Nmap -oX output and return structured asset payloads."""
    root = ET.fromstring(xml_content)
    discovered_assets: list[dict[str, Any]] = []

    for host in root.findall("host"):
        # Check host status (up/down)
        status = host.find("status")
        if status is not None and status.get("state") != "up":
            continue

        ip_addr = None
        hostname = None

        # Extract IP addresses
        for addr in host.findall("address"):
            if addr.get("addrtype") in ("ipv4", "ipv6"):
                ip_addr = addr.get("addr")
                break

        # Extract hostnames
        hostnames = host.find("hostnames")
        if hostnames is not None:
            hn = hostnames.find("hostname")
            if hn is not None:
                hostname = hn.get("name")

        # Open ports
        open_ports = []
        ports_elem = host.find("ports")
        if ports_elem is not None:
            for p in ports_elem.findall("port"):
                st = p.find("state")
                if st is not None and st.get("state") == "open":
                    port_id = p.get("portid")
                    service = p.find("service")
                    svc_name = service.get("name") if service is not None else "unknown"
                    open_ports.append({"port": int(port_id), "service": svc_name})

        # OS detection
        os_match = None
        os_elem = host.find("os")
        if os_elem is not None:
            match = os_elem.find("osmatch")
            if match is not None:
                os_match = match.get("name")

        # Infer asset type
        inferred_type = "server"
        ports_list = [p["port"] for p in open_ports]
        if 80 in ports_list or 443 in ports_list:
            inferred_type = "application"
        elif 5432 in ports_list or 3306 in ports_list or 1433 in ports_list:
            inferred_type = "database"
        elif 3389 in ports_list or 22 in ports_list:
            inferred_type = "server"

        discovered_assets.append({
            "name": hostname or f"Host-{ip_addr or 'Discovered'}",
            "hostname": hostname,
            "ip_address": ip_addr,
            "asset_type": inferred_type,
            "operating_system": os_match or "Linux/Unix Generic",
            "open_ports": len(open_ports),
            "ports_detail": open_ports,
            "internet_exposed": any(p["port"] in (80, 443, 8080) for p in open_ports),
        })

    return discovered_assets
