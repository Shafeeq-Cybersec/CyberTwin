"""Neo4j async driver lifecycle management.

The digital twin graph lives in Neo4j. This module owns a single shared
async driver, opened at app startup and closed at shutdown.
"""

from neo4j import AsyncDriver, AsyncGraphDatabase

from app.core.config import settings

_driver: AsyncDriver | None = None


async def connect_neo4j() -> None:
    """Open the shared driver (called from the app lifespan)."""
    global _driver
    _driver = AsyncGraphDatabase.driver(
        settings.NEO4J_URI,
        auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
    )


async def close_neo4j() -> None:
    """Close the shared driver on shutdown."""
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None


def get_neo4j() -> AsyncDriver:
    """FastAPI dependency returning the shared driver."""
    if _driver is None:
        raise RuntimeError("Neo4j driver not initialised — check app lifespan")
    return _driver


async def verify_neo4j() -> bool:
    """Lightweight connectivity check used by the health endpoint."""
    if _driver is None:
        return False
    try:
        await _driver.verify_connectivity()
        return True
    except Exception:
        return False
