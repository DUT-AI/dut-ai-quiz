from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.module import ModuleEntity

from .base import Base


class Module(Base):
    """SQLAlchemy model representing a learning module in the database."""

    __tablename__ = "modules"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column()
    description: Mapped[str] = mapped_column(default="", server_default="")
    order: Mapped[int] = mapped_column(default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(default=now_ict)

    def to_entity(self) -> ModuleEntity:
        """Convert database model to domain entity."""
        return ModuleEntity(
            id=self.id,
            name=self.name,
            description=self.description,
            order=self.order,
            created_at=self.created_at,
        )

    @classmethod
    def from_entity(cls, entity: ModuleEntity) -> "Module":
        """Create database model from domain entity."""
        return cls(
            id=entity.id,
            name=entity.name,
            description=entity.description,
            order=entity.order,
            created_at=entity.created_at,
        )
