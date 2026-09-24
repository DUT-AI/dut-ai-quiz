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
        patch.object(s3_client_module.boto3, "client", return_value=boto_client) as factory,
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


def test_s3_dual_endpoint_settings_and_client() -> None:
    config = Settings(
        _env_file=None,
        MINIO_ENDPOINT="dut-ai-minio:9000",
        MINIO_SECURE="false",
        MINIO_PUBLIC_ENDPOINT="minio.dutai.site",
        MINIO_PUBLIC_SECURE="true",
        MINIO_ACCESS_KEY="access",
        MINIO_SECRET_KEY="secret",
        MINIO_BUCKET_NAME="lms-prod",
    )

    assert config.s3_endpoint_url == "http://dut-ai-minio:9000"
    assert config.s3_public_endpoint_url == "https://minio.dutai.site"

    internal_boto = Mock()
    public_boto = Mock()
    public_boto.generate_presigned_url.return_value = (
        "https://minio.dutai.site/lms-prod/test.zip?signed=1"
    )

    def mock_boto_factory(*args, **kwargs):
        if kwargs.get("endpoint_url") == "https://minio.dutai.site":
            return public_boto
        return internal_boto

    with (
        patch.object(s3_client_module, "settings", config),
        patch.object(s3_client_module.boto3, "client", side_effect=mock_boto_factory) as factory,
    ):
        client = s3_client_module.MinioClient()

        assert factory.call_count == 2

        # Direct object URL uses public endpoint
        assert (
            client.get_object_url("lms-prod", "homeworks/file.zip")
            == "https://minio.dutai.site/lms-prod/homeworks/file.zip"
        )

        # Presigned download URL uses public client
        download_url = client.generate_presigned_download_url("lms-prod", "homeworks/file.zip")
        assert download_url == "https://minio.dutai.site/lms-prod/test.zip?signed=1"
        public_boto.generate_presigned_url.assert_called_with(
            "get_object",
            Params={"Bucket": "lms-prod", "Key": "homeworks/file.zip"},
            ExpiresIn=3600,
            HttpMethod="GET",
        )

        # Upload fileobj uses internal client
        file_obj = Mock()
        client.upload_fileobj(file_obj, "lms-prod", "homeworks/file.zip")
        internal_boto.upload_fileobj.assert_called_once_with(
            file_obj, "lms-prod", "homeworks/file.zip"
        )
