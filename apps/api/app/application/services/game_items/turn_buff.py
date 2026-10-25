from typing import TYPE_CHECKING

from app.domain.exceptions import DomainValidationException
from app.domain.interfaces.game_items import IGameItemStrategy
from app.domain.value_objects.game_items import (
    ItemExecutionContext,
    ItemExecutionResult,
)
from app.domain.value_objects.gamification import GamificationItem

if TYPE_CHECKING:
    from app.domain.entities.game import GameSessionEntity


class TurnBuffItemStrategy(IGameItemStrategy):
    def __init__(self, item_type: GamificationItem) -> None:
        self._item_type = item_type

    @property
    def item_type(self) -> GamificationItem:
        return self._item_type

    @property
    def is_instant(self) -> bool:
        return False

    def validate(self, session: "GameSessionEntity", context: ItemExecutionContext) -> None:
        raise DomainValidationException(
            f"Item {self.item_type.value} must be activated when submitting your answer"
        )

    def calculate_price(self, session: "GameSessionEntity", context: ItemExecutionContext) -> int:
        is_boss = context.current_question_meta.is_boss if context.current_question_meta else False
        return session.gamification.get_item_price(self.item_type, is_boss=is_boss)

    async def apply(
        self, session: "GameSessionEntity", context: ItemExecutionContext
    ) -> ItemExecutionResult:
        raise DomainValidationException(
            f"Item {self.item_type.value} must be activated when submitting your answer"
        )
