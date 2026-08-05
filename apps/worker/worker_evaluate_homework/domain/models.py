from dataclasses import dataclass
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class SubmissionGradingStatus(StrEnum):
    GRADING = "GRADING"
    GRADED = "GRADED"
    FAILED = "FAILED"


class GradingCriterion(BaseModel):
    id: str = Field(pattern=r"^[a-z][a-z0-9_]{1,49}$")
    criterion: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1, max_length=1000)
    weight: float = Field(gt=0, le=10)


class HomeworkRubric(BaseModel):
    topic: str
    objective: str = ""
    required_files: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    allowed_libraries: list[str] = Field(default_factory=list)
    forbidden_libraries: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    criteria: list[GradingCriterion] = Field(
        default_factory=list, min_length=3, max_length=10
    )

    @model_validator(mode="after")
    def validate_criteria(self) -> "HomeworkRubric":
        ids = [item.id for item in self.criteria]
        if len(ids) != len(set(ids)):
            raise ValueError("Rubric criteria contain duplicate IDs")
        return self


class CriterionEvaluation(BaseModel):
    id: str
    status: bool
    description: str


class ChecklistEvaluation(BaseModel):
    evaluations: list[CriterionEvaluation]

    @model_validator(mode="after")
    def require_unique_criteria(self) -> "ChecklistEvaluation":
        ids = [item.id for item in self.evaluations]
        if len(ids) != len(set(ids)):
            raise ValueError("Grading criteria contain duplicate IDs")
        return self

    def get(self, criterion_id: str) -> CriterionEvaluation:
        return next(item for item in self.evaluations if item.id == criterion_id)

    def replace(self, value: CriterionEvaluation) -> None:
        self.evaluations = [
            value if item.id == value.id else item for item in self.evaluations
        ]


@dataclass(frozen=True, slots=True)
class SourceFile:
    name: str
    content: str


@dataclass(frozen=True, slots=True)
class HomeworkGradingRecord:
    id: UUID
    title: str
    description: str
    attachment_key: str | None
    grading_rubric: dict[str, Any] | None


@dataclass(frozen=True, slots=True)
class SubmissionGradingRecord:
    id: UUID
    homework_id: UUID
    user_id: int
    object_key: str
    status: str
    score: float | None


@dataclass(frozen=True, slots=True)
class StoredFingerprint:
    user_id: int
    file_name: str
    fingerprints: frozenset[str]


@dataclass(frozen=True, slots=True)
class GradeResult:
    is_pass: bool
    score: float
    feedback: str
    score_details: list[dict[str, Any]]
