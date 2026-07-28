from __future__ import annotations

import argparse
import mimetypes
from pathlib import Path
from urllib.parse import quote

import boto3
from botocore.client import Config

from app.config import settings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Upload a local file to the configured MinIO/S3 bucket."
    )
    parser.add_argument("file_path", help="Path to the local file")
    parser.add_argument(
        "object_key",
        help="Object key inside the bucket, for example hackathons/demo/public_test.csv",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source = Path(args.file_path).expanduser().resolve()
    if not source.is_file():
        raise SystemExit(f"File does not exist: {source}")

    object_key = args.object_key.strip().replace("\\", "/").lstrip("/")
    if not object_key:
        raise SystemExit("Object key must not be empty.")

    required_settings = {
        "S3_ENDPOINT": settings.s3_endpoint,
        "S3_ACCESS_KEY": settings.s3_access_key,
        "S3_SECRET_KEY": settings.s3_secret_key,
        "S3_BUCKET_NAME": settings.s3_bucket_name,
    }
    missing = [name for name, value in required_settings.items() if not value]
    if missing:
        raise SystemExit(f"Missing S3 settings in .env: {', '.join(missing)}")

    endpoint = settings.s3_endpoint_url
    client = boto3.client(
        "s3",
        endpoint_url=endpoint,
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

    content_type = mimetypes.guess_type(source.name)[0] or "application/octet-stream"
    client.upload_file(
        str(source),
        settings.s3_bucket_name,
        object_key,
        ExtraArgs={"ContentType": content_type},
    )
    client.head_object(Bucket=settings.s3_bucket_name, Key=object_key)

    public_url = (
        f"{endpoint}/{settings.s3_bucket_name}/{quote(object_key, safe='/')}"
    )
    print("Upload successful")
    print(f"S3 key: s3://{settings.s3_bucket_name}/{object_key}")
    print(f"URL for the task form: {public_url}")
    print("A 403 response in the browser is normal when the bucket is private.")


if __name__ == "__main__":
    main()
