from unittest.mock import Mock, patch

from app.config import Settings
from app.infrastructure.clients import minio_client as s3_client_module


def test_s3_settings_normalize_endpoint_and_prefer_s3_names() -> None:
    config = Settings(
        _env_file=None,
        S3_ENDPOINT="http://s3.internal:9000/",
        S3_ACCESS_KEY="access",
        S3_SECRET_KEY="secret",
        S3_REGION="ap-southeast-1",
        S3_BUCKET_NAME="hackathon",
        S3_FORCE_PATH_STYLE="true",
    )

    assert config.s3_endpoint_url == "http://s3.internal:9000"
    assert config.s3_region == "ap-southeast-1"
    assert config.s3_bucket_name == "hackathon"
    assert config.s3_force_path_style is True
    assert config.s3_is_configured is True


def test_s3_settings_keep_legacy_minio_environment_compatible() -> None:
    config = Settings(
        _env_file=None,
        MINIO_ENDPOINT="minio.internal:9000",
        MINIO_ACCESS_KEY="access",
        MINIO_SECRET_KEY="secret",
        MINIO_BUCKET_NAME="legacy",
        MINIO_SECURE="false",
    )

    assert config.s3_endpoint_url == "http://minio.internal:9000"
    assert config.s3_bucket_name == "legacy"
    assert config.s3_is_configured is True


def test_s3_client_uses_region_path_style_and_encoded_object_url() -> None:
    config = Settings(
        _env_file=None,
        S3_ENDPOINT="http://s3.internal:9000/",
        S3_ACCESS_KEY="access",
        S3_SECRET_KEY="secret",
        S3_REGION="us-east-1",
        S3_BUCKET_NAME="hackathon",
        S3_FORCE_PATH_STYLE="true",
    )
    boto_client = Mock()

    with (
        patch.object(s3_client_module, "settings", config),
        patch.object(
            s3_client_module.boto3, "client", return_value=boto_client
        ) as factory,
    ):
        client = s3_client_module.MinioClient()

    kwargs = factory.call_args.kwargs
    assert kwargs["endpoint_url"] == "http://s3.internal:9000"
    assert kwargs["region_name"] == "us-east-1"
    assert kwargs["config"].s3["addressing_style"] == "path"
    assert (
        client.get_object_url("hackathon", "datasets/tập dữ liệu.csv")
        == "http://s3.internal:9000/hackathon/datasets/"
        "t%E1%BA%ADp%20d%E1%BB%AF%20li%E1%BB%87u.csv"
    )
