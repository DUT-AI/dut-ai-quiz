# Feature Specification: Lesson YouTube Reference Videos

**Feature Branch**: `011-lesson-youtube-videos`

**Created**: 2026-11-01

**Status**: Draft

**Input**: User description: "Hiện tại ở mục quản lý lesson, tôi muốn 1 lessons có thể có thêm nhiều video ở youtube tham khảo nữa. Ví dụ đây là 1 link youtube https://www.youtube.com/watch?v=Zf-VMEgCxGE&t=3179s người dùng có thể xem video này trên route http://localhost:3000/lessons/ham-so/video"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learner Views Reference Videos on Dedicated Tab (Priority: P1)

As a learner studying a lesson with slug (e.g. `/lessons/ham-so`),
I want to navigate to the `/lessons/[slug]/video` route via a dedicated "Video" tab,
So that I can watch curated YouTube reference videos with start timestamps, view video titles/notes, and switch between multiple videos in a playlist.

**Why this priority**: Core value requested by the user. Students need immediate visual access to reference lectures and walkthroughs directly within the lesson learning environment.

**Independent Test**: Can be tested by navigating directly to `http://localhost:3000/lessons/ham-so/video` (or any valid lesson slug), verifying that the video player renders, loads the embedded YouTube player, respects start timestamps (e.g. `t=3179s` -> start at second 3179), and displays a playlist of reference videos if more than one exists.

**Acceptance Scenarios**:

1. **Given** a lesson with slug `ham-so` that has one or more reference videos,
   **When** the student navigates to `/lessons/ham-so/video`,
   **Then** the page renders within the lesson tab layout, highlighting the "Video" tab in `LessonTabsBar`, and embeds the YouTube video player (using a secure embedded iframe e.g. `https://www.youtube-nocookie.com/embed/{video_id}?start={start_seconds}`).
2. **Given** a reference video URL containing a timestamp (e.g. `https://www.youtube.com/watch?v=Zf-VMEgCxGE&t=3179s`),
   **When** the player loads,
   **Then** the video starts playback from the specified timestamp offset (3179 seconds).
3. **Given** a lesson with multiple reference videos,
   **When** the student selects a different video from the video list/playlist in the tab,
   **Then** the active player switches smoothly to the selected video and displays its title and notes.
4. **Given** a lesson with zero reference videos,
   **When** the student navigates to `/lessons/[slug]/video`,
   **Then** the page shows a clear and friendly empty state message (e.g., "Chưa có video tham khảo cho bài học này").

---

### User Story 2 - Educator Manages YouTube Videos in Lesson Management (Priority: P2)

As a teacher or administrator managing lessons in `/teacher/lessons/[id]/edit` (or new lesson form),
I want to add, update, reorder, and remove multiple YouTube video links for a lesson,
So that I can easily curate rich multimedia resources for students.

**Why this priority**: Without management capabilities, teachers cannot attach or maintain video links for lessons.

**Independent Test**: Can be tested by opening `/teacher/lessons/[id]/edit`, navigating to the reference video management section, adding a YouTube URL (`https://www.youtube.com/watch?v=Zf-VMEgCxGE&t=3179s`) with title "Giải bài tập hàm số - Phần 1", saving, and verifying the videos are persisted and displayed correctly in edit mode and learner view.

**Acceptance Scenarios**:

1. **Given** a teacher editing or creating a lesson,
   **When** the teacher adds a new video entry with a title and valid YouTube URL,
   **Then** the system parses the video URL to extract the video ID and any timestamp parameter, providing instant preview or metadata validation.
2. **Given** an invalid or unsupported video URL (e.g., non-YouTube URL or invalid ID format),
   **When** the teacher attempts to save or add,
   **Then** the form displays an inline validation error indicating that a valid YouTube link is required.
3. **Given** a list of existing videos for a lesson,
   **When** the teacher modifies video titles, changes order, or deletes a video and submits the changes,
   **Then** the database updates atomically and reflects the changes immediately.

---

### User Story 3 - API Contracts & Domain Persistence for Lesson Videos (Priority: P3)

