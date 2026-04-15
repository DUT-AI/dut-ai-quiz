import uuid

import boto3
from botocore.client import Config
from fastapi import HTTPException

from app.config import settings


def execute(*, key: str, content_type: str) -> dict:
    if not settings.minio_access_key or not settings.minio_secret_key or not settings.minio_endpoint:
        raise HTTPException(status_code=503, detail="MinIO not configured")
    scheme = "https" if settings.minio_secure else "http"
    endpoint = f"{scheme}://{settings.minio_endpoint}"
    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )
    safe_key = key.strip("/") or f"uploads/{uuid.uuid4()}"
    url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.minio_bucket_name,
            "Key": safe_key,
            "ContentType": content_type,
        },
        ExpiresIn=3600,
        HttpMethod="PUT",
    )
    public_url = f"{endpoint}/{settings.minio_bucket_name}/{safe_key}"
    return {"presigned_url": url, "key": safe_key, "public_url": public_url}
