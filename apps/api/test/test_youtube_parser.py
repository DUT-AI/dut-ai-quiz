import pytest
from app.core.youtube import parse_timestamp_to_seconds, parse_youtube_url


def test_parse_timestamp_formats():
    assert parse_timestamp_to_seconds("3179s") == 3179
    assert parse_timestamp_to_seconds("3179") == 3179
    assert parse_timestamp_to_seconds("52m59s") == 52 * 60 + 59
    assert parse_timestamp_to_seconds("1h2m3s") == 3600 + 120 + 3
    assert parse_timestamp_to_seconds("1h") == 3600
    assert parse_timestamp_to_seconds("45m") == 45 * 60
    assert parse_timestamp_to_seconds(None) == 0
    assert parse_timestamp_to_seconds("") == 0
    assert parse_timestamp_to_seconds("invalid") == 0


def test_parse_youtube_url_standard():
    url = "https://www.youtube.com/watch?v=Zf-VMEgCxGE&t=3179s"
    meta = parse_youtube_url(url)
    assert meta["video_id"] == "Zf-VMEgCxGE"
    assert meta["start_seconds"] == 3179
    assert "start=3179" in meta["embed_url"]


def test_parse_youtube_url_variations():
    # Short URL
    meta_short = parse_youtube_url("https://youtu.be/Zf-VMEgCxGE?t=100")
    assert meta_short["video_id"] == "Zf-VMEgCxGE"
    assert meta_short["start_seconds"] == 100

    # Embed URL
    meta_embed = parse_youtube_url("https://www.youtube.com/embed/Zf-VMEgCxGE")
    assert meta_embed["video_id"] == "Zf-VMEgCxGE"
    assert meta_embed["start_seconds"] == 0

    # Live URL
    meta_live = parse_youtube_url("https://youtube.com/live/Zf-VMEgCxGE?feature=share")
    assert meta_live["video_id"] == "Zf-VMEgCxGE"

    # Shorts URL
    meta_shorts = parse_youtube_url("https://www.youtube.com/shorts/Zf-VMEgCxGE")
    assert meta_shorts["video_id"] == "Zf-VMEgCxGE"

    # Mobile URL
    meta_mobile = parse_youtube_url("https://m.youtube.com/watch?v=Zf-VMEgCxGE")
    assert meta_mobile["video_id"] == "Zf-VMEgCxGE"


def test_parse_youtube_url_invalid():
    with pytest.raises(ValueError, match="Đường dẫn video phải là link YouTube hợp lệ"):
        parse_youtube_url("https://vimeo.com/123456789")

    with pytest.raises(ValueError, match="Đường dẫn video phải là link YouTube hợp lệ"):
        parse_youtube_url("https://youtube.com/watch?v=invalid_id_too_short")

    with pytest.raises(ValueError, match="Đường dẫn video không được để trống"):
        parse_youtube_url("")
