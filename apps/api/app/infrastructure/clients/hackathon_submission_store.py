from typing import Any

from app.config import settings
from app.domain.interfaces.hackathon_submission_store import (
    IHackathonSubmissionStore,
    SubmissionStorageInfo,
)
from app.domain.interfaces.s3_client import IS3Client


class MinIOHackathonSubmissionStore(IHackathonSubmissionStore):
    """Concrete implementation of IHackathonSubmissionStore utilizing IS3Client to save files on MinIO."""

    def __init__(self, s3_client: IS3Client) -> None:
        self._s3_client = s3_client
        self._bucket_name = settings.s3_bucket_name

    def upload_submission_files(
        self,
        submission_id: str,
        hackathon_slug: str,
        sender_slug: str,
        script_file: Any,
        model_file: Any | None = None,
        model_filename: str | None = None,
    ) -> SubmissionStorageInfo:
        script_s3_key = f"hackathons/{hackathon_slug}/{sender_slug}/{submission_id}/predict.py"
        model_s3_key = None

        # 1. Upload Script File
        self._s3_client.upload_fileobj(script_file, self._bucket_name, script_s3_key)

        # 2. Upload Model File (nếu có)
        if model_file and model_filename:
            model_ext = model_filename.split(".")[-1] if "." in model_filename else "bin"
            model_s3_key = (
                f"hackathons/{hackathon_slug}/{sender_slug}/{submission_id}/model.{model_ext}"
            )
            self._s3_client.upload_fileobj(model_file, self._bucket_name, model_s3_key)

        # 3. Tạo URL truy cập
        script_url = self._s3_client.get_object_url(self._bucket_name, script_s3_key)
        model_url = (
            self._s3_client.get_object_url(self._bucket_name, model_s3_key)
            if model_s3_key
            else None
        )

        return SubmissionStorageInfo(
            script_s3_key=script_s3_key,
            model_s3_key=model_s3_key,
            script_url=script_url,
            model_url=model_url,
        )
