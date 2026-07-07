from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import Enum as SAEnum, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID as pgUUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.hackathon import (
    HackathonEntity,
    HackathonTaskEntity,
    MetricType,
    HackathonTeamEntity,
    HackathonRegistrationEntity,
    RegistrationStatus,
)
from app.domain.entities.submission import (
    SubmissionStatus,
    HackathonSubmissionEntity,
)

from .base import Base


class Hackathon(Base):
    __tablename__ = "hackathons"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column()
    description: Mapped[str] = mapped_column(default="", server_default="")
    rules: Mapped[str] = mapped_column(default="", server_default="")
    start_time: Mapped[datetime | None] = mapped_column(nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(nullable=True)
    participation_mode: Mapped[str] = mapped_column(
        default="both", server_default="both"
    )
    max_team_members: Mapped[int] = mapped_column(
        Integer, default=5, server_default="5"
    )
    created_by: Mapped[int] = mapped_column(index=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(nullable=True)

    def to_entity(self) -> HackathonEntity:
        return HackathonEntity(
            id=self.id,
            name=self.name,
            description=self.description,
            rules=self.rules,
            start_time=self.start_time,
            end_time=self.end_time,
            participation_mode=self.participation_mode,
            max_team_members=self.max_team_members,
            created_by=self.created_by,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: HackathonEntity) -> "Hackathon":
        return cls(
            id=entity.id,
            name=entity.name,
            description=entity.description,
            rules=entity.rules,
            start_time=entity.start_time,
            end_time=entity.end_time,
            participation_mode=entity.participation_mode,
            max_team_members=entity.max_team_members,
            created_by=entity.created_by,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )


class HackathonTask(Base):
    __tablename__ = "hackathon_tasks"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    hackathon_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        index=True,
    )
    name: Mapped[str] = mapped_column()
    problem_description_md: Mapped[str] = mapped_column(Text)
    private_test_url: Mapped[str] = mapped_column(Text)
    public_test_url: Mapped[str] = mapped_column(Text)
    metric_type: Mapped[MetricType] = mapped_column(
        SAEnum(
            MetricType,
            name="metric_type_enum",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        )
    )
    max_submissions: Mapped[int] = mapped_column(default=1, server_default="1")
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(nullable=True)

    def to_entity(self) -> HackathonTaskEntity:
        return HackathonTaskEntity(
            id=self.id,
            hackathon_id=self.hackathon_id,
            name=self.name,
            problem_description_md=self.problem_description_md,
            private_test_url=self.private_test_url,
            public_test_url=self.public_test_url,
            metric_type=self.metric_type,
            max_submissions=self.max_submissions,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: HackathonTaskEntity) -> "HackathonTask":
        return cls(
            id=entity.id,
            hackathon_id=entity.hackathon_id,
            name=entity.name,
            problem_description_md=entity.problem_description_md,
            private_test_url=entity.private_test_url,
            public_test_url=entity.public_test_url,
            metric_type=entity.metric_type,
            max_submissions=entity.max_submissions,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )


class HackathonTeam(Base):
    __tablename__ = "hackathon_teams"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    hackathon_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        index=True,
    )
    name: Mapped[str] = mapped_column(nullable=False)
    code: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    leader_id: Mapped[int] = mapped_column(nullable=False)
    member_ids: Mapped[list[int]] = mapped_column(
        ARRAY(Integer()), nullable=False, default=list
    )
    created_at: Mapped[datetime] = mapped_column(nullable=False)

    def to_entity(self) -> HackathonTeamEntity:
        return HackathonTeamEntity(
            id=self.id,
            hackathon_id=self.hackathon_id,
            name=self.name,
            code=self.code,
            leader_id=self.leader_id,
            member_ids=self.member_ids,
            created_at=self.created_at,
        )

    @classmethod
    def from_entity(cls, entity: HackathonTeamEntity) -> "HackathonTeam":
        return cls(
            id=entity.id,
            hackathon_id=entity.hackathon_id,
            name=entity.name,
            code=entity.code,
            leader_id=entity.leader_id,
            member_ids=entity.member_ids,
            created_at=entity.created_at,
        )


class HackathonRegistration(Base):
    __tablename__ = "hackathon_registrations"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    hackathon_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        index=True,
    )
    user_id: Mapped[int | None] = mapped_column(nullable=True, index=True)
    team_id: Mapped[UUID | None] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("hackathon_teams.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    status: Mapped[RegistrationStatus] = mapped_column(
        SAEnum(
            RegistrationStatus,
            name="registration_status_enum",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=RegistrationStatus.PENDING,
        server_default="pending",
    )
    registered_at: Mapped[datetime] = mapped_column(nullable=False)
    reviewed_by: Mapped[int | None] = mapped_column(nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(nullable=True)

    def to_entity(self) -> HackathonRegistrationEntity:
        return HackathonRegistrationEntity(
            id=self.id,
            hackathon_id=self.hackathon_id,
            user_id=self.user_id,
            team_id=self.team_id,
            status=self.status,
            registered_at=self.registered_at,
            reviewed_by=self.reviewed_by,
            rejection_reason=self.rejection_reason,
        )

    @classmethod
    def from_entity(
        cls, entity: HackathonRegistrationEntity
    ) -> "HackathonRegistration":
        return cls(
            id=entity.id,
            hackathon_id=entity.hackathon_id,
            user_id=entity.user_id,
            team_id=entity.team_id,
            status=entity.status,
            registered_at=entity.registered_at,
            reviewed_by=entity.reviewed_by,
            rejection_reason=entity.rejection_reason,
        )


class HackathonSubmission(Base):
    __tablename__ = "hackathon_submissions"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    task_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("hackathon_tasks.id", ondelete="CASCADE"),
        index=True,
    )
    user_id: Mapped[int] = mapped_column(index=True)
    team_id: Mapped[UUID | None] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("hackathon_teams.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    script_url: Mapped[str] = mapped_column(Text)
    model_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[SubmissionStatus] = mapped_column(
        SAEnum(
            SubmissionStatus,
            name="submission_status_enum",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=SubmissionStatus.UPLOADING,
        server_default="UPLOADING",
    )
    score: Mapped[float | None] = mapped_column(nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    logs: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(nullable=True)

    def to_entity(self) -> HackathonSubmissionEntity:
        return HackathonSubmissionEntity(
            id=self.id,
            task_id=self.task_id,
            user_id=self.user_id,
            team_id=self.team_id,
            script_url=self.script_url,
            model_url=self.model_url,
            status=self.status,
            score=self.score,
            error_message=self.error_message,
            logs=self.logs,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: HackathonSubmissionEntity) -> "HackathonSubmission":
        return cls(
            id=entity.id,
            task_id=entity.task_id,
            user_id=entity.user_id,
            team_id=entity.team_id,
            script_url=entity.script_url,
            model_url=entity.model_url,
            status=entity.status,
            score=entity.score,
            error_message=entity.error_message,
            logs=entity.logs,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

