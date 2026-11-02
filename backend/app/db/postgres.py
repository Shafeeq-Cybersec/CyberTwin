"""Async PostgreSQL connection via SQLAlchemy 2.0.

Exposes `get_db` as a FastAPI dependency yielding an AsyncSession.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Engine is created lazily at import; connections open on first use
engine = create_async_engine(settings.postgres_dsn, echo=False, pool_pre_ping=True)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Declarative base — all ORM models inherit from this."""


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yields a session and guarantees cleanup."""
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    """Create tables for all registered models (dev convenience; use
    Alembic migrations in later phases)."""
    from app.models import (  # noqa: F401 — register models with Base
        asset,
        finding,
        threat_intel,
        user,
        vulnerability,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
