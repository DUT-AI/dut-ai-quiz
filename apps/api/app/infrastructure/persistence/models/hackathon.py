from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import Enum as SAEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.hackathon import HackathonEntity, HackathonTaskEntity, MetricType

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
    participation_mode: Mapped[str] = mapped_column(default="both", server_default="both")
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
        pgUUID(as_uuid=True), ForeignKey("hackathons.id", ondelete="CASCADE"), index=True
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
