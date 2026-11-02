"""Relationship validation rules for the twin graph.

Defines which asset types may participate as the source and target of each
relationship type. Keeps the graph semantically meaningful (e.g. only a
Firewall can PROTECT things, an Application RUNS_ON a Server, etc.).

The matrix is intentionally permissive where several asset types make sense;
tighten it here as the model matures.
"""

from app.models.asset import AssetType
from app.schemas.twin import RelationshipType

# Shorthand groups
_ALL = set(AssetType)
_COMPUTE = {AssetType.server, AssetType.cloud_instance, AssetType.desktop, AssetType.laptop}
_NETWORK = {AssetType.router, AssetType.switch, AssetType.firewall}
_HOSTS = {AssetType.server, AssetType.cloud_instance, AssetType.desktop, AssetType.laptop}

# Allowed (source types, target types) per relationship type.
RELATIONSHIP_RULES: dict[RelationshipType, tuple[set[AssetType], set[AssetType]]] = {
    # User → Uses → Application (also apps using other services)
    RelationshipType.USES: (
        {AssetType.user, AssetType.application},
        {AssetType.application, AssetType.database, AssetType.server, AssetType.cloud_instance},
    ),
    # Application → Runs On → Server / Cloud / Endpoint
    RelationshipType.RUNS_ON: (
        {AssetType.application, AssetType.database},
        _HOSTS,
    ),
    # Network-capable device → Connects To → another such device
    RelationshipType.CONNECTS_TO: (
        _COMPUTE | _NETWORK,
        _COMPUTE | _NETWORK,
    ),
    # Server / App / Cloud → Stores → Database
    RelationshipType.STORES: (
        {AssetType.server, AssetType.application, AssetType.cloud_instance, AssetType.database},
        {AssetType.database},
    ),
    # Firewall → Protects → most things it can sit in front of
    RelationshipType.PROTECTS: (
        {AssetType.firewall},
        _COMPUTE | _NETWORK | {AssetType.application, AssetType.database},
    ),
    # Membership / grouping — kept broad (e.g. User → Member Of → User/Application)
    RelationshipType.MEMBER_OF: (
        _ALL,
        _ALL,
    ),
}


def validate_relationship(
    rel_type: RelationshipType, source_type: AssetType, target_type: AssetType
) -> str | None:
    """Return an error message if the relationship is invalid, else None."""
    sources, targets = RELATIONSHIP_RULES[rel_type]
    if source_type not in sources:
        allowed = ", ".join(sorted(t.value for t in sources))
        return f"A '{source_type.value}' cannot be the source of {rel_type.value}. Allowed sources: {allowed}."
    if target_type not in targets:
        allowed = ", ".join(sorted(t.value for t in targets))
        return f"A '{target_type.value}' cannot be the target of {rel_type.value}. Allowed targets: {allowed}."
    return None
