"""Run with AUTH_TEST_DATABASE_URL pointing at a disposable PostgreSQL database."""

import asyncio
import os
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
import pytest_asyncio
from app.application.services.auth_sessions import AuthSessionService
from app.application.use_cases.auth.refresh import RefreshTokensUseCase
from app.config import settings
from app.domain.entities.auth_session import AuthSessionEntity
from app.domain.entities.manage_service import ManageUserProfile
from app.infrastructure.persistence.models.auth_session import AuthSession, RefreshToken
from app.infrastructure.repositories.auth_sessions import AuthSessionRepository
from app.infrastructure.services.token_service import TokenService
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine


@pytest_asyncio.fixture
async def database(monkeypatch):
    url = os.environ.get("AUTH_TEST_DATABASE_URL")
    if not url:
        pytest.skip(
            "AUTH_TEST_DATABASE_URL must point to a disposable PostgreSQL database"
        )
    monkeypatch.setattr(settings, "auth_dev_bypass", False)
    schema = "auth_test_" + uuid4().hex
    engine = create_async_engine(url)
    async with engine.begin() as conn:
        await conn.execute(text(f'CREATE SCHEMA "{schema}"'))
    scoped = engine.execution_options(schema_translate_map={None: schema})
    try:
        async with scoped.begin() as conn:
            await conn.run_sync(AuthSession.__table__.create)
            await conn.run_sync(RefreshToken.__table__.create)
        yield async_sessionmaker(scoped, expire_on_commit=False)
    finally:
        async with engine.begin() as conn:
            await conn.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        await engine.dispose()


@pytest.mark.asyncio
async def test_rotation_row_lock_serializes_concurrent_replay(database):
    tokens = TokenService()
    manage = SimpleNamespace(
        get_profile=AsyncMock(
            return_value=ManageUserProfile(
                91, "Test", "test@example.com", role_names=["student"]
            )
        )
    )
    async with database() as db:
        repo = AuthSessionRepository(db)
        original = await AuthSessionService(repo, tokens).create(
            91, "MANAGE", ["student"]
        )

    async def refresh():
        async with database() as db:
            repo = AuthSessionRepository(db)
            return await RefreshTokensUseCase(
                repo,
                tokens,
                AuthSessionService(repo, tokens),
                SimpleNamespace(),
                manage,
            ).execute(original.refresh_token)

    results = await asyncio.gather(refresh(), refresh())
    assert sum(result is not None for result in results) == 1
    async with database() as db:
        session = await db.scalar(select(AuthSession))
        assert session.revoked_at is not None
        stored = (await db.scalars(select(RefreshToken))).all()
        assert len(stored) == 2
        assert all(token.token_hash != original.refresh_token for token in stored)
    # Reuse detection must survive the failed request and invalidate its successor.
    successor = next(result for result in results if result is not None)
    async with database() as db:
        repo = AuthSessionRepository(db)
        assert (
            await RefreshTokensUseCase(
                repo,
                tokens,
                AuthSessionService(repo, tokens),
                SimpleNamespace(),
                manage,
            ).execute(successor.refresh_token)
            is None
        )


@pytest.mark.asyncio
async def test_rotation_failure_rolls_back_consumption(database):
    session = AuthSessionEntity(
        uuid4(), 91, "MANAGE", datetime.now(UTC) + timedelta(days=1)
    )
    async with database() as db:
        repo = AuthSessionRepository(db)
        await repo.add(session, "old-hash")
        await repo.commit()
    async with database() as db:
        repo = AuthSessionRepository(db)
        await repo.lock_by_token("old-hash")
        with pytest.raises(IntegrityError):
            await repo.rotate("old-hash", "old-hash", datetime.now(UTC))
        await db.rollback()
    async with database() as db:
        assert (await db.get(RefreshToken, "old-hash")).used_at is None


@pytest.mark.asyncio
async def test_migration_upgrade_and_downgrade(database):
    # Exercise the actual Alembic revision on its own temporary schema.
    from importlib.util import module_from_spec, spec_from_file_location
    from pathlib import Path

    from alembic.migration import MigrationContext
    from alembic.operations import Operations

    path = (
        Path(__file__).parents[1]
        / "alembic/versions/a91e7b3c2d60_add_auth_refresh_sessions.py"
    )
    spec = spec_from_file_location("auth_session_migration", path)
    migration = module_from_spec(spec)
    spec.loader.exec_module(migration)
    async with database() as db:
        conn = await db.connection()

        def check(sync_conn):
            # The fixture already created both tables; remove, recreate, remove.
            with Operations.context(MigrationContext.configure(sync_conn)):
                migration.downgrade()
                migration.upgrade()
                migration.downgrade()

        await conn.run_sync(check)
        await db.commit()
