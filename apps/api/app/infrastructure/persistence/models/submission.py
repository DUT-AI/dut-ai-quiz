from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import Enum as SAEnum, ForeignKey, Float, String, Text
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.submission import HackathonSubmissionEntity
from app.domain.value_objects.enums import SubmissionStatus
from .base import Base


class HackathonSubmission(Base):
    __tablename__ = "hackathon_submissions"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    task_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("hackathon_tasks.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    user_id: Mapped[int | None] = mapped_column(index=True, nullable=True)
    team_id: Mapped[UUID | None] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("hackathon_teams.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    runtime_profile_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("runtime_profiles.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    script_s3_key: Mapped[str] = mapped_column(String(500), nullable=False)
    model_s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[SubmissionStatus] = mapped_column(
        SAEnum(
            SubmissionStatus,
            name="submission_status_enum",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=SubmissionStatus.PENDING,
        server_default="PENDING",
        index=True,
    )
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    execution_log: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(nullable=False, index=True)
    started_at: Mapped[datetime | None] = mapped_column(nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    def to_entity(self) -> HackathonSubmissionEntity:
        return HackathonSubmissionEntity(
            id=self.id,
            task_id=self.task_id,
            user_id=self.user_id,
            team_id=self.team_id,
            runtime_profile_id=self.runtime_profile_id,
            script_s3_key=self.script_s3_key,
            model_s3_key=self.model_s3_key,
            status=self.status,
            score=self.score,
            execution_log=self.execution_log,
            error_message=self.error_message,
            submitted_at=self.submitted_at,
            started_at=self.started_at,
            completed_at=self.completed_at,
        )

    @classmethod
    def from_entity(cls, entity: HackathonSubmissionEntity) -> "HackathonSubmission":
        return cls(
            id=entity.id,
            task_id=entity.task_id,
            user_id=entity.user_id,
            team_id=entity.team_id,
            runtime_profile_id=entity.runtime_profile_id,
            script_s3_key=entity.script_s3_key,
            model_s3_key=entity.model_s3_key,
            status=entity.status,
            score=entity.score,
            execution_log=entity.execution_log,
            error_message=entity.error_message,
            submitted_at=entity.submitted_at,
            started_at=entity.started_at,
            completed_at=entity.completed_at,
        )
