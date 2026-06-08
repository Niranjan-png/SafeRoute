"""
Test fixtures and configuration for SafeRoute Bengaluru tests.

Sets up an async test database, test client, and common fixtures.
"""

import asyncio
import uuid
from datetime import datetime

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.base import Base

# Test database URL — uses the same DB with a test schema
TEST_DATABASE_URL = settings.database_url


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def setup_database(test_engine):
    """Create all tables before tests and drop after."""
    async with test_engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session(test_engine, setup_database):
    """Yield a test database session with automatic rollback."""
    async_session = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(setup_database):
    """Yield an async HTTP test client."""
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def sample_coordinates():
    """Sample Bengaluru coordinates for testing."""
    return {
        "koramangala": {"lat": 12.9352, "lng": 77.6245},
        "indiranagar": {"lat": 12.9784, "lng": 77.6408},
        "mg_road": {"lat": 12.9563, "lng": 77.6013},
        "whitefield": {"lat": 12.9698, "lng": 77.7500},
        "majestic": {"lat": 12.9716, "lng": 77.5946},
    }
