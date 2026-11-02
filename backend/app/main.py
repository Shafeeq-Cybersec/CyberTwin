"""CyberTwin API entry point.

Run locally with:
    uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db.neo4j import close_neo4j, connect_neo4j
from app.db.postgres import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Open/close shared database resources with the app lifecycle.
    Failures are logged, not fatal — the API stays up so /health can
    report which dependency is down."""
    try:
        await init_db()
    except Exception as exc:  # pragma: no cover
        print(f"[startup] PostgreSQL unavailable: {exc}")
    try:
        await connect_neo4j()
    except Exception as exc:  # pragma: no cover
        print(f"[startup] Neo4j unavailable: {exc}")
    yield
    await close_neo4j()


app = FastAPI(
    title=f"{settings.APP_NAME} API",
    version="0.1.0",
    lifespan=lifespan,
)

# Allow the Vite dev server to call the API directly if not using the proxy
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
