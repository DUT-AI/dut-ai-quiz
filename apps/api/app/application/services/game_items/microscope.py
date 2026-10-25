import random
from typing import TYPE_CHECKING

from app.domain.exceptions import (
    DomainValidationException,
    EntityNotFoundException,
)
from app.domain.interfaces.game_items import IGameItemStrategy
from app.domain.interfaces.question_repo import IQuestionRepository
from app.domain.value_objects.game_items import (
    ItemExecutionContext,
    ItemExecutionResult,
)
from app.domain.value_objects.gamification import GamificationItem

if TYPE_CHECKING:
    from app.domain.entities.game import GameSessionEntity


class MicroscopeItemStrategy(IGameItemStrategy):
    def __init__(self, question_repo: IQuestionRepository) -> None:
        self._question_repo = question_repo

    @property
    def item_type(self) -> GamificationItem:
        return GamificationItem.MICROSCOPE

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
        q_db = await self._question_repo.get(context.question_id)
        if not q_db:
            raise EntityNotFoundException("Question not found")

        correct_opt_id = None
        all_opt_ids = []
        for opt in q_db.options:
            all_opt_ids.append(str(opt.id))
            if opt.is_correct:
                correct_opt_id = str(opt.id)

        incorrect_opt_ids = [oid for oid in all_opt_ids if oid != correct_opt_id]
        if len(incorrect_opt_ids) >= 2:
            eliminated = random.sample(incorrect_opt_ids, 2)
        else:
            eliminated = incorrect_opt_ids

        return ItemExecutionResult(
            item_name=self.item_type.value,
            eliminated_option_ids=eliminated,
        )
