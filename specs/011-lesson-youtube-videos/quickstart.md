# Quickstart & Verification Guide: Lesson YouTube Reference Videos

**Feature**: `011-lesson-youtube-videos`  
**Date**: 2026-11-01  
**Status**: Ready for Implementation  

This guide provides end-to-end validation scenarios and verification steps for testing the YouTube reference video feature for lessons across backend and frontend.

---

## 1. Prerequisites & Environment Setup

Ensure database and services are running:

```bash
# 1. Start PostgreSQL
docker compose up -d postgres

# 2. Run backend migrations
cd apps/api
uv run alembic upgrade head

# 3. Start API dev server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 4. Start Web dev server (in another terminal)
cd apps/web
npm run dev
```

---

## 2. Validation Scenarios

### Scenario 1: YouTube URL & Timestamp Parsing (Unit Level)

Verify the URL parser accurately extracts YouTube ID and timestamp:

```bash
cd apps/api
uv run python -c '
from app.core.youtube import parse_youtube_url

res = parse_youtube_url("https://www.youtube.com/watch?v=Zf-VMEgCxGE&t=3179s")
print(res)
assert res["video_id"] == "Zf-VMEgCxGE"
assert res["start_seconds"] == 3179
print("✓ Parser validation passed!")
'
```

### Scenario 2: Batch Syncing Videos via API

Send a `PUT` request to attach YouTube videos to a lesson:

```bash
curl -X PUT "http://localhost:8000/api/v1/lessons/{lesson_id}/videos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -d '{
    "videos": [
      {
        "title": "Hàm số - Giải tích 1 Video Bài giảng",
        "url": "https://www.youtube.com/watch?v=Zf-VMEgCxGE&t=3179s",
        "description": "Video tham khảo giải bài tập cực trị và tiệm cận",
        "order": 0
      }
    ]
  }'
```

**Expected Outcome**: Returns `200 OK` with serialized `LessonVideoOut` list containing `youtube_video_id: "Zf-VMEgCxGE"` and `start_seconds: 3179`.

### Scenario 3: Fetching Lesson Details with Videos

Fetch the lesson by its slug:

```bash
curl -s "http://localhost:8000/api/v1/lessons/by-slug/ham-so" | jq .videos
```

**Expected Outcome**:
```json
[
  {
    "id": "...",
    "title": "Hàm số - Giải tích 1 Video Bài giảng",
    "url": "https://www.youtube.com/watch?v=Zf-VMEgCxGE&t=3179s",
    "youtube_video_id": "Zf-VMEgCxGE",
    "start_seconds": 3179,
    "order": 0
  }
]
```

### Scenario 4: Learner Route Verification (`/lessons/[slug]/video`)

1. Open browser to: `http://localhost:3000/lessons/ham-so/video`
2. **Verify**:
   - The "Video" tab in `LessonTabsBar` is highlighted active with `Video` icon.
   - The embedded iframe src is `https://www.youtube-nocookie.com/embed/Zf-VMEgCxGE?start=3179&rel=0`.
   - The video starts at timestamp 3179s (52m59s).
   - If multiple videos exist, clicking another video in the playlist switches the active player.
   - If 0 videos exist for the lesson, the page displays a friendly empty state ("Chưa có video tham khảo cho bài học này").

### Scenario 5: Teacher Management Verification

1. Log in as an Educator and navigate to: `http://localhost:3000/teacher/lessons/{lesson_id}/edit`
2. Scroll to the "Video tham khảo" section (or dedicated tab in the editor).
3. Paste `https://www.youtube.com/watch?v=Zf-VMEgCxGE&t=3179s` into the URL field and provide a title.
4. Verify instant thumbnail preview and detected start timestamp.
5. Click Save. Refresh the page or view `/lessons/ham-so/video` to ensure the changes are persisted.

---

## 3. Automated Quality Gate Checks

Run the constitution-mandated test suites before commit:

```bash
# Backend unit tests
cd apps/api
uv run pytest test/test_lesson_videos.py
uv run pytest

# Typecheck & Lint
cd ../..
make check
```
