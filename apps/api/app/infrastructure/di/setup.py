from dishka import make_async_container, Scope
from dishka.integrations.fastapi import setup_dishka

from app.infrastructure.di.database import DatabaseProvider
from app.infrastructure.di.hackathon import HackathonProvider
from app.infrastructure.di.repositories import RepositoryProvider
from app.infrastructure.di.clients import ClientProvider
from app.infrastructure.di.use_cases import UseCaseProvider
from app.infrastructure.di.bus import BusProvider
from app.infrastructure.di.cache import CacheProvider
from app.domain.events.bus import EventBus
from app.domain.events.attempts import AttemptViolationEvent
from app.application.handlers.attempt_handlers import AttemptViolationHandler
from app.application.use_cases.attempts import SubmitAttemptUseCase


def setup_di(app):
    container = make_async_container(
        DatabaseProvider(),
        HackathonProvider(),
        RepositoryProvider(),
        ClientProvider(),
        UseCaseProvider(),
        BusProvider(),
        CacheProvider(),
    )

    # We'll use the app state to store the container if needed,
    # and use lifespan for async registrations.
    app.state.dishka_container = container
    setup_dishka(container, app)


async def register_event_handlers(container):
    bus = await container.get(EventBus)

    async def handle_violation(event: AttemptViolationEvent):
        async with container(scope=Scope.REQUEST) as request_container:
            submit_uc = await request_container.get(SubmitAttemptUseCase)
            handler = AttemptViolationHandler(submit_uc)
            await handler(event)

    bus.subscribe(AttemptViolationEvent, handle_violation)
