from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.homework import (
    HomeworkEntity,
    HomeworkSubmissionEntity,
    HomeworkSubmissionStatus,
)

from .base import Base


class Homework(Base):
    __tablename__ = "homeworks"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    lesson_id: Mapped[UUID | None] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text, default="", server_default="")
    deadline: Mapped[datetime] = mapped_column(index=True)
    attachment_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(index=True)
    created_at: Mapped[datetime] = mapped_column(default=now_ict)
    updated_at: Mapped[datetime] = mapped_column(default=now_ict, onupdate=now_ict)
    archived_at: Mapped[datetime | None] = mapped_column(nullable=True, index=True)
    grading_rubric: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    grading_status: Mapped[str] = mapped_column(
        String(30), default="PENDING", server_default="PENDING", index=True
    )
    grading_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    def to_entity(self) -> HomeworkEntity:
        return HomeworkEntity(
            id=self.id,
            lesson_id=self.lesson_id,
            title=self.title,
            description=self.description,
            deadline=self.deadline,
            attachment_key=self.attachment_key,
            created_by=self.created_by,
            created_at=self.created_at,
            updated_at=self.updated_at,
            archived_at=self.archived_at,
        )


class HomeworkSubmission(Base):
    __tablename__ = "homework_submissions"
    __table_args__ = (
        UniqueConstraint(
            "homework_id",
            "user_id",
            "attempt_number",
            name="uq_homework_submission_attempt",
        ),
        Index(
            "ix_homework_submissions_latest",
            "homework_id",
            "user_id",
            "attempt_number",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    homework_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("homeworks.id", ondelete="CASCADE"),
        index=True,
    )
    user_id: Mapped[int] = mapped_column(index=True)
    object_key: Mapped[str] = mapped_column(Text)
    original_filename: Mapped[str] = mapped_column(String(255))
    submitted_at: Mapped[datetime] = mapped_column(default=now_ict, index=True)
    is_late: Mapped[bool] = mapped_column(default=False, server_default="false")
    attempt_number: Mapped[int] = mapped_column(default=1)
    status: Mapped[str] = mapped_column(
        String(30),
        default=HomeworkSubmissionStatus.UPLOADED.value,
        server_default=HomeworkSubmissionStatus.UPLOADED.value,
        index=True,
    )
    is_pass: Mapped[bool | None] = mapped_column(nullable=True)
    score: Mapped[float | None] = mapped_column(nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    score_details: Mapped[list[dict[str, Any]] | None] = mapped_column(
        JSONB, nullable=True
    )
    plagiarism_info: Mapped[list[dict[str, Any]] | None] = mapped_column(
        JSONB, nullable=True
    )
    is_plagiarized: Mapped[bool] = mapped_column(default=False, server_default="false")
    plagiarized_from_user_id: Mapped[int | None] = mapped_column(nullable=True)
    grading_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    def to_entity(self) -> HomeworkSubmissionEntity:
        return HomeworkSubmissionEntity(
            id=self.id,
            homework_id=self.homework_id,
            user_id=self.user_id,
            object_key=self.object_key,
            original_filename=self.original_filename,
            submitted_at=self.submitted_at,
            is_late=self.is_late,
            attempt_number=self.attempt_number,
            status=HomeworkSubmissionStatus(self.status),
            is_pass=self.is_pass,
            score=self.score,
            feedback=self.feedback,
            score_details=self.score_details,
            plagiarism_info=self.plagiarism_info,
            is_plagiarized=self.is_plagiarized,
            plagiarized_from_user_id=self.plagiarized_from_user_id,
            grading_error=self.grading_error,
        )


class HomeworkSubmissionFingerprint(Base):
    __tablename__ = "homework_submission_fingerprints"
    __table_args__ = (
        UniqueConstraint(
            "submission_id",
            "file_name",
            name="uq_homework_submission_fingerprint_file",
        ),
        Index(
            "ix_homework_fingerprints_lookup",
            "homework_id",
            "file_name",
            "user_id",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    submission_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("homework_submissions.id", ondelete="CASCADE"),
        index=True,
    )
    homework_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("homeworks.id", ondelete="CASCADE"),
        index=True,
    )
    user_id: Mapped[int] = mapped_column(index=True)
    file_name: Mapped[str] = mapped_column(String(255))
    code_hash: Mapped[str] = mapped_column(String(64))
    fingerprints: Mapped[list[str]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(default=now_ict)
