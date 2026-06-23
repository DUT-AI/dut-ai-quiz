from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.datetime_utils import now_ict
from app.domain.entities.user import UserEntity

from .base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    name: Mapped[str | None] = mapped_column(nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(nullable=True)
    role: Mapped[str] = mapped_column(default="student", server_default="student")
    google_id: Mapped[str] = mapped_column(index=True)
    created_at: Mapped[datetime] = mapped_column(default=now_ict)

    def to_entity(self) -> UserEntity:
        return UserEntity(
            id=self.id,
            email=self.email,
            name=self.name,
            avatar_url=self.avatar_url,
            role=self.role,
            google_id=self.google_id,
            created_at=self.created_at,
        )

    @classmethod
    def from_entity(cls, entity: UserEntity) -> "User":
        return cls(
            id=entity.id,
            email=entity.email,
            name=entity.name,
            avatar_url=entity.avatar_url,
            role=entity.role,
            google_id=entity.google_id,
            created_at=entity.created_at or now_ict(),
        )
