export interface ParsedYouTube {
  videoId: string;
  startSeconds: number;
  embedUrl: string;
  thumbnailUrl: string;
}

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function parseTimestampToSeconds(rawTime?: string | null): number {
  if (!rawTime) return 0;
  const s = rawTime.trim().toLowerCase();

  if (s.endsWith("s") && /^\d+$/.test(s.slice(0, -1))) {
    return parseInt(s.slice(0, -1), 10);
  }
  if (/^\d+$/.test(s)) {
    return parseInt(s, 10);
  }

  // Handle compound formats: 1h2m3s, 52m59s, 1h, 45m
  const match = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (match) {
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  return 0;
}

export function parseYouTubeUrl(url: string): ParsedYouTube | null {
  if (!url || typeof url !== "string") return null;

  let cleaned = url.trim();
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    cleaned = "https://" + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    const hostname = parsed.hostname.toLowerCase();
    let videoId: string | null = null;

    if (hostname === "youtu.be" || hostname === "www.youtu.be") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length > 0) {
        videoId = parts[0];
      }
    } else if (
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "youtube-nocookie.com" ||
      hostname === "www.youtube-nocookie.com"
    ) {
      if (parsed.pathname.startsWith("/watch")) {
        videoId = parsed.searchParams.get("v");
      } else if (
        parsed.pathname.startsWith("/embed/") ||
        parsed.pathname.startsWith("/live/") ||
        parsed.pathname.startsWith("/shorts/") ||
        parsed.pathname.startsWith("/v/")
      ) {
        const parts = parsed.pathname.split("/").filter(Boolean);
        if (parts.length >= 2) {
          videoId = parts[1];
        }
      }
    }

    if (!videoId || !YOUTUBE_ID_REGEX.test(videoId)) {
      return null;
    }

    const rawStart = parsed.searchParams.get("t") || parsed.searchParams.get("start");
    const startSeconds = parseTimestampToSeconds(rawStart);

    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}${
      startSeconds > 0 ? `?start=${startSeconds}&rel=0` : "?rel=0"
    }`;
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return {
      videoId,
      startSeconds,
      embedUrl,
      thumbnailUrl,
    };
  } catch {
    return null;
  }
}
