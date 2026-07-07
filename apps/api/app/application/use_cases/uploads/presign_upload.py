from uuid import uuid4
from fastapi import HTTPException

from app.config import settings
from app.domain.interfaces.s3_client import IS3Client


class PresignUploadUseCase:
    """Use case to generate presigned upload URLs for S3/MinIO using IS3Client."""

    def __init__(self, s3_client: IS3Client) -> None:
        self._s3_client = s3_client

    async def __call__(self, *, key: str, content_type: str) -> dict:
        if (
            not settings.minio_access_key
            or not settings.minio_secret_key
            or not settings.minio_endpoint
        ):
            raise HTTPException(status_code=503, detail="MinIO not configured")

        safe_key = key.strip("/") or f"uploads/{uuid4()}"

        url = self._s3_client.generate_presigned_upload_url(
            bucket=settings.minio_bucket_name,
            key=safe_key,
            content_type=content_type,
            expires_in=3600,
        )
        public_url = self._s3_client.get_object_url(
            settings.minio_bucket_name, safe_key
        )

        return {"presigned_url": url, "key": safe_key, "public_url": public_url}