As a backend service and API consumer,
I want explicit domain entities, SQLModel database tables, and Pydantic schemas for lesson videos,
So that video data is strongly typed, validated, and queryable with zero drift between frontend and backend.

**Why this priority**: Aligns with Constitution Principle I (Lightweight DDD) and Principle II (Single Source of Truth Contracts).

**Independent Test**: Unit test backend use cases (`create_lesson_video`, `list_lesson_videos`, `update_lesson_videos`) and verify OpenAPI schema generation via `make generate-api`.

**Acceptance Scenarios**:

1. **Given** a request to `GET /api/v1/lessons/by-slug/{slug}` or `GET /api/v1/lessons/{lesson_id}`,
   **When** the lesson details are fetched,
   **Then** the response includes a `videos: list[LessonVideoOut]` field sorted by `order`.
2. **Given** a teacher updating lesson videos via `PUT/POST /api/v1/lessons/{lesson_id}/videos` (or embedded in lesson update payload),
   **When** valid video payloads are sent,
   **Then** the database persists the records in a `lesson_videos` table linked via foreign key with `ON DELETE CASCADE`.

---

### Edge Cases

- **Various YouTube URL formats**: The system MUST support standard formats:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtube.com/watch?v=VIDEO_ID&t=3179s`
  - `https://youtu.be/VIDEO_ID?t=3179`
  - `https://www.youtube.com/embed/VIDEO_ID?start=3179`
  - `https://www.youtube.com/live/VIDEO_ID?t=3179`
  - URLs with extra query parameters (e.g., `&feature=shared`, `&si=...`).
- **Timestamp parsing**: Supports seconds (`t=3179s`, `t=3179`), minutes/seconds (`t=52m59s`), and hours/minutes/seconds (`t=1h2m3s`).
- **Lesson deletion cascade**: Deleting a lesson MUST automatically delete all associated `lesson_videos` via database foreign key cascade without orphaned rows.
- **Empty or null timestamps**: If no timestamp is provided in the URL, start offset defaults to 0.
- **Empty video list**: When `videos` is empty, API returns `[]` (not null), frontend shows clean empty state without throwing render errors.
- **Responsive embed**: On mobile viewports, the YouTube player iframe MUST maintain a 16:9 aspect ratio without overflowing or breaking layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define a `lesson_videos` persistence table and domain entity `LessonVideo` containing: `id` (UUID), `lesson_id` (UUID FK), `title` (str), `url` (str), `youtube_video_id` (str), `start_seconds` (int, default 0), `order` (int, default 0), `description` (str, optional), `created_at` (datetime), `updated_at` (datetime).
- **FR-002**: The system MUST provide utility logic (both backend and frontend) to parse YouTube URLs, extracting `youtube_video_id` and optional `start_seconds`.
- **FR-003**: The backend API MUST expose endpoints / DTO fields to retrieve lesson reference videos: `LessonDetailOut` MUST include `videos: list[LessonVideoOut]`, and dedicated routes MUST be provided to manage videos (`PUT /api/v1/lessons/{lesson_id}/videos` or equivalent).
- **FR-004**: The frontend MUST implement the `/lessons/[slug]/video` route under `apps/web/app/(root)/lessons/[slug]/(tabs)/video/page.tsx` within the existing lesson tab layout.
- **FR-005**: The `LessonTabsBar` component MUST include a "Video" tab (label: "Video", icon: `Video`, href: `/lessons/[slug]/video`) that highlights as active when on the `/lessons/[slug]/video` path.
- **FR-006**: In the teacher lesson editor (`LessonEditorPage` or `LessonForm`), the system MUST provide an intuitive UI to add, edit, reorder, and remove YouTube reference videos for a lesson.
- **FR-007**: When watching a video on `/lessons/[slug]/video`, the video player MUST embed `https://www.youtube-nocookie.com/embed/{youtube_video_id}` with `start={start_seconds}` and standard player parameters (`rel=0`, `modestbranding=1`).
- **FR-008**: The database migration MUST be created using Alembic (`make alembic-revision`) ensuring backward compatibility and foreign key cascade on lesson deletion.
