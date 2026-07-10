from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.tag import TagEntity
from .base import Base


class Tag(Base):
    """SQLAlchemy model representing a tag in the database."""

    __tablename__ = "tags"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(default=now_ict)

    def to_entity(self) -> TagEntity:
        """Convert database model to domain entity."""
        return TagEntity(
            id=self.id,
            name=self.name,
            created_at=self.created_at,
        )

    @classmethod
    def from_entity(cls, entity: TagEntity) -> "Tag":
        """Create database model from domain entity."""
        return cls(
            id=entity.id,
            name=entity.name,
            created_at=entity.created_at,
        )
