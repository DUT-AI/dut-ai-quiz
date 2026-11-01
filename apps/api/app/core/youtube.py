import re
from typing import TypedDict
from urllib.parse import parse_qs, urlparse


class YouTubeParsedMeta(TypedDict):
    video_id: str
    start_seconds: int
    embed_url: str


YOUTUBE_ID_REGEX = re.compile(r"^[a-zA-Z0-9_-]{11}$")

# Patterns to extract ID from path or query
SHORT_DOMAIN_REGEX = re.compile(r"^(?:www\.)?youtu\.be$", re.IGNORECASE)
STANDARD_DOMAINS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
}


def parse_timestamp_to_seconds(raw_time: str | None) -> int:
    """Parse various timestamp representations into total seconds.

    Supports:
    - Pure numbers: "3179", "3179s"
    - Compound times: "1h2m3s", "52m59s", "1h30s", "45m"
    """
    if not raw_time:
        return 0

    s = raw_time.strip().lower()
    if s.endswith("s") and s[:-1].isdigit():
        return int(s[:-1])
    if s.isdigit():
        return int(s)

    # Match compound h, m, s pattern: e.g. 1h2m3s, 52m59s, 1h
    match = re.match(r"^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$", s)
    if match and any(match.groups()):
        h = int(match.group(1) or 0)
        m = int(match.group(2) or 0)
        sec = int(match.group(3) or 0)
        return h * 3600 + m * 60 + sec

    return 0


def parse_youtube_url(url: str) -> YouTubeParsedMeta:
    """Extract 11-char YouTube video ID and start_seconds from a given URL.

    Raises ValueError if URL is invalid or video ID cannot be determined.
    """
    if not url or not isinstance(url, str):
        raise ValueError("Đường dẫn video không được để trống")

    cleaned_url = url.strip()
    # Add protocol if missing
    if not cleaned_url.startswith(("http://", "https://")):
        cleaned_url = "https://" + cleaned_url

    parsed = urlparse(cleaned_url)
    hostname = (parsed.hostname or "").lower()
    query_params = parse_qs(parsed.query)

    video_id: str | None = None

    # Check for youtu.be short URLs
    if SHORT_DOMAIN_REGEX.match(hostname):
        path_parts = [p for p in parsed.path.split("/") if p]
        if path_parts:
            video_id = path_parts[0]

    # Check for standard domains
    elif hostname in STANDARD_DOMAINS or any(
        hostname.endswith("." + d) for d in ("youtube.com", "youtube-nocookie.com")
    ):
        path = parsed.path
        if path.startswith("/watch"):
            video_ids = query_params.get("v")
            if video_ids:
                video_id = video_ids[0]
        elif path.startswith(("/embed/", "/live/", "/shorts/", "/v/")):
            parts = [p for p in path.split("/") if p]
            if len(parts) >= 2:
                video_id = parts[1]

    if not video_id or not YOUTUBE_ID_REGEX.match(video_id):
        raise ValueError("Đường dẫn video phải là link YouTube hợp lệ")

    # Extract start offset
    raw_start = None
    if "t" in query_params:
        raw_start = query_params["t"][0]
    elif "start" in query_params:
        raw_start = query_params["start"][0]

    start_seconds = parse_timestamp_to_seconds(raw_start)
    if start_seconds < 0:
        start_seconds = 0

    embed_url = f"https://www.youtube-nocookie.com/embed/{video_id}"
    if start_seconds > 0:
        embed_url += f"?start={start_seconds}&rel=0"
    else:
        embed_url += "?rel=0"

    return {
        "video_id": video_id,
        "start_seconds": start_seconds,
        "embed_url": embed_url,
    }
