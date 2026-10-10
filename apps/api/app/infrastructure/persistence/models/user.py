from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.datetime_utils import now_ict
from app.domain.entities.user import UserEntity, UserSource

from .auth_rbac import user_roles
from .base import Base

if TYPE_CHECKING:
    from .auth_rbac import Role


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    name: Mapped[str | None] = mapped_column(nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(nullable=True)
    role: Mapped[str] = mapped_column(default="guest", server_default="guest")
    google_id: Mapped[str] = mapped_column(index=True)
    user_source: Mapped[str] = mapped_column(
        String(30),
        default=UserSource.INTERNAL.value,
        server_default=UserSource.INTERNAL.value,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(default=now_ict)

    roles: Mapped[list["Role"]] = relationship(
        secondary=user_roles,
        back_populates="users",
        lazy="selectin",
    )

    def to_entity(self) -> UserEntity:
        role_names = (
            [r.name for r in self.roles] if self.roles else ([self.role] if self.role else [])
        )
        try:
            source_enum = UserSource(self.user_source)
        except (ValueError, TypeError):
            source_enum = UserSource.INTERNAL

        return UserEntity(
            id=self.id,
            email=self.email,
            name=self.name,
            avatar_url=self.avatar_url,
            role=self.role,
            google_id=self.google_id,
            user_source=source_enum,
            created_at=self.created_at,
            roles=role_names,
        )

    @classmethod
    def from_entity(cls, entity: UserEntity) -> "User":
        source_val = (
            entity.user_source.value
            if isinstance(entity.user_source, UserSource)
            else str(entity.user_source)
        )
        return cls(
            id=entity.id,
            email=entity.email,
            name=entity.name,
            avatar_url=entity.avatar_url,
            role=entity.role,
            google_id=entity.google_id,
            user_source=source_val,
            created_at=entity.created_at or now_ict(),
        )
