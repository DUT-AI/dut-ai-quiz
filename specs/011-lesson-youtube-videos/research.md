# Research & Architectural Decisions: Lesson YouTube Reference Videos

**Feature**: `011-lesson-youtube-videos`  
**Date**: 2026-11-01  
**Status**: Completed  

## 1. Context & Problem Statement

Currently, lessons in the DUT-AI Quiz system (`/lessons/[slug]`) support Markdown theory content, coding exercises, arena challenges, and practice questions. However, educators cannot attach external reference videos, and learners cannot watch curated YouTube lectures or problem walkthroughs inside the lesson context.

The user requirements specify:
1. In lesson management, an educator can add and manage multiple YouTube reference videos for a lesson.
2. Example link provided: `https://www.youtube.com/watch?v=Zf-VMEgCxGE&t=3179s`.
3. Learners can watch these videos on route `http://localhost:3000/lessons/ham-so/video` (where `ham-so` is the lesson slug).

## 2. Technical Research & Decisions

### Decision 1: YouTube URL & Timestamp Parsing Strategy

- **Decision**: Implement a robust YouTube parser on both backend (`app/core/youtube.py`) and frontend (`apps/web/features/lessons/lib/youtube.ts`):
  - Supported URL formats:
    - Standard: `https://www.youtube.com/watch?v=VIDEO_ID`
    - Shortened: `https://youtu.be/VIDEO_ID`
    - Embed: `https://www.youtube.com/embed/VIDEO_ID`
    - Live: `https://www.youtube.com/live/VIDEO_ID`
    - Mobile: `https://m.youtube.com/watch?v=VIDEO_ID`
  - Extraction:
    - `youtube_video_id`: 11-character alphanumeric string (including `-` and `_`).
    - `start_seconds`: Parses query parameters `t` or `start`:
      - Pure seconds: `3179s` or `3179` -> `3179`
      - Minutes & seconds: `52m59s` -> `52 * 60 + 59 = 3179`
      - Hours, minutes & seconds: `1h2m3s` -> `3600 + 120 + 3 = 3723`
      - Missing/invalid -> `0`
- **Player Embedding**: Use privacy-enhanced embed domain `https://www.youtube-nocookie.com/embed/{video_id}?start={start_seconds}&rel=0`.
- **Rationale**: Storing both the canonical parsed `youtube_video_id` and normalized `start_seconds` alongside the original raw `url` ensures fast and reliable frontend rendering without requiring dynamic parsing on every render cycle, while preserving the instructor's original link.
- **Alternatives Considered**:
  - *Storing only raw URL*: Fragile; would require repetitive regex parsing on frontend and could lead to runtime rendering errors if malformed URLs are saved.
  - *Using YouTube Data API (v3)*: Unnecessary external API dependency, quota limits, and requires Google API keys for simple embed links.

### Decision 2: Database Schema & Entity Design (Lightweight DDD)

- **Decision**: Create a dedicated table `lesson_videos`:
  - `id`: `UUID` (PK, default uuid4)
  - `lesson_id`: `UUID` (FK to `lessons.id` with `ondelete="CASCADE"`, indexed)
  - `title`: `str` (Title of the video, e.g. "Giải tích 1 - Bài tập mẫu")
  - `url`: `str` (Original YouTube link)
  - `youtube_video_id`: `str` (Extracted 11-character ID)
  - `start_seconds`: `int` (Default 0)
  - `description`: `str` (Optional notes, default "")
  - `order`: `int` (Sequential ordering within the lesson, default 0)
  - `created_at`: `datetime` (ICT timezone)
  - `updated_at`: `datetime` (ICT timezone)
- **Rationale**:
  - Separate 1-to-N relation allows arbitrary number of reference videos per lesson.
  - Cascade delete guarantees database integrity when lessons are deleted.
  - Independent ordering ensures teachers can sequence videos (e.g., Lecture 1, Lecture 2).
- **Alternatives Considered**:
  - *Storing JSON list in `lessons.videos` column*: Harder to query, lack of strict relational constraints, less clean Alembic migrations.

### Decision 3: API Endpoint Design & Contracts

- **Decision**:
  1. Extend `LessonDetailOut` to include `videos: list[LessonVideoOut] = []`.
     - When fetching a lesson by slug (`GET /api/v1/lessons/by-slug/{slug}`) or ID (`GET /api/v1/lessons/{lesson_id}`), `videos` is eagerly loaded and sorted by `order`.
  2. Provide a batch sync endpoint for educators:
     - `PUT /api/v1/lessons/{lesson_id}/videos`: Accepts `list[LessonVideoIn]` and atomically replaces/updates the lesson's video playlist.
  3. Provide individual CRUD endpoints if needed:
     - `POST /api/v1/lessons/{lesson_id}/videos`: Add a single video.
     - `DELETE /api/v1/lessons/{lesson_id}/videos/{video_id}`: Remove a video.
- **Rationale**: Batch sync (`PUT`) matches the teacher's lesson editing workflow where multiple videos are edited, reordered, and saved together with the lesson, while individual endpoints provide granular management.

### Decision 4: Frontend Route & Navigation Structure

- **Decision**:
  1. Route: `apps/web/app/(root)/lessons/[slug]/(tabs)/video/page.tsx`.
     - Automatically inherits the existing `LessonTabsLayout` which provides header, lesson context, comments, and tabs bar.
  2. Tab Bar: Add a "Video" tab item into `LessonTabsBar`:
     - Position: Between "Lý thuyết" and "Luyện tập" (or after "Lý thuyết").
     - Label: `"Video"`
     - Icon: `Video` from `lucide-react`.
     - Href: `/lessons/${slug}/video`.
     - Active pattern: `pathname.startsWith('/lessons/' + slug + '/video')`.
  3. Video Tab UI:
     - Responsive 16:9 player container with iframe using `src="https://www.youtube-nocookie.com/embed/{id}?start={start}&rel=0"`.
     - Playlist sidebar / drawer: When a lesson has multiple videos, user can switch between them with one click.
     - Empty state: Clean illustrated placeholder when `videos.length === 0`.
  4. Teacher Lesson Editor:
     - Add a "Video tham khảo" section/tab in `LessonEditorPage` with fields: URL, Title, Description, and list items with Up/Down/Delete actions.
