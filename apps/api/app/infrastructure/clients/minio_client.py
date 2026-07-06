from typing import Any
import boto3
from botocore.client import Config

from app.config import settings
from app.domain.interfaces.s3_client import IS3Client


class MinioClient(IS3Client):
    """Concrete implementation of IS3Client for MinIO/S3."""

    def __init__(self) -> None:
        scheme = "https" if settings.minio_secure else "http"
        self._endpoint_url = f"{scheme}://{settings.minio_endpoint}"
        self._client = boto3.client(
            "s3",
            endpoint_url=self._endpoint_url,
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )

    @property
    def endpoint_url(self) -> str:
        """Returns the configured S3 endpoint URL."""
        return self._endpoint_url

    def upload_fileobj(self, file_obj: Any, bucket: str, key: str) -> None:
        """Uploads a file-like object synchronously using boto3."""
        self._client.upload_fileobj(file_obj, bucket, key)

    def get_object_url(self, bucket: str, key: str) -> str:
        """Generates the direct HTTP/HTTPS URL for the S3 object."""
        return f"{self._endpoint_url}/{bucket}/{key}"

    def generate_presigned_upload_url(
        self, bucket: str, key: str, content_type: str, expires_in: int = 3600
    ) -> str:
        """Generates a presigned PUT upload URL using boto3."""
        try:
            return self._client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": bucket,
                    "Key": key,
                    "ContentType": content_type,
                },
                ExpiresIn=expires_in,
                HttpMethod="PUT",
            )
        except Exception as e:
            raise e
