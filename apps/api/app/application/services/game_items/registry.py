from app.domain.exceptions import DomainValidationException
from app.domain.interfaces.game_items import IGameItemStrategy
from app.domain.value_objects.gamification import GamificationItem


class GameItemRegistry:
    def __init__(self, strategies: list[IGameItemStrategy] | None = None) -> None:
        self._strategies: dict[GamificationItem, IGameItemStrategy] = {}
        if strategies:
            for strategy in strategies:
                self.register(strategy)

    def register(self, strategy: IGameItemStrategy) -> None:
        self._strategies[strategy.item_type] = strategy

    def get(self, item_type: GamificationItem) -> IGameItemStrategy:
        strategy = self._strategies.get(item_type)
        if not strategy:
            raise DomainValidationException(f"Unsupported item: {item_type.value}")
        return strategy

    def get_by_name(self, name: str) -> IGameItemStrategy:
        try:
            item_type = GamificationItem(name.lower().strip())
        except (ValueError, AttributeError) as exc:
            raise DomainValidationException(f"Invalid item: {name}") from exc
        return self.get(item_type)
