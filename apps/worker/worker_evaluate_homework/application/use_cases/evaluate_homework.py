from typing import Any
from uuid import UUID

import httpx
from arq import Retry
from loguru import logger
from sqlalchemy import select

from app.config import settings
from app.domain.entities.homework import HomeworkSubmissionStatus
from app.infrastructure.clients.minio_client import MinioClient
from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.persistence.models.homework import Homework, HomeworkSubmission


class EvaluateHomeworkUseCase:
    def __init__(self, http_client: httpx.AsyncClient, storage: MinioClient) -> None:
        self._http = http_client
        self._storage = storage

    async def register_homework(self, homework_id: UUID, job_try: int = 1) -> None:
        if not settings.homework_checker_api_url:
            return
        async with AsyncSessionLocal() as session:
            homework = await session.get(Homework, homework_id)
            if homework is None:
                if job_try < 3:
                    raise Retry(defer=2)
                raise RuntimeError(f"Homework {homework_id} not found")
            attachment_url = ""
            if homework.attachment_key:
                attachment_url = self._download_url(homework.attachment_key)
            response = await self._http.post(
                settings.homework_checker_api_url,
                json={
                    "homework_link": attachment_url,
                    "description": homework.description,
                    "homework_id": str(homework.id),
                },
                timeout=settings.homework_grading_timeout_seconds,
            )
            response.raise_for_status()

    async def evaluate(self, submission_id: UUID, job_try: int = 1) -> float | None:
        if not settings.submission_checker_api_url:
            return None

        async with AsyncSessionLocal() as session:
            submission = await session.scalar(
                select(HomeworkSubmission)
                .where(HomeworkSubmission.id == submission_id)
                .with_for_update()
            )
            if submission is None:
                if job_try < 3:
                    raise Retry(defer=2)
                raise RuntimeError(f"Homework submission {submission_id} not found")
            if submission.status == HomeworkSubmissionStatus.GRADED.value:
                return submission.score
            submission.status = HomeworkSubmissionStatus.GRADING.value
            submission.grading_error = None
            await session.commit()

        try:
            response = await self._http.post(
                settings.submission_checker_api_url,
                json={
                    "submission_link": self._download_url(submission.object_key),
                    "homework_id": str(submission.homework_id),
                    "user_id": str(submission.user_id),
                },
                timeout=settings.homework_grading_timeout_seconds,
            )
            response.raise_for_status()
            payload = response.json()
            plagiarism = payload.get("plagiarism") or []
            is_plagiarized, copied_user_id = _plagiarism_result(plagiarism)

            async with AsyncSessionLocal() as session:
                model = await session.get(HomeworkSubmission, submission_id)
                if model is None:
                    raise RuntimeError(f"Homework submission {submission_id} vanished")
                model.status = HomeworkSubmissionStatus.GRADED.value
                model.is_pass = bool(payload.get("is_pass", False))
                model.score = payload.get("score")
                model.feedback = payload.get("feedback") or "Không có feedback"
                model.score_details = payload.get("score_details") or []
                model.plagiarism_info = plagiarism
                model.is_plagiarized = is_plagiarized
                model.plagiarized_from_user_id = copied_user_id
                model.grading_error = None
                await session.commit()
                return model.score
        except Exception as exc:
            logger.exception("Homework evaluation {} failed: {}", submission_id, exc)
            if job_try < 3:
                raise Retry(defer=10 * job_try) from exc
            async with AsyncSessionLocal() as session:
                model = await session.get(HomeworkSubmission, submission_id)
                if model:
                    model.status = HomeworkSubmissionStatus.FAILED.value
                    model.grading_error = str(exc)[:2000]
                    await session.commit()
            raise

    def _download_url(self, key: str) -> str:
        return self._storage.generate_presigned_download_url(
            settings.s3_bucket_name,
            key,
            settings.presigned_url_expire_seconds,
        )


def _plagiarism_result(value: Any) -> tuple[bool, int | None]:
    best_user_id: int | None = None

    def visit(node: Any) -> bool:
        nonlocal best_user_id
        if isinstance(node, dict):
            score = node.get("score")
            similarity = (
                score.get("similarity_score")
                if isinstance(score, dict)
                else node.get("similarity_score")
            )
            if isinstance(similarity, int | float) and similarity >= 0.8:
                candidate = node.get("best_user_id_match")
                if candidate is not None and str(candidate).isdigit():
                    best_user_id = int(candidate)
                return True
            return any(visit(item) for item in node.values())
        if isinstance(node, list):
            return any(visit(item) for item in node)
        return False

    return visit(value), best_user_id
