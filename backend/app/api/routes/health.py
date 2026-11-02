"""Health/readiness endpoints — report API and database connectivity."""

from fastapi import APIRouter
from sqlalchemy import text

from app.db.neo4j import verify_neo4j
from app.db.postgres import engine

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    """Liveness + dependency status. Databases report 'down' gracefully
    rather than failing the endpoint."""
    postgres_ok = False
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        postgres_ok = True
    except Exception:
        pass

    return {
        "status": "ok",
        "postgres": "up" if postgres_ok else "down",
        "neo4j": "up" if await verify_neo4j() else "down",
    }
