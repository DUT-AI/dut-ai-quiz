import uuid
from datetime import datetime
from sqlalchemy import text
import sqlalchemy
from sqlmodel import Field, SQLModel
from app.domain.entities.import_session import ImportSessionEntity, ImportSessionStatus


class ImportSessionModel(SQLModel, table=True):
    __tablename__ = "import_sessions"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        sa_column_kwargs={"server_default": text("gen_random_uuid()")}
    )
    user_id: int = Field(index=True)
    target_scope: str | None = Field(default=None)
    status: ImportSessionStatus = Field(
        default=ImportSessionStatus.PROCESSING,
        sa_type=sqlalchemy.String(50)
    )
    error_message: str | None = Field(default=None)
    file_name: str | None = Field(default=None)
    total_questions: int | None = Field(default=0)
    processed_questions: int | None = Field(default=0)
    lesson_id: uuid.UUID | None = Field(default=None, sa_column_kwargs={"index": True})
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": text("TIMEZONE('utc', CURRENT_TIMESTAMP)")}
    )
    updated_at: datetime | None = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={
            "server_default": text("TIMEZONE('utc', CURRENT_TIMESTAMP)"),
            "onupdate": text("TIMEZONE('utc', CURRENT_TIMESTAMP)")
        }
    )

    def to_entity(self) -> ImportSessionEntity:
        return ImportSessionEntity(
            id=self.id,
            user_id=self.user_id,
            target_scope=self.target_scope,
            status=self.status,
            error_message=self.error_message,
            created_at=self.created_at,
            updated_at=self.updated_at,
            file_name=self.file_name,
            total_questions=self.total_questions,
            processed_questions=self.processed_questions,
            lesson_id=self.lesson_id,
        )

    @classmethod
    def from_entity(cls, entity: ImportSessionEntity) -> "ImportSessionModel":
        return cls(
            id=entity.id,
            user_id=entity.user_id,
            target_scope=entity.target_scope,
            status=entity.status,
            error_message=entity.error_message,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            file_name=entity.file_name,
            total_questions=entity.total_questions,
            processed_questions=entity.processed_questions,
            lesson_id=entity.lesson_id,
        )
