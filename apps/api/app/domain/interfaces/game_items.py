from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

from app.domain.value_objects.game_items import (
    ItemExecutionContext,
    ItemExecutionResult,
)
from app.domain.value_objects.gamification import GamificationItem

if TYPE_CHECKING:
    from app.domain.entities.game import GameSessionEntity


class IGameItemStrategy(ABC):
    @property
    @abstractmethod
    def item_type(self) -> GamificationItem:
        """The specific GamificationItem enum this strategy handles."""
        ...

    @property
    @abstractmethod
    def is_instant(self) -> bool:
        """Whether this item is activated immediately mid-question or as a turn-based buff."""
        ...

    @abstractmethod
    def validate(self, session: "GameSessionEntity", context: ItemExecutionContext) -> None:
        """Validate preconditions for using this item."""
        ...

    @abstractmethod
    def calculate_price(self, session: "GameSessionEntity", context: ItemExecutionContext) -> int:
        """Calculate the price required to use this item."""
        ...

    @abstractmethod
    async def apply(
        self, session: "GameSessionEntity", context: ItemExecutionContext
    ) -> ItemExecutionResult:
        """Apply the item's effects, mutate session state, and return execution outcome."""
        ...
