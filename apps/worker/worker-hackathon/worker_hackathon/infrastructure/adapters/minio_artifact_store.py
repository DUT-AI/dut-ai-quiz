import os
from urllib.parse import unquote, urlparse
from urllib.request import urlretrieve

import boto3
from app.config import settings
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError

from worker_hackathon.domain.interfaces.artifact_store import IArtifactStore


class MinioArtifactStore(IArtifactStore):
    def __init__(self) -> None:
        self._endpoint_url = settings.s3_endpoint_url
        self._bucket_name = settings.s3_bucket_name
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
                retries={"max_attempts": 5, "mode": "standard"},
                connect_timeout=10,
                read_timeout=60,
            ),
            region_name=settings.s3_region,
        )

    def object_key_from_reference(self, key_or_url: str) -> str:
        if not key_or_url or not key_or_url.strip():
            raise ValueError("Artifact reference must not be empty.")

        value = key_or_url.strip()
        parsed = urlparse(value)
        if parsed.scheme in {"http", "https", "s3"}:
            path_parts = [
                unquote(part) for part in parsed.path.split("/") if part.strip()
            ]
            if not path_parts:
                raise ValueError(f"Cannot resolve object key from URL: {value}")
            if path_parts[0] == self._bucket_name:
                path_parts = path_parts[1:]
            return "/".join(path_parts)

        return value.lstrip("/")

    def download_file(self, key_or_url: str, destination_path: str) -> None:
        os.makedirs(os.path.dirname(destination_path), exist_ok=True)
        key = self.object_key_from_reference(key_or_url)

        try:
            self._client.download_file(self._bucket_name, key, destination_path)
            return
        except (BotoCoreError, ClientError):
            parsed = urlparse(key_or_url)
            configured_endpoint = urlparse(self._endpoint_url)
            is_configured_s3_url = (
                parsed.scheme in {"http", "https"}
                and parsed.netloc == configured_endpoint.netloc
            )
            if parsed.scheme not in {"http", "https"} or is_configured_s3_url:
                raise

        urlretrieve(key_or_url, destination_path)

    def upload_file(
        self, source_path: str, key: str, content_type: str | None = None
    ) -> str:
        extra_args = {"ContentType": content_type} if content_type else None
        upload_kwargs = {
            "Filename": source_path,
            "Bucket": self._bucket_name,
            "Key": key,
        }
        if extra_args:
            upload_kwargs["ExtraArgs"] = extra_args

        self._client.upload_file(**upload_kwargs)
        return f"{self._endpoint_url}/{self._bucket_name}/{key}"
