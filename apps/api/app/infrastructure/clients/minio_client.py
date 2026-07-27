from typing import Any
from urllib.parse import quote, urlparse, urlunparse

import boto3
from botocore.client import Config

from app.config import settings
from app.domain.interfaces.s3_client import IS3Client


class MinioClient(IS3Client):
    """S3-compatible client (the legacy class name is kept for DI compatibility)."""

    def __init__(self) -> None:
        self._endpoint_url = settings.s3_endpoint_url
        self._client = boto3.client(
            "s3",
            endpoint_url=self._endpoint_url,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            config=Config(
                signature_version="s3v4",
                s3={
                    "addressing_style": (
                        "path" if settings.s3_force_path_style else "virtual"
                    )
                },
            ),
            region_name=settings.s3_region,
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
        encoded_key = quote(key.lstrip("/"), safe="/")
        if settings.s3_force_path_style:
            return f"{self._endpoint_url}/{bucket}/{encoded_key}"

        parsed = urlparse(self._endpoint_url)
        return urlunparse(
            parsed._replace(
                netloc=f"{bucket}.{parsed.netloc}",
                path=f"{parsed.path.rstrip('/')}/{encoded_key}",
            )
        )

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
