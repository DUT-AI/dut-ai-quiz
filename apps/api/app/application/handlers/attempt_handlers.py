from app.application.use_cases.attempts import SubmitAttemptUseCase
from app.domain.events.attempts import AttemptViolationEvent


class AttemptViolationHandler:
    def __init__(self, submit_use_case: SubmitAttemptUseCase):
        self._submit_use_case = submit_use_case

    async def __call__(self, event: AttemptViolationEvent):
        await self._submit_use_case.execute(event.attempt_id, event.user_id)
