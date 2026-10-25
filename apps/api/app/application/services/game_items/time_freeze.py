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


class TimeFreezeItemStrategy(IGameItemStrategy):
    @property
    def item_type(self) -> GamificationItem:
        return GamificationItem.TIME_FREEZE

    @property
    def is_instant(self) -> bool:
        return True

    def validate(self, session: "GameSessionEntity", context: ItemExecutionContext) -> None:
        if not context.current_question_meta:
            raise DomainValidationException("All questions already answered")

        if str(context.current_question_meta.id) != str(context.question_id):
            raise DomainValidationException("Question ID does not match current question index")

    def calculate_price(self, session: "GameSessionEntity", context: ItemExecutionContext) -> int:
        is_boss = context.current_question_meta.is_boss if context.current_question_meta else False
        return session.gamification.get_item_price(self.item_type, is_boss=is_boss)

    async def apply(
        self, session: "GameSessionEntity", context: ItemExecutionContext
    ) -> ItemExecutionResult:
        return ItemExecutionResult(
            item_name=self.item_type.value,
            time_freeze_active=True,
        )
