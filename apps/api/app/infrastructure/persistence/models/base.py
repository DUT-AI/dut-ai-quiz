from sqlalchemy.orm import DeclarativeBase

# Import enums from domain layer
from app.domain.value_objects import (
    AttemptStatus,
    Difficulty,
    PoolType,
    PracticeSessionStatus,
)

# Re-export for backward compatibility with existing model files
__all__ = [
    "Base",
    "PoolType",
    "Difficulty",
    "AttemptStatus",
    "PracticeSessionStatus",
]


class Base(DeclarativeBase):
    pass
