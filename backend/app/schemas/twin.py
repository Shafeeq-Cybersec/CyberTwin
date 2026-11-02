"""Schemas for the Digital Twin graph (nodes + relationships)."""

import enum
import uuid

from pydantic import BaseModel, Field

from app.models.asset import AssetStatus, AssetType, Criticality
from app.schemas.risk import RiskLevel


class RelationshipType(str, enum.Enum):
    """Supported edge types between assets in the twin graph."""

    USES = "USES"
    RUNS_ON = "RUNS_ON"
    CONNECTS_TO = "CONNECTS_TO"
    STORES = "STORES"
    PROTECTS = "PROTECTS"
    MEMBER_OF = "MEMBER_OF"


class GraphNode(BaseModel):
    """A twin node — an asset projected into the graph."""

    id: uuid.UUID
    name: str
    asset_type: AssetType
    criticality: Criticality
    status: AssetStatus
    hostname: str | None = None
    ip_address: str | None = None
    risk_score: int
    risk_level: RiskLevel


class GraphEdge(BaseModel):
    """A directed relationship between two assets."""

    id: str  # Neo4j-generated relationship element id
    source: uuid.UUID
    target: uuid.UUID
    type: RelationshipType


class Graph(BaseModel):
    """Full graph payload consumed by the frontend."""

    nodes: list[GraphNode]
    edges: list[GraphEdge]


class RelationshipCreate(BaseModel):
    """Payload to create an edge between two assets."""

    source: uuid.UUID
    target: uuid.UUID
    type: RelationshipType = Field(..., description="One of the supported relationship types")


class RelationshipUpdate(BaseModel):
    """Payload to update an existing edge (type and/or endpoints)."""

    source: uuid.UUID
    target: uuid.UUID
    type: RelationshipType


class RelationshipView(BaseModel):
    """Relationship enriched with asset names for the relationship viewer."""

    id: str
    source: uuid.UUID
    source_name: str
    source_type: AssetType
    target: uuid.UUID
    target_name: str
    target_type: AssetType
    type: RelationshipType


# --- Attack Path Analysis ---


class AttackPathNode(BaseModel):
    """A node along an attack path, enriched with risk."""

    id: uuid.UUID
    name: str
    asset_type: AssetType
    risk_score: int
    risk_level: RiskLevel


class AttackStep(BaseModel):
    """A single hop in an attack path, with a plain-language explanation."""

    from_id: uuid.UUID
    from_name: str
    to_id: uuid.UUID
    to_name: str
    relationship: RelationshipType
    explanation: str
    step_probability: int  # 0–100 likelihood of compromising the 'to' asset


class AttackPath(BaseModel):
    """A scored, explained attack path from an entry point to a target."""

    id: str
    nodes: list[AttackPathNode]
    steps: list[AttackStep]
    probability: int          # 0–100 overall likelihood of the full chain
    length: int               # number of hops
    entry_name: str
    target_name: str
    weakest_link_id: uuid.UUID
    weakest_link_name: str
    weakest_link_score: int


class AttackPathResponse(BaseModel):
    paths: list[AttackPath]
