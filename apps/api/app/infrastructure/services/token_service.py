import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Any

import jwt
from app.config import settings


class TokenService:
    @property
    def access_lifetime(self) -> timedelta:
        return timedelta(minutes=settings.jwt_expire_minutes)

    @property
    def refresh_lifetime(self) -> timedelta:
        return timedelta(days=settings.jwt_refresh_expire_days)

    def create_access(self, claims: dict[str, Any], expires_at: datetime) -> str:
        return jwt.encode(
            {**claims, "token_use": "access", "exp": expires_at},
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )

    def create_refresh(self) -> str:
        return secrets.token_urlsafe(48)

    def hash_refresh(self, token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()
