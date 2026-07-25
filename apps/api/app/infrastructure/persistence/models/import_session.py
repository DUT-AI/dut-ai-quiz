from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.import_session import ImportSessionEntity

from .base import Base


class ImportSession(Base):
    __tablename__ = "import_sessions"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    user_id: Mapped[int] = mapped_column(index=True)
    file_name: Mapped[str] = mapped_column(default="")
    total_questions: Mapped[int] = mapped_column(default=0)
    processed_questions: Mapped[int] = mapped_column(default=0)
    status: Mapped[str] = mapped_column(default="PROCESSING")
    error_message: Mapped[str | None] = mapped_column(nullable=True)
    lesson_id: Mapped[UUID | None] = mapped_column(
        pgUUID(as_uuid=True), nullable=True
    )
    target_scope: Mapped[str] = mapped_column(default="LESSON")
    created_at: Mapped[datetime] = mapped_column(default=now_ict)

    def to_entity(self) -> ImportSessionEntity:
        return ImportSessionEntity(
            id=self.id,
            user_id=self.user_id,
            file_name=self.file_name,
            status=self.status,
            total_questions=self.total_questions,
            processed_questions=self.processed_questions,
            error_message=self.error_message,
            created_at=self.created_at,
            lesson_id=self.lesson_id,
            target_scope=self.target_scope,
        )

    @classmethod
    def from_entity(cls, entity: ImportSessionEntity) -> "ImportSession":
        return cls(
            id=entity.id,
            user_id=entity.user_id,
            file_name=entity.file_name,
            status=entity.status,
            total_questions=entity.total_questions,
            processed_questions=entity.processed_questions,
            error_message=entity.error_message,
            created_at=entity.created_at,
            lesson_id=entity.lesson_id,
            target_scope=entity.target_scope,
        )
