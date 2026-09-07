from typing import Any
from urllib.parse import quote, urlparse, urlunparse

import boto3
from botocore.client import Config

from app.config import settings
from app.domain.interfaces.s3_client import IS3Client


class MinioClient(IS3Client):
    """S3-compatible client supporting dual endpoints (internal for direct I/O, public for presigned URLs)."""

    def __init__(self) -> None:
        self._endpoint_url = settings.s3_endpoint_url
        self._public_endpoint_url = settings.s3_public_endpoint_url

        client_config = Config(
            signature_version="s3v4",
            s3={
                "addressing_style": (
                    "path" if settings.s3_force_path_style else "virtual"
                )
            },
        )

        self._client = boto3.client(
            "s3",
            endpoint_url=self._endpoint_url,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            config=client_config,
            region_name=settings.s3_region,
        )

        if self._public_endpoint_url and self._public_endpoint_url != self._endpoint_url:
            self._public_client = boto3.client(
                "s3",
                endpoint_url=self._public_endpoint_url,
                aws_access_key_id=settings.s3_access_key,
                aws_secret_access_key=settings.s3_secret_key,
                config=client_config,
                region_name=settings.s3_region,
            )
        else:
            self._public_client = self._client

    @property
    def endpoint_url(self) -> str:
        """Returns the configured internal S3 endpoint URL."""
        return self._endpoint_url

    @property
    def public_endpoint_url(self) -> str:
        """Returns the configured public S3 endpoint URL."""
        return self._public_endpoint_url

    def upload_fileobj(self, file_obj: Any, bucket: str, key: str) -> None:
        """Uploads a file-like object synchronously using internal boto3 client."""
        self._client.upload_fileobj(file_obj, bucket, key)

    def download_fileobj(self, bucket: str, key: str, file_obj: Any) -> None:
        """Downloads an object into a file-like object using internal boto3 client."""
        self._client.download_fileobj(bucket, key, file_obj)

    def get_object_url(self, bucket: str, key: str) -> str:
        """Generates the direct HTTP/HTTPS URL for the S3 object using public endpoint."""
        encoded_key = quote(key.lstrip("/"), safe="/")
        base_url = self._public_endpoint_url or self._endpoint_url
        if settings.s3_force_path_style:
            return f"{base_url}/{bucket}/{encoded_key}"

        parsed = urlparse(base_url)
        return urlunparse(
            parsed._replace(
                netloc=f"{bucket}.{parsed.netloc}",
                path=f"{parsed.path.rstrip('/')}/{encoded_key}",
            )
        )

    def generate_presigned_upload_url(
        self, bucket: str, key: str, content_type: str, expires_in: int = 3600
    ) -> str:
        """Generates a presigned PUT upload URL using public boto3 client."""
        try:
            return self._public_client.generate_presigned_url(
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

    def generate_presigned_download_url(
        self, bucket: str, key: str, expires_in: int = 3600
    ) -> str:
        """Generates a presigned GET download URL using public boto3 client."""
        return self._public_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in,
            HttpMethod="GET",
        )
