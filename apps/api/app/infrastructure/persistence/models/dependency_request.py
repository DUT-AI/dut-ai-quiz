from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import Enum as SAEnum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.dependency_request import DependencyRequestEntity
from app.domain.value_objects.enums import DependencyRequestStatus
from .base import Base


class DependencyRequest(Base):
    __tablename__ = "dependency_requests"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    hackathon_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    task_id: Mapped[UUID | None] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("hackathon_tasks.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    user_id: Mapped[int] = mapped_column(index=True, nullable=False)
    team_id: Mapped[UUID | None] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("hackathon_teams.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    package_name: Mapped[str] = mapped_column(String(200), nullable=False)
    package_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[DependencyRequestStatus] = mapped_column(
        SAEnum(
            DependencyRequestStatus,
            name="dependency_request_status_enum",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=DependencyRequestStatus.PENDING,
        server_default="PENDING",
        index=True,
    )
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, index=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    reviewed_by: Mapped[int | None] = mapped_column(nullable=True)

    def to_entity(self) -> DependencyRequestEntity:
        return DependencyRequestEntity(
            id=self.id,
            hackathon_id=self.hackathon_id,
            task_id=self.task_id,
            user_id=self.user_id,
            team_id=self.team_id,
            package_name=self.package_name,
            package_version=self.package_version,
            reason=self.reason,
            status=self.status,
            admin_note=self.admin_note,
            created_at=self.created_at,
            reviewed_at=self.reviewed_at,
            reviewed_by=self.reviewed_by,
        )

    @classmethod
    def from_entity(cls, entity: DependencyRequestEntity) -> "DependencyRequest":
        return cls(
            id=entity.id,
            hackathon_id=entity.hackathon_id,
            task_id=entity.task_id,
            user_id=entity.user_id,
            team_id=entity.team_id,
            package_name=entity.package_name,
            package_version=entity.package_version,
            reason=entity.reason,
            status=entity.status,
            admin_note=entity.admin_note,
            created_at=entity.created_at,
            reviewed_at=entity.reviewed_at,
            reviewed_by=entity.reviewed_by,
        )
