from uuid import UUID

from app.application.dtos.homework import HomeworkSubmissionOutDTO
from app.domain.interfaces import IManageService
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import get_homework_or_raise


class ListHomeworkSubmissionsUseCase:
    def __init__(
        self,
        repository: IHomeworkRepository,
        manage_service: IManageService,
    ) -> None:
        self._repository = repository
        self._manage_service = manage_service

    async def execute(
        self,
        homework_id: UUID,
    ) -> list[HomeworkSubmissionOutDTO]:
        await get_homework_or_raise(self._repository, homework_id)
        profiles = {profile.user_id: profile for profile in await self._manage_service.get_users()}
        result: list[HomeworkSubmissionOutDTO] = []
        for submission in await self._repository.list_submissions(homework_id):
            profile = profiles.get(submission.user_id)
            result.append(
                HomeworkSubmissionOutDTO.from_entity(
                    submission,
                    owner_name=profile.user_name if profile else None,
                    owner_avatar_url=(profile.user_avatar_url if profile else None),
                    include_plagiarism_identity=True,
                )
            )
        return result
