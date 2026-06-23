from enum import StrEnum
from sqlalchemy.orm import DeclarativeBase


class PoolType(StrEnum):
    PRACTICE = "PRACTICE"
    EXAM = "EXAM"


class AttemptStatus(StrEnum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class PracticeSessionStatus(StrEnum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class Base(DeclarativeBase):
    pass
