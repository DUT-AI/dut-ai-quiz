from dishka import Provider, Scope, provide
from app.domain.events.bus import EventBus
from app.infrastructure.bus.simple_bus import SimpleEventBus

class BusProvider(Provider):
    scope = Scope.APP
    
    @provide
    def event_bus(self) -> EventBus:
        return SimpleEventBus()
